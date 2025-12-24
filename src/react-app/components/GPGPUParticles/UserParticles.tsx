import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import { userSimFragmentShader } from '../../shaders/gpgpu/userSim.frag';
import {
	userParticleFragmentShader,
	userParticleVertexShader,
} from '../../shaders/user';
import type { EnhancedBreathData } from './GPGPUScene';

interface UserParticlesProps {
	breathData: EnhancedBreathData;
	colorCounts: Record<string, number>; // e.g., { '#7EC8D4': 5, '#9B8EC8': 3 }
	sphereRadius: number; // Sphere glow radius for Dyson swarm positioning
}

// Minimum particles to render (for visual consistency when few users)
const MIN_PARTICLES = 16;

/**
 * User Particles
 *
 * GPGPU particle system where each particle represents one user.
 * - Particles are colored based on user's mood
 * - Spread out on exhale, settle close to sphere on inhale
 * - Gentle flutter and slow orbital motion
 */
export function UserParticles({
	breathData,
	colorCounts,
	sphereRadius,
}: UserParticlesProps) {
	const { gl } = useThree();
	const pointsRef = useRef<THREE.Points>(null);
	const gpgpuRef = useRef<{
		gpuCompute: GPUComputationRenderer;
		positionVariable: ReturnType<GPUComputationRenderer['addVariable']>;
		originalPositionTexture: THREE.DataTexture;
	} | null>(null);
	const materialRef = useRef<THREE.ShaderMaterial | null>(null);
	const geometryRef = useRef<THREE.BufferGeometry | null>(null);

	// Calculate total particles needed
	const totalUsers = useMemo(() => {
		return Object.values(colorCounts).reduce((a, b) => a + b, 0);
	}, [colorCounts]);

	// Calculate FBO size (round up to ensure we have enough space)
	const fboSize = useMemo(() => {
		const particleCount = Math.max(totalUsers, MIN_PARTICLES);
		return Math.ceil(Math.sqrt(particleCount));
	}, [totalUsers]);

	const particleCount = fboSize * fboSize;

	// Build color array from colorCounts
	const particleColors = useMemo(() => {
		const colors: THREE.Color[] = [];
		for (const [hexColor, count] of Object.entries(colorCounts)) {
			const color = new THREE.Color(hexColor);
			for (let i = 0; i < count; i++) {
				colors.push(color);
			}
		}
		// Fill remaining slots with random existing colors (for visual consistency)
		while (colors.length < particleCount) {
			const existingColors = Object.keys(colorCounts);
			if (existingColors.length > 0) {
				const randomHex =
					existingColors[Math.floor(Math.random() * existingColors.length)];
				colors.push(new THREE.Color(randomHex));
			} else {
				colors.push(new THREE.Color('#7EC8D4')); // Default soft cyan
			}
		}
		return colors;
	}, [colorCounts, particleCount]);

	// Create GPGPU simulation
	useEffect(() => {
		const gpuCompute = new GPUComputationRenderer(fboSize, fboSize, gl);

		// Initialize position data
		const positionData = new Float32Array(particleCount * 4);
		const originalPositionData = new Float32Array(particleCount * 4);

		for (let i = 0; i < particleCount; i++) {
			const i4 = i * 4;

			// Distribute particles on a sphere surface
			const theta = Math.random() * Math.PI * 2; // Horizontal angle
			const phi = Math.acos(2 * Math.random() - 1); // Vertical angle (uniform distribution)
			const radius = 12 + Math.random() * 4; // Initial radius between settled and spread

			const x = Math.sin(phi) * Math.cos(theta) * radius;
			const y = Math.cos(phi) * radius;
			const z = Math.sin(phi) * Math.sin(theta) * radius;

			positionData[i4] = x;
			positionData[i4 + 1] = y;
			positionData[i4 + 2] = z;
			positionData[i4 + 3] = theta; // Store initial angle for orbit

			originalPositionData[i4] = x;
			originalPositionData[i4 + 1] = y;
			originalPositionData[i4 + 2] = z;
			originalPositionData[i4 + 3] = Math.random(); // Random phase for variation
		}

		// Create textures
		const positionTexture = gpuCompute.createTexture();
		if (positionTexture.image.data) {
			positionTexture.image.data.set(positionData);
		}

		const originalPositionTexture = gpuCompute.createTexture();
		if (originalPositionTexture.image.data) {
			originalPositionTexture.image.data.set(originalPositionData);
		}

		// Create position variable with simulation shader
		const positionVariable = gpuCompute.addVariable(
			'texturePosition',
			userSimFragmentShader,
			positionTexture,
		);

		gpuCompute.setVariableDependencies(positionVariable, [positionVariable]);

		// Add uniforms
		const uniforms = positionVariable.material.uniforms;
		uniforms.uOriginalPositions = { value: originalPositionTexture };
		uniforms.uTime = { value: 0 };
		uniforms.uDelta = { value: 0.016 }; // Frame delta for refresh-rate independence
		uniforms.uBreathPhase = { value: 0 };
		uniforms.uPhaseType = { value: 0 };
		uniforms.uCrystallization = { value: 0 };
		uniforms.uDiaphragmDirection = { value: 0 };
		uniforms.uSphereRadius = { value: sphereRadius }; // For Dyson swarm positioning

		// Initialize
		const error = gpuCompute.init();
		if (error !== null) {
			console.error('UserParticles GPUCompute init error:', error);
		}

		gpgpuRef.current = {
			gpuCompute,
			positionVariable,
			originalPositionTexture,
		};

		return () => {
			gpuCompute.dispose();
			originalPositionTexture.dispose();
		};
	}, [gl, fboSize, particleCount, sphereRadius]);

	// Create geometry and material
	useEffect(() => {
		if (!gpgpuRef.current) return;

		const geometry = new THREE.BufferGeometry();

		const references = new Float32Array(particleCount * 2);
		const sizes = new Float32Array(particleCount);
		const phases = new Float32Array(particleCount);
		const colors = new Float32Array(particleCount * 3);

		for (let i = 0; i < particleCount; i++) {
			// UV reference for texture lookup
			const x = (i % fboSize) / fboSize;
			const y = Math.floor(i / fboSize) / fboSize;

			references[i * 2] = x;
			references[i * 2 + 1] = y;

			// Size variation
			sizes[i] = 0.8 + Math.random() * 0.6;

			// Random phase for twinkle offset
			phases[i] = Math.random();

			// Assign color from particleColors array
			const color = particleColors[i];
			colors[i * 3] = color.r;
			colors[i * 3 + 1] = color.g;
			colors[i * 3 + 2] = color.b;
		}

		geometry.setAttribute(
			'aReference',
			new THREE.BufferAttribute(references, 2),
		);
		geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
		geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
		geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

		// Dummy positions (will be set from GPU texture)
		const positions = new Float32Array(particleCount * 3);
		geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

		const material = new THREE.ShaderMaterial({
			vertexShader: userParticleVertexShader,
			fragmentShader: userParticleFragmentShader,
			uniforms: {
				uPositions: {
					value: gpgpuRef.current.gpuCompute.getCurrentRenderTarget(
						gpgpuRef.current.positionVariable,
					).texture,
				},
				uTime: { value: 0 },
				uBreathPhase: { value: 0 },
				uPhaseType: { value: 0 },
				uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
				uCrystallization: { value: 0 },
				uUserCount: { value: totalUsers }, // For dynamic sizing
			},
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			depthTest: true,
		});

		geometryRef.current = geometry;
		materialRef.current = material;

		return () => {
			geometry.dispose();
			material.dispose();
		};
	}, [fboSize, particleCount, particleColors, totalUsers]);

	// Animation loop - uses delta for refresh-rate independence per R3F best practices
	useFrame((state, delta) => {
		if (!(gpgpuRef.current && materialRef.current)) return;

		const time = state.clock.elapsedTime;
		const { breathPhase, phaseType, crystallization, diaphragmDirection } =
			breathData;

		// Update simulation uniforms
		const simUniforms = gpgpuRef.current.positionVariable.material.uniforms;
		simUniforms.uTime.value = time;
		if (simUniforms.uDelta) {
			simUniforms.uDelta.value = delta; // Pass actual frame delta for smooth animation
		}
		simUniforms.uBreathPhase.value = breathPhase;
		simUniforms.uPhaseType.value = phaseType;
		simUniforms.uCrystallization.value = crystallization;
		simUniforms.uDiaphragmDirection.value = diaphragmDirection;
		// Sphere radius scales with breath - smaller when inhaled
		simUniforms.uSphereRadius.value = sphereRadius * (1 - breathPhase * 0.3);

		// Run simulation
		gpgpuRef.current.gpuCompute.compute();

		// Update particle material
		const partUniforms = materialRef.current.uniforms;
		partUniforms.uPositions.value =
			gpgpuRef.current.gpuCompute.getCurrentRenderTarget(
				gpgpuRef.current.positionVariable,
			).texture;
		partUniforms.uTime.value = time;
		partUniforms.uBreathPhase.value = breathPhase;
		partUniforms.uPhaseType.value = phaseType;
		partUniforms.uCrystallization.value = crystallization;
		partUniforms.uUserCount.value = totalUsers; // Dynamic sizing based on count
	});

	if (!(geometryRef.current && materialRef.current)) {
		return null;
	}

	return (
		<points
			ref={pointsRef}
			geometry={geometryRef.current}
			material={materialRef.current}
		/>
	);
}
