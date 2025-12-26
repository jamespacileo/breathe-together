import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import type { EnhancedBreathData } from '../../hooks/useEnhancedBreathData';
import {
	createUserParticleMaterial,
	updateUserParticleMaterialUniforms,
} from '../../lib/materials';
import { userSimFragmentShader } from '../../shaders/gpgpu/userSim.frag';

interface UserParticlesProps {
	breathData: EnhancedBreathData;
	colorCounts: Record<string, number>;
	sphereRadius: number;
}

const MIN_PARTICLES = 16;

/**
 * User Particles - GPGPU particle system where each particle represents one user.
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

	const totalUsers = useMemo(
		() => Object.values(colorCounts).reduce((a, b) => a + b, 0),
		[colorCounts],
	);

	const fboSize = useMemo(() => {
		const particleCount = Math.max(totalUsers, MIN_PARTICLES);
		return Math.ceil(Math.sqrt(particleCount));
	}, [totalUsers]);

	const particleCount = fboSize * fboSize;

	const particleColors = useMemo(() => {
		const colors: THREE.Color[] = [];
		for (const [hexColor, count] of Object.entries(colorCounts)) {
			const color = new THREE.Color(hexColor);
			for (let i = 0; i < count; i++) {
				colors.push(color);
			}
		}
		while (colors.length < particleCount) {
			const existingColors = Object.keys(colorCounts);
			if (existingColors.length > 0) {
				const randomHex =
					existingColors[Math.floor(Math.random() * existingColors.length)];
				colors.push(new THREE.Color(randomHex));
			} else {
				colors.push(new THREE.Color('#7EC8D4'));
			}
		}
		return colors;
	}, [colorCounts, particleCount]);

	// Create GPGPU simulation
	useEffect(() => {
		const gpuCompute = new GPUComputationRenderer(fboSize, fboSize, gl);

		const positionData = new Float32Array(particleCount * 4);
		const originalPositionData = new Float32Array(particleCount * 4);

		for (let i = 0; i < particleCount; i++) {
			const i4 = i * 4;
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);
			const radius = 12 + Math.random() * 4;

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
		}

		gpgpuRef.current = { gpuCompute, positionVariable, originalPositionTexture };

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
			references[i * 2] = (i % fboSize) / fboSize;
			references[i * 2 + 1] = Math.floor(i / fboSize) / fboSize;
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
		geometry.setAttribute(
			'position',
			new THREE.BufferAttribute(new Float32Array(particleCount * 3), 3),
		);

		const positionTexture = gpgpuRef.current.gpuCompute.getCurrentRenderTarget(
			gpgpuRef.current.positionVariable,
		).texture;

		const material = createUserParticleMaterial(positionTexture, totalUsers);

		geometryRef.current = geometry;
		materialRef.current = material;

		return () => {
			geometry.dispose();
			material.dispose();
		};
	}, [fboSize, particleCount, particleColors, totalUsers]);

	// Animation loop
	useFrame((state, delta) => {
		if (!(gpgpuRef.current && materialRef.current)) return;

		const time = state.clock.elapsedTime;
		const { breathPhase, phaseType, crystallization, diaphragmDirection } = breathData;

		// Update simulation uniforms
		const simUniforms = gpgpuRef.current.positionVariable.material.uniforms;
		simUniforms.uTime.value = time;
		simUniforms.uDelta.value = delta;
		simUniforms.uBreathPhase.value = breathPhase;
		simUniforms.uPhaseType.value = phaseType;
		simUniforms.uCrystallization.value = crystallization;
		simUniforms.uDiaphragmDirection.value = diaphragmDirection;
		simUniforms.uSphereRadius.value = sphereRadius * (1 - breathPhase * 0.3);

		gpgpuRef.current.gpuCompute.compute();

		// Update particle material using helper
		const positionTexture = gpgpuRef.current.gpuCompute.getCurrentRenderTarget(
			gpgpuRef.current.positionVariable,
		).texture;

		updateUserParticleMaterialUniforms(
			materialRef.current,
			positionTexture,
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
		/>
	);
}
