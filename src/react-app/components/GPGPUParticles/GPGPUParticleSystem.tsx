import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { getWordPoints } from '../../lib/glyphs';
import { WORD_CONFIG, WORD_LIST } from '../../lib/wordSystem';
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

// Word formation state
interface WordState {
	isForming: boolean;
	word: string | null;
	startTime: number;
	progress: number;
	recruitedIndices: number[];
	targetPositions: Array<{
		x: number;
		y: number;
		z: number;
		letterIndex: number;
	}>;
	letterCount: number;
}

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

	// Word system state
	const wordStateRef = useRef<WordState>({
		isForming: false,
		word: null,
		startTime: 0,
		progress: 0,
		recruitedIndices: [],
		targetPositions: [],
		letterCount: 0,
	});
	const inhaleCountRef = useRef(0);
	const lastWordInhaleRef = useRef(0);
	const sessionStartTimeRef = useRef(Date.now());
	const lastPhaseTypeRef = useRef(-1);
	const usedWordsRef = useRef<Set<string>>(new Set());

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

		// Word formation textures
		// wordTargetsData: xyz = target position, w = letter index
		const wordTargetsData = new Float32Array(PARTICLE_COUNT * 4);
		const wordTargetsTexture = new THREE.DataTexture(
			wordTargetsData,
			FBO_SIZE,
			FBO_SIZE,
			THREE.RGBAFormat,
			floatType,
		);
		wordTargetsTexture.needsUpdate = true;

		// wordParticlesData: r = isWordParticle (0/1), g = unused, b = letterCount, a = unused
		const wordParticlesData = new Float32Array(PARTICLE_COUNT * 4);
		const wordParticlesTexture = new THREE.DataTexture(
			wordParticlesData,
			FBO_SIZE,
			FBO_SIZE,
			THREE.RGBAFormat,
			floatType,
		);
		wordParticlesTexture.needsUpdate = true;

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
				uWordTargets: { value: wordTargetsTexture },
				uWordParticles: { value: wordParticlesTexture },
				uWordProgress: { value: 0 },
				uWordFormationEnd: { value: WORD_CONFIG.FORMATION_END },
				uWordLetterOverlap: { value: WORD_CONFIG.LETTER_OVERLAP },
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
			wordTargetsTexture,
			wordTargetsData,
			wordParticlesTexture,
			wordParticlesData,
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
				uWordParticles: { value: gpgpu.wordParticlesTexture },
				uWordProgress: { value: 0 },
				uWordFormationEnd: { value: WORD_CONFIG.FORMATION_END },
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
			gpgpu.wordTargetsTexture.dispose();
			gpgpu.wordParticlesTexture.dispose();
			gpgpu.simulationMaterial.dispose();
			gpgpu.quadGeometry.dispose();
			geometry.dispose();
			material.dispose();
			sphereMaterial.dispose();
		};
	}, [gpgpu, geometry, material, sphereMaterial]);

	// Select a random word from the list
	const selectWord = useCallback(() => {
		const availableWords = WORD_LIST.filter(
			(w) => !usedWordsRef.current.has(w),
		);
		if (availableWords.length === 0) {
			usedWordsRef.current.clear();
			return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
		}
		const word =
			availableWords[Math.floor(Math.random() * availableWords.length)];
		usedWordsRef.current.add(word);
		if (usedWordsRef.current.size > WORD_LIST.length / 2) {
			const entries = Array.from(usedWordsRef.current);
			for (let i = 0; i < entries.length / 2; i++) {
				usedWordsRef.current.delete(entries[i]);
			}
		}
		return word;
	}, []);

	// Helper: Find nearest particle to a target position
	const findNearestParticle = useCallback(
		(
			target: { x: number; y: number; z: number },
			currentPositions: Float32Array,
			usedIndices: Set<number>,
		): number => {
			let nearestIdx = -1;
			let nearestDist = Infinity;

			for (let i = 0; i < PARTICLE_COUNT; i++) {
				if (usedIndices.has(i)) continue;

				const px = currentPositions[i * 4];
				const py = currentPositions[i * 4 + 1];
				const pz = currentPositions[i * 4 + 2];

				const dx = px - target.x;
				const dy = py - target.y;
				const dz = pz - target.z;
				const dist = dx * dx + dy * dy + dz * dz;

				if (dist < nearestDist) {
					nearestDist = dist;
					nearestIdx = i;
				}
			}

			return nearestIdx;
		},
		[],
	);

	// Recruit particles for word formation using nearest-neighbor algorithm
	const recruitParticles = useCallback(
		(
			targetPositions: Array<{
				x: number;
				y: number;
				z: number;
				letterIndex: number;
			}>,
			currentPositions: Float32Array,
		): number[] => {
			const usedIndices = new Set<number>();
			const recruited: number[] = [];

			for (const target of targetPositions) {
				const nearestIdx = findNearestParticle(
					target,
					currentPositions,
					usedIndices,
				);
				if (nearestIdx >= 0) {
					usedIndices.add(nearestIdx);
					recruited.push(nearestIdx);
				}
			}

			return recruited;
		},
		[findNearestParticle],
	);

	// Trigger word formation
	const triggerWordFormation = useCallback(
		(time: number, currentPositions: Float32Array) => {
			const word = selectWord();
			const targetPositions = getWordPoints(
				word,
				WORD_CONFIG.PARTICLES_PER_LETTER,
				WORD_CONFIG.WORD_SCALE,
			);

			const recruitedIndices = recruitParticles(
				targetPositions,
				currentPositions,
			);
			const letterCount = word.replace(/\s/g, '').length;

			// Update word textures
			const wordTargetsData = gpgpu.wordTargetsData;
			const wordParticlesData = gpgpu.wordParticlesData;

			// Clear previous data
			wordTargetsData.fill(0);
			wordParticlesData.fill(0);

			// Set target positions and mark word particles
			for (let i = 0; i < recruitedIndices.length; i++) {
				const particleIdx = recruitedIndices[i];
				const target = targetPositions[i];

				// Word targets: xyz = position, w = letterIndex
				wordTargetsData[particleIdx * 4] = target.x;
				wordTargetsData[particleIdx * 4 + 1] = target.y;
				wordTargetsData[particleIdx * 4 + 2] = target.z;
				wordTargetsData[particleIdx * 4 + 3] = target.letterIndex;

				// Word particles: r = isWordParticle, g = unused, b = letterCount
				wordParticlesData[particleIdx * 4] = 1.0;
				wordParticlesData[particleIdx * 4 + 1] = 0;
				wordParticlesData[particleIdx * 4 + 2] = letterCount;
				wordParticlesData[particleIdx * 4 + 3] = 0;
			}

			gpgpu.wordTargetsTexture.needsUpdate = true;
			gpgpu.wordParticlesTexture.needsUpdate = true;

			wordStateRef.current = {
				isForming: true,
				word,
				startTime: time,
				progress: 0,
				recruitedIndices,
				targetPositions,
				letterCount,
			};

			lastWordInhaleRef.current = inhaleCountRef.current;
		},
		[gpgpu, selectWord, recruitParticles],
	);

	// End word formation
	const endWordFormation = useCallback(() => {
		// Clear word particle data
		gpgpu.wordParticlesData.fill(0);
		gpgpu.wordParticlesTexture.needsUpdate = true;

		wordStateRef.current = {
			isForming: false,
			word: null,
			startTime: 0,
			progress: 0,
			recruitedIndices: [],
			targetPositions: [],
			letterCount: 0,
		};
	}, [gpgpu]);

	// Check if should trigger word
	const shouldTriggerWord = useCallback(() => {
		if (
			inhaleCountRef.current - lastWordInhaleRef.current <
			WORD_CONFIG.MIN_GAP
		) {
			return false;
		}

		const sessionDuration = (Date.now() - sessionStartTimeRef.current) / 1000;
		const ramp = Math.min(sessionDuration / WORD_CONFIG.RAMP_DURATION, 1);
		const probability =
			WORD_CONFIG.BASE_PROBABILITY +
			(WORD_CONFIG.MAX_PROBABILITY - WORD_CONFIG.BASE_PROBABILITY) * ramp;

		return Math.random() < probability;
	}, []);

	// Helper: Handle word trigger on inhale
	const handleWordTrigger = useCallback(
		(timeMs: number, phaseType: number) => {
			if (phaseType !== 0 || lastPhaseTypeRef.current === 0) return;

			inhaleCountRef.current++;
			if (wordStateRef.current.isForming || !shouldTriggerWord()) return;

			const currentTarget = currentTargetRef.current;
			const readTarget =
				currentTarget === 0 ? gpgpu.positionTargetA : gpgpu.positionTargetB;

			const positions = new Float32Array(PARTICLE_COUNT * 4);
			gl.readRenderTargetPixels(
				readTarget,
				0,
				0,
				FBO_SIZE,
				FBO_SIZE,
				positions,
			);
			triggerWordFormation(timeMs, positions);
		},
		[gpgpu, gl, shouldTriggerWord, triggerWordFormation],
	);

	// Helper: Update word animation state
	const updateWordProgress = useCallback(
		(timeMs: number) => {
			if (!wordStateRef.current.isForming) return;

			const elapsed = timeMs - wordStateRef.current.startTime;
			wordStateRef.current.progress = Math.min(
				1,
				elapsed / WORD_CONFIG.WORD_DURATION,
			);

			if (wordStateRef.current.progress >= 1) {
				endWordFormation();
			}
		},
		[endWordFormation],
	);

	// Helper: Update simulation uniforms
	const updateSimulationUniforms = useCallback(
		(time: number, data: EnhancedBreathData) => {
			const simUniforms = gpgpu.simulationMaterial.uniforms;
			simUniforms.uTime.value = time;
			simUniforms.uBreathPhase.value = data.breathPhase;
			simUniforms.uPhaseType.value = data.phaseType;
			simUniforms.uExpandedRadius.value = expandedRadius;
			simUniforms.uContractedRadius.value = contractedRadius;
			simUniforms.uAnticipation.value = data.anticipation;
			simUniforms.uOvershoot.value = data.overshoot;
			simUniforms.uDiaphragmDirection.value = data.diaphragmDirection;
			simUniforms.uCrystallization.value = data.crystallization;
			simUniforms.uBreathWave.value = data.breathWave;
			simUniforms.uViewOffset.value.set(data.viewOffset.x, data.viewOffset.y);
			simUniforms.uPhaseTransitionBlend.value = data.phaseTransitionBlend;
			simUniforms.uWordProgress.value = wordStateRef.current.progress;
		},
		[gpgpu, expandedRadius, contractedRadius],
	);

	// Animation loop
	useFrame((state) => {
		const time = state.clock.elapsedTime;
		const timeMs = time * 1000;

		birthProgressRef.current = Math.min(2, time / 1.5);

		// Handle word formation
		handleWordTrigger(timeMs, breathData.phaseType);
		lastPhaseTypeRef.current = breathData.phaseType;
		updateWordProgress(timeMs);

		// Update simulation uniforms
		updateSimulationUniforms(time, breathData);

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
		partUniforms.uBreathPhase.value = breathData.breathPhase;
		partUniforms.uPhaseType.value = breathData.phaseType;
		partUniforms.uColorTemperature.value = breathData.colorTemperature;
		partUniforms.uCrystallization.value = breathData.crystallization;
		partUniforms.uBreathWave.value = breathData.breathWave;
		partUniforms.uBirthProgress.value = birthProgressRef.current;
		partUniforms.uWordProgress.value = wordStateRef.current.progress;

		// Update sphere uniforms
		if (sphereMaterialRef.current) {
			const sphereUniforms = sphereMaterialRef.current.uniforms;
			sphereUniforms.uTime.value = time;
			sphereUniforms.uBreathPhase.value = breathData.breathPhase;
			sphereUniforms.uPhaseType.value = breathData.phaseType;
			sphereUniforms.uColorTemperature.value = breathData.colorTemperature;
			sphereUniforms.uCrystallization.value = breathData.crystallization;
		}

		// Scale sphere with breathing
		if (sphereRef.current) {
			const minScale = contractedRadius * 0.35;
			const maxScale = contractedRadius * 0.7;
			const sphereScale =
				minScale + (maxScale - minScale) * (1 - breathData.breathPhase);
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
