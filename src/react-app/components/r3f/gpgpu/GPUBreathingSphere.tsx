/**
 * GPUBreathingSphere - GPGPU-powered particle system
 * Uses compute shaders for physics and enhanced visual shaders
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
	GPUComputationRenderer,
	type Variable,
} from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import type { BreathState } from '../../../hooks/useBreathSync';
import { getBreathValue } from '../../../lib/breathUtils';
import type { VisualizationConfig } from '../../../lib/config';
import type { PhaseType } from '../../../lib/patterns';
import {
	PARTICLE_FRAGMENT_SHADER,
	PARTICLE_VERTEX_SHADER,
} from './shaders/particleShaders.glsl';
import { POSITION_COMPUTE_SHADER } from './shaders/positionShader.glsl';
import { VELOCITY_COMPUTE_SHADER } from './shaders/velocityShader.glsl';

// Texture size determines particle count (WIDTH * WIDTH)
const WIDTH = 32; // 1024 particles
const PARTICLE_COUNT = WIDTH * WIDTH;

// Convert phase to numeric value for shader
function phaseToNumber(phase: PhaseType): number {
	switch (phase) {
		case 'in':
			return 0.0;
		case 'hold-in':
			return 1.0;
		case 'out':
			return 2.0;
		case 'hold-out':
			return 3.0;
		default:
			return 0.0;
	}
}

// Create star texture with soft glow and diffraction spikes
function createStarTexture(): THREE.CanvasTexture {
	const canvas = document.createElement('canvas');
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Failed to get 2D canvas context');

	const cx = 32;
	const cy = 32;

	// Outer soft glow
	const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
	glow.addColorStop(0, 'rgba(255, 255, 255, 1)');
	glow.addColorStop(0.1, 'rgba(255, 255, 255, 0.8)');
	glow.addColorStop(0.25, 'rgba(255, 255, 255, 0.4)');
	glow.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
	glow.addColorStop(0.75, 'rgba(255, 255, 255, 0.05)');
	glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
	ctx.fillStyle = glow;
	ctx.fillRect(0, 0, 64, 64);

	// 4-point diffraction spikes
	ctx.globalCompositeOperation = 'lighter';

	const vSpike = ctx.createLinearGradient(cx, 0, cx, 64);
	vSpike.addColorStop(0, 'rgba(255, 255, 255, 0)');
	vSpike.addColorStop(0.3, 'rgba(255, 255, 255, 0.25)');
	vSpike.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)');
	vSpike.addColorStop(0.7, 'rgba(255, 255, 255, 0.25)');
	vSpike.addColorStop(1, 'rgba(255, 255, 255, 0)');
	ctx.fillStyle = vSpike;
	ctx.fillRect(cx - 1, 0, 2, 64);

	const hSpike = ctx.createLinearGradient(0, cy, 64, cy);
	hSpike.addColorStop(0, 'rgba(255, 255, 255, 0)');
	hSpike.addColorStop(0.3, 'rgba(255, 255, 255, 0.25)');
	hSpike.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)');
	hSpike.addColorStop(0.7, 'rgba(255, 255, 255, 0.25)');
	hSpike.addColorStop(1, 'rgba(255, 255, 255, 0)');
	ctx.fillStyle = hSpike;
	ctx.fillRect(0, cy - 1, 64, 2);

	// Bright core
	const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
	core.addColorStop(0, 'rgba(255, 255, 255, 1)');
	core.addColorStop(0.3, 'rgba(255, 255, 255, 0.9)');
	core.addColorStop(0.6, 'rgba(255, 255, 255, 0.5)');
	core.addColorStop(1, 'rgba(255, 255, 255, 0)');
	ctx.fillStyle = core;
	ctx.beginPath();
	ctx.arc(cx, cy, 8, 0, Math.PI * 2);
	ctx.fill();

	return new THREE.CanvasTexture(canvas);
}

// Singleton texture
let starTexture: THREE.CanvasTexture | null = null;
function getStarTexture(): THREE.CanvasTexture {
	if (!starTexture) {
		starTexture = createStarTexture();
	}
	return starTexture;
}

// Generate nebula color palette
function generateParticleColor(): { r: number; g: number; b: number } {
	const c = Math.random();
	if (c < 0.35) {
		// Cyan-blue
		return {
			r: 0.45 + Math.random() * 0.15,
			g: 0.75 + Math.random() * 0.15,
			b: 0.9 + Math.random() * 0.1,
		};
	} else if (c < 0.65) {
		// Purple/violet
		return {
			r: 0.65 + Math.random() * 0.15,
			g: 0.55 + Math.random() * 0.15,
			b: 0.9 + Math.random() * 0.1,
		};
	} else if (c < 0.85) {
		// Warm white/gold
		return {
			r: 0.95,
			g: 0.9 + Math.random() * 0.05,
			b: 0.85 + Math.random() * 0.1,
		};
	} else {
		// Pink/magenta
		return {
			r: 0.9 + Math.random() * 0.1,
			g: 0.6 + Math.random() * 0.15,
			b: 0.7 + Math.random() * 0.15,
		};
	}
}

interface GPUBreathingSphereProps {
	breathState: BreathState;
	config: VisualizationConfig;
	userCount: number;
}

export function GPUBreathingSphere({
	breathState,
	config,
	userCount,
}: GPUBreathingSphereProps) {
	const { gl } = useThree();
	const pointsRef = useRef<THREE.Points>(null);
	const gpuComputeRef = useRef<GPUComputationRenderer | null>(null);
	const positionVariableRef = useRef<Variable | null>(null);
	const velocityVariableRef = useRef<Variable | null>(null);
	const originalTextureRef = useRef<THREE.DataTexture | null>(null);
	const materialRef = useRef<THREE.ShaderMaterial | null>(null);
	const breathStateRef = useRef(breathState);
	const lastTimeRef = useRef(0);
	const prevUserCountRef = useRef(0);

	breathStateRef.current = breathState;

	// Configuration
	const contractedRadius = config.sphereContractedRadius ?? 0.7;
	const expandedRadius = config.sphereExpandedRadius ?? 2.2;

	// Get star texture
	const texture = useMemo(() => getStarTexture(), []);

	// Initialize GPGPU
	useEffect(() => {
		const gpuCompute = new GPUComputationRenderer(WIDTH, WIDTH, gl);
		gpuComputeRef.current = gpuCompute;

		// Create data textures
		const positionTexture = gpuCompute.createTexture();
		const velocityTexture = gpuCompute.createTexture();
		const originalTexture = gpuCompute.createTexture();
		originalTextureRef.current = originalTexture;

		const posData = positionTexture.image.data as Float32Array;
		const velData = velocityTexture.image.data as Float32Array;
		const origData = originalTexture.image.data as Float32Array;

		// Initialize particle positions in Fibonacci sphere pattern
		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const phi = Math.acos(1 - (2 * (i + 0.5)) / PARTICLE_COUNT);
			const theta = Math.PI * (1 + Math.sqrt(5)) * i;
			const r = expandedRadius * (0.3 + Math.random() * 0.7);

			const x = r * Math.sin(phi) * Math.cos(theta);
			const y = r * Math.sin(phi) * Math.sin(theta);
			const z = r * Math.cos(phi);

			// Position: xyz = position, w = life (0 = inactive, 1 = active)
			posData[i * 4] = x;
			posData[i * 4 + 1] = y;
			posData[i * 4 + 2] = z;
			posData[i * 4 + 3] = 0.0; // Start inactive

			// Velocity: xyz = velocity, w = unused
			velData[i * 4] = 0;
			velData[i * 4 + 1] = 0;
			velData[i * 4 + 2] = 0;
			velData[i * 4 + 3] = 0;

			// Original: xyz = home position, w = stiffness variation
			origData[i * 4] = x;
			origData[i * 4 + 1] = y;
			origData[i * 4 + 2] = z;
			origData[i * 4 + 3] = 0.8 + Math.random() * 0.4; // Per-particle stiffness
		}

		// Add variables
		const positionVariable = gpuCompute.addVariable(
			'texturePosition',
			POSITION_COMPUTE_SHADER,
			positionTexture,
		);
		const velocityVariable = gpuCompute.addVariable(
			'textureVelocity',
			VELOCITY_COMPUTE_SHADER,
			velocityTexture,
		);

		positionVariableRef.current = positionVariable;
		velocityVariableRef.current = velocityVariable;

		// Set dependencies
		gpuCompute.setVariableDependencies(positionVariable, [
			positionVariable,
			velocityVariable,
		]);
		gpuCompute.setVariableDependencies(velocityVariable, [
			positionVariable,
			velocityVariable,
		]);

		// Add common uniforms to both shaders
		const commonUniforms = {
			uTime: { value: 0 },
			uDeltaTime: { value: 0.016 },
			uBreathValue: { value: 0 },
			uPhaseType: { value: 0 },
			uTargetRadius: { value: contractedRadius },
			uExpandedRadius: { value: expandedRadius },
			textureOriginal: { value: originalTexture },
		};

		Object.assign(positionVariable.material.uniforms, commonUniforms);
		Object.assign(velocityVariable.material.uniforms, commonUniforms);

		// Initialize
		const error = gpuCompute.init();
		if (error !== null) {
			console.error('GPGPU init error:', error);
		}

		return () => {
			gpuCompute.dispose();
		};
	}, [gl, contractedRadius, expandedRadius]);

	// Create geometry with references and attributes
	const geometry = useMemo(() => {
		const geo = new THREE.BufferGeometry();

		// Reference coordinates for sampling position texture
		const refs = new Float32Array(PARTICLE_COUNT * 2);
		const szs = new Float32Array(PARTICLE_COUNT);
		const cols = new Float32Array(PARTICLE_COUNT * 3);

		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const x = (i % WIDTH) / WIDTH;
			const y = Math.floor(i / WIDTH) / WIDTH;
			refs[i * 2] = x;
			refs[i * 2 + 1] = y;

			// Size variation
			szs[i] = 18 + Math.random() * 24;

			// Color
			const col = generateParticleColor();
			cols[i * 3] = col.r;
			cols[i * 3 + 1] = col.g;
			cols[i * 3 + 2] = col.b;
		}

		// Dummy positions (will be set by shader)
		const positions = new Float32Array(PARTICLE_COUNT * 3);

		geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		geo.setAttribute('reference', new THREE.BufferAttribute(refs, 2));
		geo.setAttribute('size', new THREE.BufferAttribute(szs, 1));
		geo.setAttribute('aColor', new THREE.BufferAttribute(cols, 3));

		return geo;
	}, []);

	// Create shader material
	const material = useMemo(() => {
		const mat = new THREE.ShaderMaterial({
			uniforms: {
				texturePosition: { value: null },
				textureVelocity: { value: null },
				uTexture: { value: texture },
				uTime: { value: 0 },
				uBreathValue: { value: 0 },
				uPhaseType: { value: 0 },
				uResolution: {
					value: new THREE.Vector2(window.innerWidth, window.innerHeight),
				},
				uPrimaryColor: { value: new THREE.Vector3(0.5, 0.75, 0.9) },
				uSecondaryColor: { value: new THREE.Vector3(0.7, 0.55, 0.9) },
			},
			vertexShader: PARTICLE_VERTEX_SHADER,
			fragmentShader: PARTICLE_FRAGMENT_SHADER,
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
		});
		materialRef.current = mat;
		return mat;
	}, [texture]);

	// Handle user count changes - activate/deactivate particles
	useEffect(() => {
		const safeCount =
			typeof userCount === 'number' && !Number.isNaN(userCount)
				? Math.max(1, Math.min(userCount, PARTICLE_COUNT))
				: 1;

		prevUserCountRef.current = safeCount;
	}, [userCount]);

	// Animation loop
	useFrame((state) => {
		const gpuCompute = gpuComputeRef.current;
		const positionVariable = positionVariableRef.current;
		const velocityVariable = velocityVariableRef.current;
		const mat = materialRef.current;

		if (!(gpuCompute && positionVariable && velocityVariable && mat)) return;

		const time = state.clock.elapsedTime;
		const deltaTime = Math.min(time - lastTimeRef.current, 0.1);
		lastTimeRef.current = time;

		const breathValue = getBreathValue(breathStateRef.current);
		const phaseType = phaseToNumber(breathStateRef.current.phase);
		const targetRadius =
			contractedRadius +
			(expandedRadius - contractedRadius) * (1 - breathValue);

		// Update compute uniforms
		const posUniforms = positionVariable.material.uniforms;
		const velUniforms = velocityVariable.material.uniforms;

		posUniforms.uTime.value = time;
		posUniforms.uDeltaTime.value = deltaTime;
		posUniforms.uBreathValue.value = breathValue;
		posUniforms.uPhaseType.value = phaseType;
		posUniforms.uTargetRadius.value = targetRadius;

		velUniforms.uTime.value = time;
		velUniforms.uDeltaTime.value = deltaTime;
		velUniforms.uBreathValue.value = breathValue;
		velUniforms.uPhaseType.value = phaseType;
		velUniforms.uTargetRadius.value = targetRadius;

		// Run compute
		gpuCompute.compute();

		// Update render material uniforms
		mat.uniforms.texturePosition.value =
			gpuCompute.getCurrentRenderTarget(positionVariable).texture;
		mat.uniforms.textureVelocity.value =
			gpuCompute.getCurrentRenderTarget(velocityVariable).texture;
		mat.uniforms.uTime.value = time;
		mat.uniforms.uBreathValue.value = breathValue;
		mat.uniforms.uPhaseType.value = phaseType;
	});

	// Set initial particle life values based on user count
	useEffect(() => {
		const gpuCompute = gpuComputeRef.current;
		const positionVariable = positionVariableRef.current;

		if (!(gpuCompute && positionVariable)) return;

		const safeCount = Math.max(1, Math.min(userCount, PARTICLE_COUNT));

		// We need to initialize life values - this happens through the compute shader
		// The compute shader needs to read which particles are active
		// For simplicity, we'll use a uniform to pass the active count

		const posUniforms = positionVariable.material.uniforms;
		if (!posUniforms.uActiveCount) {
			posUniforms.uActiveCount = { value: safeCount };
		} else {
			posUniforms.uActiveCount.value = safeCount;
		}

		const velUniforms = velocityVariableRef.current?.material.uniforms;
		if (velUniforms) {
			if (!velUniforms.uActiveCount) {
				velUniforms.uActiveCount = { value: safeCount };
			} else {
				velUniforms.uActiveCount.value = safeCount;
			}
		}
	}, [userCount]);

	return <points ref={pointsRef} geometry={geometry} material={material} />;
}
