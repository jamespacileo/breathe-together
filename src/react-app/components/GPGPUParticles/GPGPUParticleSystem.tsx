import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { WordAnimationPhase } from '../../hooks/useWordFormation';
import {
	findNearestParticles,
	textToParticlePositions,
} from '../../lib/textToParticles';
import { estimateParticleCount, getRandomWord } from '../../lib/wordContent';
import {
	particleFragmentShader,
	particleVertexShader,
	simulationFragmentShader,
	simulationVertexShader,
	sphereFragmentShader,
	sphereVertexShader,
} from '../../shaders';
import type { EnhancedBreathData } from './GPGPUScene';

interface GPGPUParticleSystemProps {
	breathData: EnhancedBreathData;
	expandedRadius: number;
	contractedRadius: number;
}

// FBO size - number of particles = size^2
const FBO_SIZE = 56; // ~3136 particles - slightly fewer for better performance
const PARTICLE_COUNT = FBO_SIZE * FBO_SIZE;

export function GPGPUParticleSystem({
	breathData,
	expandedRadius,
	contractedRadius,
}: GPGPUParticleSystemProps) {
	const { gl } = useThree();
	const pointsRef = useRef<THREE.Points>(null);
	const sphereRef = useRef<THREE.Mesh>(null);
	const sphereMaterialRef = useRef<THREE.ShaderMaterial>(null);
	const birthProgressRef = useRef(0); // Tracks entry animation progress
	const currentTargetRef = useRef(0); // GPGPU ping-pong target

	// === WORD FORMATION STATE ===
	const sessionStartRef = useRef(Date.now());
	const breathsSinceWordRef = useRef(0);
	const prevPhaseRef = useRef<string>('');
	const wordAnimationStartRef = useRef(0);
	const recentWordsRef = useRef<string[]>([]);
	const [wordState, setWordState] = useState<{
		phase: WordAnimationPhase;
		progress: number;
		currentWord: string | null;
		selectedIndices: number[];
		letterIndices: number[];
	}>({
		phase: 'idle',
		progress: 0,
		currentWord: null,
		selectedIndices: [],
		letterIndices: [],
	});

	// More saturated color palette for visible, gem-like particles
	const colorPalette = useMemo(
		() => [
			new THREE.Color(0x4db8cc), // Vibrant teal
			new THREE.Color(0x7ba3d4), // Clear blue
			new THREE.Color(0xb894d4), // Vivid lavender
			new THREE.Color(0xd4a0a0), // Rose pink
			new THREE.Color(0x7dd4b8), // Bright mint
			new THREE.Color(0xd4c490), // Warm gold
			new THREE.Color(0x90d4a8), // Fresh green
			new THREE.Color(0xa0b8e0), // Sky blue
		],
		[],
	);

	// Create GPGPU simulation
	const gpgpu = useMemo(() => {
		const floatType = gl.capabilities.isWebGL2
			? THREE.FloatType
			: gl.extensions.get('OES_texture_float')
				? THREE.FloatType
				: THREE.HalfFloatType;

		const createRenderTarget = () =>
			new THREE.WebGLRenderTarget(FBO_SIZE, FBO_SIZE, {
				minFilter: THREE.NearestFilter,
				magFilter: THREE.NearestFilter,
				format: THREE.RGBAFormat,
				type: floatType,
				depthBuffer: false,
				stencilBuffer: false,
			});

		const positionTargetA = createRenderTarget();
		const positionTargetB = createRenderTarget();

		const positionData = new Float32Array(PARTICLE_COUNT * 4);
		const originalPositionData = new Float32Array(PARTICLE_COUNT * 4);

		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const i4 = i * 4;

			// Spherical shell distribution
			const radius = 10 + Math.random() * 8;
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);

			const x = radius * Math.sin(phi) * Math.cos(theta);
			const y = radius * Math.sin(phi) * Math.sin(theta);
			const z = radius * Math.cos(phi);

			positionData[i4] = x;
			positionData[i4 + 1] = y;
			positionData[i4 + 2] = z;
			positionData[i4 + 3] = Math.random();

			originalPositionData[i4] = x;
			originalPositionData[i4 + 1] = y;
			originalPositionData[i4 + 2] = z;
			originalPositionData[i4 + 3] = Math.random() * Math.PI * 2;
		}

		const positionTexture = new THREE.DataTexture(
			positionData,
			FBO_SIZE,
			FBO_SIZE,
			THREE.RGBAFormat,
			floatType,
		);
		positionTexture.needsUpdate = true;

		const originalPositionTexture = new THREE.DataTexture(
			originalPositionData,
			FBO_SIZE,
			FBO_SIZE,
			THREE.RGBAFormat,
			floatType,
		);
		originalPositionTexture.needsUpdate = true;

		// Word formation data texture: xyz = target word position, w = letter index (-1 = not forming)
		const wordFormationData = new Float32Array(PARTICLE_COUNT * 4);
		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const i4 = i * 4;
			wordFormationData[i4] = 0;
			wordFormationData[i4 + 1] = 0;
			wordFormationData[i4 + 2] = 0;
			wordFormationData[i4 + 3] = -1; // -1 = not forming a word
		}
		const wordFormationTexture = new THREE.DataTexture(
			wordFormationData,
			FBO_SIZE,
			FBO_SIZE,
			THREE.RGBAFormat,
			floatType,
		);
		wordFormationTexture.needsUpdate = true;

		const simulationMaterial = new THREE.ShaderMaterial({
			vertexShader: simulationVertexShader,
			fragmentShader: simulationFragmentShader,
			uniforms: {
				uPositions: { value: positionTexture },
				uOriginalPositions: { value: originalPositionTexture },
				uTime: { value: 0 },
				uBreathPhase: { value: 0 },
				uPhaseType: { value: 0 },
				uExpandedRadius: { value: 0 }, // Updated every frame in useFrame
				uContractedRadius: { value: 0 }, // Updated every frame in useFrame
				// Subtle effect uniforms
				uAnticipation: { value: 0 },
				uOvershoot: { value: 0 },
				uDiaphragmDirection: { value: 0 },
				uCrystallization: { value: 0 },
				uBreathWave: { value: 0 },
				uViewOffset: { value: new THREE.Vector2(0, 0) },
				uPhaseTransitionBlend: { value: 0 },
				// Word formation uniforms
				uWordFormationData: { value: wordFormationTexture },
				uWordFormationActive: { value: 0 },
				uWordFormationProgress: { value: 0 },
				uWordFormationPhase: { value: 0 },
			},
			defines: {
				resolution: `vec2(${FBO_SIZE}.0, ${FBO_SIZE}.0)`,
			},
		});

		const simulationScene = new THREE.Scene();
		const simulationCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
		const quadGeometry = new THREE.PlaneGeometry(2, 2);
		const quadMesh = new THREE.Mesh(quadGeometry, simulationMaterial);
		simulationScene.add(quadMesh);

		return {
			positionTargetA,
			positionTargetB,
			positionTexture,
			originalPositionTexture,
			originalPositionData,
			wordFormationTexture,
			wordFormationData,
			simulationMaterial,
			simulationScene,
			simulationCamera,
			quadGeometry,
		};
		// Note: expandedRadius/contractedRadius are NOT dependencies here
		// They're updated every frame via uniforms in useFrame
	}, [gl]);

	// Create particle geometry
	const { geometry, material } = useMemo(() => {
		const particleGeometry = new THREE.BufferGeometry();

		const references = new Float32Array(PARTICLE_COUNT * 2);
		const sizes = new Float32Array(PARTICLE_COUNT);
		const phases = new Float32Array(PARTICLE_COUNT);
		const colors = new Float32Array(PARTICLE_COUNT * 3);
		const birthDelays = new Float32Array(PARTICLE_COUNT); // NEW: staggered birth

		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const x = (i % FBO_SIZE) / FBO_SIZE;
			const y = Math.floor(i / FBO_SIZE) / FBO_SIZE;

			references[i * 2] = x;
			references[i * 2 + 1] = y;

			sizes[i] = 0.8 + Math.random() * 1.2;
			phases[i] = Math.random();

			// Birth delay: particles closer to center emerge first
			// Creates a wave-like appearance as particles "bloom" outward
			const distFromCenter = Math.sqrt((x - 0.5) ** 2 + (y - 0.5) ** 2);
			birthDelays[i] = distFromCenter * 2.0 + Math.random() * 0.3;

			const color =
				colorPalette[Math.floor(Math.random() * colorPalette.length)];
			colors[i * 3] = color.r;
			colors[i * 3 + 1] = color.g;
			colors[i * 3 + 2] = color.b;
		}

		particleGeometry.setAttribute(
			'aReference',
			new THREE.BufferAttribute(references, 2),
		);
		particleGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
		particleGeometry.setAttribute(
			'aPhase',
			new THREE.BufferAttribute(phases, 1),
		);
		particleGeometry.setAttribute(
			'aColor',
			new THREE.BufferAttribute(colors, 3),
		);
		particleGeometry.setAttribute(
			'aBirthDelay',
			new THREE.BufferAttribute(birthDelays, 1),
		);

		const positions = new Float32Array(PARTICLE_COUNT * 3);
		particleGeometry.setAttribute(
			'position',
			new THREE.BufferAttribute(positions, 3),
		);

		const particleMaterial = new THREE.ShaderMaterial({
			vertexShader: particleVertexShader,
			fragmentShader: particleFragmentShader,
			uniforms: {
				uPositions: { value: gpgpu.positionTexture },
				uTime: { value: 0 },
				uBreathPhase: { value: 0 },
				uPhaseType: { value: 0 },
				uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
				// New subtle effect uniforms
				uColorTemperature: { value: 0 },
				uCrystallization: { value: 0 },
				uBreathWave: { value: 0 },
				uBirthProgress: { value: 0 },
				// Word formation uniforms
				uWordFormationData: { value: gpgpu.wordFormationTexture },
				uWordFormationActive: { value: 0 },
			},
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			depthTest: true,
		});

		return { geometry: particleGeometry, material: particleMaterial };
	}, [gpgpu, colorPalette]);

	// Sphere material
	const sphereMaterial = useMemo(() => {
		return new THREE.ShaderMaterial({
			vertexShader: sphereVertexShader,
			fragmentShader: sphereFragmentShader,
			uniforms: {
				uTime: { value: 0 },
				uBreathPhase: { value: 0 },
				uPhaseType: { value: 0 },
				uColorTemperature: { value: 0 },
				uCrystallization: { value: 0 },
				uColor1: { value: new THREE.Color(0x1a2a3a) },
				uColor2: { value: new THREE.Color(0x2a3a4a) },
			},
			transparent: true,
			side: THREE.FrontSide,
			depthWrite: false,
		});
	}, []);

	// Cleanup WebGL resources on unmount
	useEffect(() => {
		return () => {
			gpgpu.positionTargetA.dispose();
			gpgpu.positionTargetB.dispose();
			gpgpu.positionTexture.dispose();
			gpgpu.originalPositionTexture.dispose();
			gpgpu.wordFormationTexture.dispose();
			gpgpu.simulationMaterial.dispose();
			gpgpu.quadGeometry.dispose();
			geometry.dispose();
			material.dispose();
			sphereMaterial.dispose();
		};
	}, [gpgpu, geometry, material, sphereMaterial]);

	// Animation loop
	useFrame((state) => {
		const time = state.clock.elapsedTime;

		// Update birth progress (ramps from 0 to 2 over first 3 seconds)
		// This creates the "blooming" entry animation
		birthProgressRef.current = Math.min(2, time / 1.5);

		// Destructure breath data
		const {
			breathPhase,
			phaseType,
			anticipation,
			overshoot,
			diaphragmDirection,
			colorTemperature,
			crystallization,
			breathWave,
			viewOffset,
			phaseTransitionBlend,
		} = breathData;

		// Update simulation uniforms
		const simUniforms = gpgpu.simulationMaterial.uniforms;
		simUniforms.uTime.value = time;
		simUniforms.uBreathPhase.value = breathPhase;
		simUniforms.uPhaseType.value = phaseType;
		simUniforms.uExpandedRadius.value = expandedRadius;
		simUniforms.uContractedRadius.value = contractedRadius;
		// New subtle effect uniforms
		simUniforms.uAnticipation.value = anticipation;
		simUniforms.uOvershoot.value = overshoot;
		simUniforms.uDiaphragmDirection.value = diaphragmDirection;
		simUniforms.uCrystallization.value = crystallization;
		simUniforms.uBreathWave.value = breathWave;
		simUniforms.uViewOffset.value.set(viewOffset.x, viewOffset.y);
		simUniforms.uPhaseTransitionBlend.value = phaseTransitionBlend;

		// === WORD FORMATION LOGIC ===
		// Animation timing constants
		const FORMING_DURATION = 1.5;
		const HOLDING_DURATION = 1.2;
		const DISSOLVING_DURATION = 1.3;
		const TOTAL_DURATION =
			FORMING_DURATION + HOLDING_DURATION + DISSOLVING_DURATION;

		// Get breath phase name from phaseType
		const phaseNames = ['in', 'hold-in', 'out', 'hold-out'] as const;
		const currentPhaseName = phaseNames[phaseType] || 'out';

		// Detect inhale start
		if (currentPhaseName === 'in' && prevPhaseRef.current !== 'in') {
			// Check if we should trigger a word
			if (wordState.phase === 'idle') {
				const sessionDuration = (Date.now() - sessionStartRef.current) / 1000;
				const breathsSinceWord = breathsSinceWordRef.current;

				// Minimum 2 breath gap
				if (breathsSinceWord >= 2) {
					// Calculate probability based on session duration
					let probability = 0.2; // Base 1 in 5
					if (sessionDuration < 60) {
						probability = 0.05; // Very rare in first minute
					} else if (sessionDuration > 180) {
						probability = 0.3; // More common after 3 minutes
					}

					if (Math.random() < probability) {
						// Trigger a new word!
						breathsSinceWordRef.current = 0;
						wordAnimationStartRef.current = time;

						// Get a random word
						const wordEntry = getRandomWord(recentWordsRef.current);
						recentWordsRef.current = [
							wordEntry.text,
							...recentWordsRef.current.slice(0, 4),
						];

						// Generate particle positions for the word
						const particleData = textToParticlePositions(wordEntry.text, {
							targetCount: estimateParticleCount(wordEntry.text),
							zOffset: 18,
							scale: 1.0,
						});

						// Use original positions for nearest neighbor search
						// This ensures particles are selected from their "home" positions
						const selectedIndices = findNearestParticles(
							particleData.positions,
							gpgpu.originalPositionData,
							PARTICLE_COUNT,
						);

						// Update the word formation data texture
						for (let i = 0; i < PARTICLE_COUNT; i++) {
							const i4 = i * 4;
							gpgpu.wordFormationData[i4 + 3] = -1; // Reset all to not forming
						}

						for (let j = 0; j < selectedIndices.length; j++) {
							const particleIdx = selectedIndices[j];
							const wordPos = particleData.positions[j];
							const letterIdx = particleData.letterIndices[j];

							const i4 = particleIdx * 4;
							gpgpu.wordFormationData[i4] = wordPos.x;
							gpgpu.wordFormationData[i4 + 1] = wordPos.y;
							gpgpu.wordFormationData[i4 + 2] = wordPos.z;
							gpgpu.wordFormationData[i4 + 3] = letterIdx;
						}

						gpgpu.wordFormationTexture.needsUpdate = true;

						setWordState({
							phase: 'forming',
							progress: 0,
							currentWord: wordEntry.text,
							selectedIndices,
							letterIndices: particleData.letterIndices,
						});
					} else {
						breathsSinceWordRef.current++;
					}
				} else {
					breathsSinceWordRef.current++;
				}
			}
		}
		prevPhaseRef.current = currentPhaseName;

		// Update word animation state
		if (wordState.phase !== 'idle') {
			const elapsed = time - wordAnimationStartRef.current;
			let newPhase: WordAnimationPhase = 'forming';
			let progress = 0;

			if (elapsed < FORMING_DURATION) {
				newPhase = 'forming';
				progress = elapsed / FORMING_DURATION;
			} else if (elapsed < FORMING_DURATION + HOLDING_DURATION) {
				newPhase = 'holding';
				progress = (elapsed - FORMING_DURATION) / HOLDING_DURATION;
			} else if (elapsed < TOTAL_DURATION) {
				newPhase = 'dissolving';
				progress =
					(elapsed - FORMING_DURATION - HOLDING_DURATION) / DISSOLVING_DURATION;
			} else {
				// Animation complete - reset
				newPhase = 'idle';
				progress = 0;

				// Clear word formation data
				for (let i = 0; i < PARTICLE_COUNT; i++) {
					gpgpu.wordFormationData[i * 4 + 3] = -1;
				}
				gpgpu.wordFormationTexture.needsUpdate = true;
			}

			if (
				newPhase !== wordState.phase ||
				Math.abs(progress - wordState.progress) > 0.01
			) {
				setWordState((prev) => ({
					...prev,
					phase: newPhase,
					progress,
				}));
			}

			// Update word formation uniforms
			simUniforms.uWordFormationActive.value = newPhase !== 'idle' ? 1.0 : 0.0;
			simUniforms.uWordFormationProgress.value = elapsed / TOTAL_DURATION;
			simUniforms.uWordFormationPhase.value =
				newPhase === 'forming'
					? 1
					: newPhase === 'holding'
						? 2
						: newPhase === 'dissolving'
							? 3
							: 0;
		} else {
			simUniforms.uWordFormationActive.value = 0.0;
			simUniforms.uWordFormationProgress.value = 0.0;
			simUniforms.uWordFormationPhase.value = 0;
		}

		const currentTarget = currentTargetRef.current;
		const readTarget =
			currentTarget === 0 ? gpgpu.positionTargetA : gpgpu.positionTargetB;
		const writeTarget =
			currentTarget === 0 ? gpgpu.positionTargetB : gpgpu.positionTargetA;

		gpgpu.simulationMaterial.uniforms.uPositions.value =
			currentTarget === 0 && time < 0.1
				? gpgpu.positionTexture
				: readTarget.texture;

		gl.setRenderTarget(writeTarget);
		gl.render(gpgpu.simulationScene, gpgpu.simulationCamera);
		gl.setRenderTarget(null);

		currentTargetRef.current = 1 - currentTarget;

		// Update particle material uniforms
		const partUniforms = material.uniforms;
		partUniforms.uPositions.value = writeTarget.texture;
		partUniforms.uTime.value = time;
		partUniforms.uBreathPhase.value = breathPhase;
		partUniforms.uPhaseType.value = phaseType;
		// New subtle effect uniforms
		partUniforms.uColorTemperature.value = colorTemperature;
		partUniforms.uCrystallization.value = crystallization;
		partUniforms.uBreathWave.value = breathWave;
		partUniforms.uBirthProgress.value = birthProgressRef.current;
		// Word formation uniforms for particle shader
		partUniforms.uWordFormationActive.value =
			wordState.phase !== 'idle' ? 1.0 : 0.0;

		// Update sphere with phase-specific colors
		if (sphereMaterialRef.current) {
			const sphereUniforms = sphereMaterialRef.current.uniforms;
			sphereUniforms.uTime.value = time;
			sphereUniforms.uBreathPhase.value = breathPhase;
			sphereUniforms.uPhaseType.value = phaseType;
			sphereUniforms.uColorTemperature.value = colorTemperature;
			sphereUniforms.uCrystallization.value = crystallization;
		}

		// Scale sphere with breathing - MORE expansion on exhale
		// breathPhase: 0 = exhaled (expanded), 1 = inhaled (contracted)
		if (sphereRef.current) {
			// Base contracted size when inhaled
			const minScale = contractedRadius * 0.35;
			// Maximum expanded size when exhaled - significantly larger
			const maxScale = contractedRadius * 0.7;
			// Interpolate: when breathPhase=0 (exhaled) -> maxScale, breathPhase=1 (inhaled) -> minScale
			const sphereScale = minScale + (maxScale - minScale) * (1 - breathPhase);
			sphereRef.current.scale.setScalar(sphereScale);
		}
	});

	return (
		<group>
			{/* Central sphere */}
			<mesh ref={sphereRef}>
				<sphereGeometry args={[1, 48, 48]} />
				<primitive object={sphereMaterial} ref={sphereMaterialRef} />
			</mesh>

			{/* Orbiting particles */}
			<points ref={pointsRef} geometry={geometry} material={material} />
		</group>
	);
}
