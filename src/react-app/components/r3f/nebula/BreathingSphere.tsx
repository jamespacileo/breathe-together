import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { BreathState } from '../../../hooks/useBreathSync';
import { getBreathValue } from '../../../lib/breathUtils';
import type { VisualizationConfig } from '../../../lib/config';

// Particle count
const PARTICLE_COUNT = 300;

// Contracted radius (inhale - particles move closer to sphere)
const CONTRACTED_RADIUS = 1.2;
// Expanded radius (exhale - particles spread out and float)
const EXPANDED_RADIUS = 2.8;
// How far particles drift from their base position
const DRIFT_AMOUNT = 0.6;

// Vertex shader - simple point rendering with size attenuation
const VERTEX_SHADER = `
attribute float size;
attribute float alpha;

uniform float uTime;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vColor = color;
  vAlpha = alpha;

  // Subtle twinkle effect
  float twinkle = sin(uTime * 0.5 + position.x * 3.0 + position.y * 2.0) * 0.15 + 0.85;

  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dist = -mv.z;

  // Size attenuation with distance
  gl_PointSize = size * twinkle * (5.0 / dist);
  gl_Position = projectionMatrix * mv;
}
`;

// Fragment shader - soft glowing particles
const FRAGMENT_SHADER = `
uniform sampler2D uTexture;
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec4 tex = texture2D(uTexture, gl_PointCoord);
  gl_FragColor = vec4(vColor, tex.a * vAlpha);
}
`;

// Create soft glow texture
function createGlowTexture(): THREE.CanvasTexture {
	const canvas = document.createElement('canvas');
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext('2d')!;
	const cx = 32;
	const cy = 32;

	// Soft radial gradient
	const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 32);
	glow.addColorStop(0, 'rgba(255, 255, 255, 1)');
	glow.addColorStop(0.1, 'rgba(255, 255, 255, 0.8)');
	glow.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)');
	glow.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
	glow.addColorStop(0.7, 'rgba(255, 255, 255, 0.05)');
	glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
	ctx.fillStyle = glow;
	ctx.fillRect(0, 0, 64, 64);

	return new THREE.CanvasTexture(canvas);
}

// Singleton texture
let glowTexture: THREE.CanvasTexture | null = null;
function getGlowTexture(): THREE.CanvasTexture {
	if (!glowTexture) {
		glowTexture = createGlowTexture();
	}
	return glowTexture;
}

// Simple 3D noise function for fluid-like motion
function noise3D(x: number, y: number, z: number, seed: number): number {
	const n =
		Math.sin(x * 1.5 + seed) *
		Math.cos(y * 1.3 + seed * 0.7) *
		Math.sin(z * 1.7 + seed * 1.2);
	return n;
}

// Generate random color in calming palette
function generateColor(): { r: number; g: number; b: number } {
	const c = Math.random();
	if (c < 0.4) {
		// Soft cyan-blue
		return {
			r: 0.5 + Math.random() * 0.1,
			g: 0.75 + Math.random() * 0.15,
			b: 0.9 + Math.random() * 0.1,
		};
	} else if (c < 0.7) {
		// Soft purple
		return {
			r: 0.65 + Math.random() * 0.15,
			g: 0.55 + Math.random() * 0.15,
			b: 0.9 + Math.random() * 0.1,
		};
	} else if (c < 0.85) {
		// Warm white
		return {
			r: 0.95,
			g: 0.9 + Math.random() * 0.05,
			b: 0.85 + Math.random() * 0.1,
		};
	} else {
		// Soft pink
		return {
			r: 0.9 + Math.random() * 0.1,
			g: 0.65 + Math.random() * 0.15,
			b: 0.75 + Math.random() * 0.15,
		};
	}
}

// Particle data structure
interface ParticleData {
	// Base position on unit sphere (normalized)
	baseX: number;
	baseY: number;
	baseZ: number;
	// Unique seed for noise-based drift
	seed: number;
	// Drift speed multiplier
	driftSpeed: number;
	// Current smoothed position (for fluid motion)
	currentX: number;
	currentY: number;
	currentZ: number;
}

interface BreathingSphereProps {
	breathState: BreathState;
	config: VisualizationConfig;
	userCount: number;
}

export function BreathingSphere({
	breathState,
	config,
	userCount,
}: BreathingSphereProps) {
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	const geometryRef = useRef<THREE.BufferGeometry>(null);
	const breathStateRef = useRef(breathState);
	const smoothBreathRef = useRef(0);
	const rotationRef = useRef(0);
	breathStateRef.current = breathState;

	// Use config values if available, otherwise defaults
	const contractedRadius = config.sphereContractedRadius ?? CONTRACTED_RADIUS;
	const expandedRadius = config.sphereExpandedRadius ?? EXPANDED_RADIUS;

	// Get texture
	const texture = useMemo(() => getGlowTexture(), []);

	// Initialize particles and buffers
	const { particles, buffers } = useMemo(() => {
		const particles: ParticleData[] = [];
		const positions = new Float32Array(PARTICLE_COUNT * 3);
		const alphas = new Float32Array(PARTICLE_COUNT);
		const sizes = new Float32Array(PARTICLE_COUNT);
		const colors = new Float32Array(PARTICLE_COUNT * 3);

		// Distribute particles on sphere using Fibonacci lattice
		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const phi = Math.acos(1 - (2 * (i + 0.5)) / PARTICLE_COUNT);
			const theta = Math.PI * (1 + Math.sqrt(5)) * i;

			// Normalized base position on unit sphere
			const baseX = Math.sin(phi) * Math.cos(theta);
			const baseY = Math.sin(phi) * Math.sin(theta);
			const baseZ = Math.cos(phi);

			particles.push({
				baseX,
				baseY,
				baseZ,
				seed: Math.random() * 1000,
				driftSpeed: 0.3 + Math.random() * 0.4,
				currentX: baseX * expandedRadius,
				currentY: baseY * expandedRadius,
				currentZ: baseZ * expandedRadius,
			});

			// Initial positions
			positions[i * 3] = baseX * expandedRadius;
			positions[i * 3 + 1] = baseY * expandedRadius;
			positions[i * 3 + 2] = baseZ * expandedRadius;

			// Alpha (all visible)
			alphas[i] = 0.85 + Math.random() * 0.15;

			// Size variation
			sizes[i] = 15 + Math.random() * 25;

			// Color
			const color = generateColor();
			colors[i * 3] = color.r;
			colors[i * 3 + 1] = color.g;
			colors[i * 3 + 2] = color.b;
		}

		return { particles, buffers: { positions, alphas, sizes, colors } };
	}, [expandedRadius]);

	// Animation loop
	useFrame((state) => {
		if (!materialRef.current || !geometryRef.current) return;

		const time = state.clock.elapsedTime;
		const breathValue = getBreathValue(breathStateRef.current);

		// Smooth the breath value for fluid motion
		const smoothingFactor = 0.03;
		smoothBreathRef.current +=
			(breathValue - smoothBreathRef.current) * smoothingFactor;
		const smoothBreath = smoothBreathRef.current;

		// Update shader time
		materialRef.current.uniforms.uTime.value = time;

		// Slow continuous rotation
		rotationRef.current += 0.002;
		const rotation = rotationRef.current;
		const cosR = Math.cos(rotation);
		const sinR = Math.sin(rotation);

		// Calculate current radius based on breath
		// Inhale (breathValue=1) = contracted, Exhale (breathValue=0) = expanded
		const currentRadius =
			expandedRadius - (expandedRadius - contractedRadius) * smoothBreath;

		// Drift amount reduces when contracted (particles tighten to sphere)
		const currentDrift = DRIFT_AMOUNT * (1 - smoothBreath * 0.7);

		// Get buffer arrays
		const posAttr = geometryRef.current.attributes.position;
		const positions = posAttr.array as Float32Array;

		// Update each particle
		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const p = particles[i];

			// Calculate noise-based drift offset (fluid floating motion)
			const noiseTime = time * p.driftSpeed;
			const driftX = noise3D(noiseTime, p.seed, 0, p.seed) * currentDrift;
			const driftY = noise3D(0, noiseTime, p.seed, p.seed + 100) * currentDrift;
			const driftZ = noise3D(p.seed, 0, noiseTime, p.seed + 200) * currentDrift;

			// Target position: base sphere position * radius + drift
			let targetX = p.baseX * currentRadius + driftX;
			let targetY = p.baseY * currentRadius + driftY;
			let targetZ = p.baseZ * currentRadius + driftZ;

			// Apply rotation around Y axis
			const rotatedX = targetX * cosR - targetZ * sinR;
			const rotatedZ = targetX * sinR + targetZ * cosR;
			targetX = rotatedX;
			targetZ = rotatedZ;

			// Smooth interpolation for fluid movement
			const lerpFactor = 0.08;
			p.currentX += (targetX - p.currentX) * lerpFactor;
			p.currentY += (targetY - p.currentY) * lerpFactor;
			p.currentZ += (targetZ - p.currentZ) * lerpFactor;

			// Write to buffer
			positions[i * 3] = p.currentX;
			positions[i * 3 + 1] = p.currentY;
			positions[i * 3 + 2] = p.currentZ;
		}

		// Signal GPU update
		posAttr.needsUpdate = true;
	});

	return (
		<points>
			<bufferGeometry ref={geometryRef}>
				<bufferAttribute
					attach="attributes-position"
					args={[buffers.positions, 3]}
					usage={THREE.DynamicDrawUsage}
				/>
				<bufferAttribute attach="attributes-alpha" args={[buffers.alphas, 1]} />
				<bufferAttribute attach="attributes-size" args={[buffers.sizes, 1]} />
				<bufferAttribute attach="attributes-color" args={[buffers.colors, 3]} />
			</bufferGeometry>
			<shaderMaterial
				ref={materialRef}
				uniforms={{
					uTime: { value: 0 },
					uTexture: { value: texture },
				}}
				vertexShader={VERTEX_SHADER}
				fragmentShader={FRAGMENT_SHADER}
				transparent
				vertexColors
				blending={THREE.AdditiveBlending}
				depthWrite={false}
			/>
		</points>
	);
}
