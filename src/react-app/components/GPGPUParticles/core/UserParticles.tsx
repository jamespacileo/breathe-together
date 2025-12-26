import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import { useGlobalUniforms } from '../../../hooks/useGlobalUniforms';
import {
	createUserParticleMaterial,
	updateUserParticleMaterialUniforms,
} from '../../../lib/materials';
import { userSimFragmentShader } from '../../../shaders/gpgpu/userSim.frag';

interface UserParticlesProps {
	colorCounts: Record<string, number>;
	sphereRadius: number;
}

// Pre-allocate a fixed FBO size to avoid re-initialization jank
const FIXED_FBO_SIZE = 32; // 1024 particles max for now
const MAX_PARTICLES = FIXED_FBO_SIZE * FIXED_FBO_SIZE;

/**
 * User Particles - GPGPU particle system where each particle represents one user.
 */
export function UserParticles({
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
	const globalUniforms = useGlobalUniforms();
	const isDisposedRef = useRef(false);

	const totalUsers = useMemo(
		() => Object.values(colorCounts).reduce((a, b) => a + b, 0),
		[colorCounts],
	);

	// Use fixed particle count to avoid re-initialization
	const particleCount = MAX_PARTICLES;

	const particleColors = useMemo(() => {
		const colors: THREE.Color[] = [];
		for (const [hexColor, count] of Object.entries(colorCounts)) {
			const color = new THREE.Color(hexColor);
			for (let i = 0; i < count; i++) {
				colors.push(color);
			}
		}
		// Fill remaining slots with transparent/hidden particles or default color
		while (colors.length < particleCount) {
			colors.push(new THREE.Color('#000000')); // Hidden particles
		}
		return colors;
	}, [colorCounts, particleCount]);

	// Create GPGPU simulation (only once or when sphereRadius changes)
	useEffect(() => {
		isDisposedRef.current = false;
		const gpuCompute = new GPUComputationRenderer(FIXED_FBO_SIZE, FIXED_FBO_SIZE, gl);

		const positionData = new Float32Array(particleCount * 4);
		const originalPositionData = new Float32Array(particleCount * 4);

		for (let i = 0; i < particleCount; i++) {
			const i4 = i * 4;
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);
			// Initialize at ~2.5-3.5x sphere radius (between settled and spread)
			const radius = sphereRadius * (2.5 + Math.random() * 1.0);

			const x = Math.sin(phi) * Math.cos(theta) * radius;
			const y = Math.cos(phi) * radius;
			const z = Math.sin(phi) * Math.sin(theta) * radius;

			positionData[i4] = x;
			positionData[i4 + 1] = y;
			positionData[i4 + 2] = z;
			positionData[i4 + 3] = theta;

			originalPositionData[i4] = x;
			originalPositionData[i4 + 1] = y;
			originalPositionData[i4 + 2] = z;
			originalPositionData[i4 + 3] = Math.random();
		}

		const positionTexture = gpuCompute.createTexture();
		if (positionTexture.image.data) {
			positionTexture.image.data.set(positionData);
		}

		const originalPositionTexture = gpuCompute.createTexture();
		if (originalPositionTexture.image.data) {
			originalPositionTexture.image.data.set(originalPositionData);
		}

		const positionVariable = gpuCompute.addVariable(
			'texturePosition',
			userSimFragmentShader,
			positionTexture,
		);

		gpuCompute.setVariableDependencies(positionVariable, [positionVariable]);

		const uniforms = positionVariable.material.uniforms;
		uniforms.uOriginalPositions = { value: originalPositionTexture };
		uniforms.uTime = { value: 0 };
		uniforms.uDelta = { value: 0.016 };
		uniforms.uBreathPhase = { value: 0 };
		uniforms.uPhaseType = { value: 0 };
		uniforms.uCrystallization = { value: 0 };
		uniforms.uDiaphragmDirection = { value: 0 };
		uniforms.uSphereRadius = { value: sphereRadius };

		const error = gpuCompute.init();
		if (error !== null) {
			console.error('UserParticles GPUCompute init error:', error);
			gpuCompute.dispose();
			originalPositionTexture.dispose();
			return;
		}

		gpgpuRef.current = { gpuCompute, positionVariable, originalPositionTexture };

		return () => {
			isDisposedRef.current = true;
			gpgpuRef.current = null;
			gpuCompute.dispose();
			originalPositionTexture.dispose();
		};
	}, [gl, sphereRadius, particleCount]);

	// Create geometry and material
	useEffect(() => {
		if (!gpgpuRef.current) return;

		const geometry = new THREE.BufferGeometry();
		const references = new Float32Array(particleCount * 2);
		const sizes = new Float32Array(particleCount);
		const phases = new Float32Array(particleCount);
		const colors = new Float32Array(particleCount * 3);

		for (let i = 0; i < particleCount; i++) {
			references[i * 2] = (i % FIXED_FBO_SIZE) / FIXED_FBO_SIZE;
			references[i * 2 + 1] = Math.floor(i / FIXED_FBO_SIZE) / FIXED_FBO_SIZE;
			sizes[i] = 0.8 + Math.random() * 0.6;
			phases[i] = Math.random();

			const color = particleColors[i];
			colors[i * 3] = color.r;
			colors[i * 3 + 1] = color.g;
			colors[i * 3 + 2] = color.b;
		}

		geometry.setAttribute('aReference', new THREE.BufferAttribute(references, 2));
		geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
		geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
		geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
		// Position attribute required for Points geometry count, values overridden by shader
		geometry.setAttribute(
			'position',
			new THREE.BufferAttribute(new Float32Array(particleCount * 3), 3),
		);

		// Use the current texture from GPGPU for initial material creation
		const initialTexture = gpgpuRef.current.gpuCompute.getCurrentRenderTarget(
			gpgpuRef.current.positionVariable,
		).texture;
		const material = createUserParticleMaterial(initialTexture, totalUsers);

		geometryRef.current = geometry;
		materialRef.current = material;

		return () => {
			geometry.dispose();
			material.dispose();
		};
	}, [particleColors, totalUsers, particleCount]);

	// Animation loop
	useFrame((state, delta) => {
		// Check for disposal to prevent race condition
		if (isDisposedRef.current) return;
		if (!(gpgpuRef.current && materialRef.current)) return;

		const time = state.clock.elapsedTime;

		// Read from global uniforms (computed once per frame at scene root)
		const { breathPhase, phaseType, crystallization, diaphragmDirection } =
			globalUniforms.current;

		// Update simulation uniforms
		const simUniforms = gpgpuRef.current.positionVariable.material.uniforms;
		simUniforms.uTime.value = time;
		simUniforms.uDelta.value = delta;
		simUniforms.uBreathPhase.value = breathPhase;
		simUniforms.uPhaseType.value = phaseType;
		simUniforms.uCrystallization.value = crystallization;
		simUniforms.uDiaphragmDirection.value = diaphragmDirection;

		// Match BreathingSphere's exact scale calculation
		// sphereRadius = maxScale (exhale), minScale = 0.5 * maxScale (inhale)
		const minScale = sphereRadius * 0.5;
		const maxScale = sphereRadius;
		const currentSphereScale =
			minScale + (maxScale - minScale) * (1 - breathPhase);
		simUniforms.uSphereRadius.value = currentSphereScale;

		gpgpuRef.current.gpuCompute.compute();

		// CRITICAL: Get the texture from the current render target AFTER compute()
		// This prevents the race condition where we read from the texture being written to
		const currentTexture = gpgpuRef.current.gpuCompute.getCurrentRenderTarget(
			gpgpuRef.current.positionVariable,
		).texture;

		updateUserParticleMaterialUniforms(
			materialRef.current,
			currentTexture,
			breathPhase,
			phaseType,
			crystallization,
			totalUsers,
			time,
		);
	});

	if (!(geometryRef.current && materialRef.current)) {
		return null;
	}

	return (
		<points
			ref={pointsRef}
			geometry={geometryRef.current}
			material={materialRef.current}
			frustumCulled={false}
		/>
	);
}
