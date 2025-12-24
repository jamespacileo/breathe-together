import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { BreathState } from '../../../hooks/useBreathSync';
import { getBreathValue } from '../../../lib/breathPatterns';
import type { VisualizationConfig } from '../../../lib/visualConfig';

// Maximum particles - buffers allocated once at this size
const MAX_PARTICLES = 500;

// Particle state for JS physics simulation
interface Particle {
	// Home position (on Fibonacci sphere)
	homeX: number;
	homeY: number;
	homeZ: number;
	// Current position (spring-animated in JS)
	x: number;
	y: number;
	z: number;
	// Velocity for spring physics
	vx: number;
	vy: number;
	vz: number;
	// Per-particle physics variation
	stiffness: number;
	damping: number;
	// Entry/exit
	alpha: number;
	targetAlpha: number;
	// Visual (passed to GPU)
	size: number;
	colorR: number;
	colorG: number;
	colorB: number;
}

// Vertex shader - receives positions from JS, handles visual effects only
const VERTEX_SHADER = `
attribute float size;
attribute float alpha;

uniform float uTime;
uniform float uBreathValue;

varying vec3 vColor;
varying float vDist;
varying float vAlpha;

void main() {
  vColor = color;

  // Skip computation for invisible particles
  if (alpha < 0.01) {
    gl_Position = vec4(0.0, 0.0, -1000.0, 1.0);
    gl_PointSize = 0.0;
    vAlpha = 0.0;
    return;
  }

  // Twinkle effect on size (per-particle variation using position as seed)
  float twinkleSpeed = 0.4 + position.x * 0.3 + position.y * 0.2;
  float twinklePhase = position.z * 6.28;
  float twinkle = sin(uTime * twinkleSpeed + twinklePhase);
  float sizeMultiplier = 0.75 + twinkle * 0.25;

  // Pulse effect (slower, subtle)
  float pulseSpeed = 0.2 + position.y * 0.1;
  float pulsePhase = position.x * 3.14;
  float pulse = sin(uTime * pulseSpeed + pulsePhase);
  sizeMultiplier *= (1.0 + pulse * 0.1);

  // Brightness sparkle (modulates alpha) based on breath
  float shimmer = 0.8 + uBreathValue * 0.2;
  float brightnessSpeed = 0.8 + length(position.xy) * 0.3;
  float brightnessPhase = position.z * 3.14 + position.x * 1.57;
  float brightness = 0.85 + sin(uTime * brightnessSpeed + brightnessPhase) * 0.15;
  vAlpha = alpha * shimmer * brightness;

  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vDist = -mv.z;
  gl_PointSize = size * sizeMultiplier * alpha * (4.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

// Fragment shader
const FRAGMENT_SHADER = `
uniform sampler2D uTexture;
varying vec3 vColor;
varying float vDist;
varying float vAlpha;

void main() {
  if (vAlpha < 0.01) discard;
  vec4 tex = texture2D(uTexture, gl_PointCoord);
  float fade = smoothstep(12.0, 2.0, vDist);
  gl_FragColor = vec4(vColor, tex.a * 1.4 * fade * vAlpha);
}
`;

// Create star texture with subtle 4-point diffraction spikes
function createStarTexture(): THREE.CanvasTexture {
	const canvas = document.createElement('canvas');
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Failed to get 2D canvas context');
	}
	const cx = 32;
	const cy = 32;

	// Outer soft glow
	const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
	glow.addColorStop(0, 'rgba(255, 255, 255, 1)');
	glow.addColorStop(0.1, 'rgba(255, 255, 255, 0.7)');
	glow.addColorStop(0.3, 'rgba(255, 255, 255, 0.3)');
	glow.addColorStop(0.6, 'rgba(255, 255, 255, 0.1)');
	glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
	ctx.fillStyle = glow;
	ctx.fillRect(0, 0, 64, 64);

	// Subtle 4-point diffraction spikes
	ctx.globalCompositeOperation = 'lighter';

	const vSpike = ctx.createLinearGradient(cx, 0, cx, 64);
	vSpike.addColorStop(0, 'rgba(255, 255, 255, 0)');
	vSpike.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)');
	vSpike.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
	vSpike.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
	vSpike.addColorStop(1, 'rgba(255, 255, 255, 0)');
	ctx.fillStyle = vSpike;
	ctx.fillRect(cx - 1, 0, 2, 64);

	const hSpike = ctx.createLinearGradient(0, cy, 64, cy);
	hSpike.addColorStop(0, 'rgba(255, 255, 255, 0)');
	hSpike.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)');
	hSpike.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
	hSpike.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
	hSpike.addColorStop(1, 'rgba(255, 255, 255, 0)');
	ctx.fillStyle = hSpike;
	ctx.fillRect(0, cy - 1, 64, 2);

	// Bright core
	const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 6);
	core.addColorStop(0, 'rgba(255, 255, 255, 1)');
	core.addColorStop(0.4, 'rgba(255, 255, 255, 0.8)');
	core.addColorStop(1, 'rgba(255, 255, 255, 0)');
	ctx.fillStyle = core;
	ctx.beginPath();
	ctx.arc(cx, cy, 6, 0, Math.PI * 2);
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

// Helper to generate random color in nebula palette
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
		// Purple
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
		// Pink
		return {
			r: 0.9 + Math.random() * 0.1,
			g: 0.6 + Math.random() * 0.15,
			b: 0.7 + Math.random() * 0.15,
		};
	}
}

// Linear interpolation
function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

interface SphereProps {
	breathState: BreathState;
	config: VisualizationConfig;
	userCount: number;
}

export function Sphere({ breathState, config, userCount }: SphereProps) {
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	const geometryRef = useRef<THREE.BufferGeometry>(null);
	const breathStateRef = useRef(breathState);
	const prevUserCountRef = useRef(0);
	breathStateRef.current = breathState;

	// Configuration
	const contractedRadius = config.sphereContractedRadius ?? 0.7;
	const expandedRadius = config.sphereExpandedRadius ?? 2.2;

	// Get star texture (stable)
	const texture = useMemo(() => getStarTexture(), []);

	// Initialize particle state and GPU buffers once
	const { particles, buffers } = useMemo(() => {
		const particleList: Particle[] = [];
		const positions = new Float32Array(MAX_PARTICLES * 3);
		const alphas = new Float32Array(MAX_PARTICLES);
		const sizes = new Float32Array(MAX_PARTICLES);
		const colors = new Float32Array(MAX_PARTICLES * 3);

		// Initialize with Fibonacci sphere distribution
		for (let i = 0; i < MAX_PARTICLES; i++) {
			const phi = Math.acos(1 - (2 * (i + 0.5)) / MAX_PARTICLES);
			const theta = Math.PI * (1 + Math.sqrt(5)) * i;
			const r = expandedRadius * (0.3 + Math.random() * 0.7);

			const homeX = r * Math.sin(phi) * Math.cos(theta);
			const homeY = r * Math.sin(phi) * Math.sin(theta);
			const homeZ = r * Math.cos(phi);

			const color = generateParticleColor();

			// Create particle with physics state
			particleList.push({
				homeX,
				homeY,
				homeZ,
				x: homeX,
				y: homeY,
				z: homeZ,
				vx: 0,
				vy: 0,
				vz: 0,
				// Per-particle physics variation for organic feel
				stiffness: 0.25 + Math.random() * 0.15,
				damping: 0.985 + Math.random() * 0.01,
				alpha: 0,
				targetAlpha: 0, // Start inactive
				size: 22 + Math.random() * 28,
				colorR: color.r,
				colorG: color.g,
				colorB: color.b,
			});

			// Initialize GPU buffers
			positions[i * 3] = homeX;
			positions[i * 3 + 1] = homeY;
			positions[i * 3 + 2] = homeZ;
			alphas[i] = 0;
			sizes[i] = particleList[i].size;
			colors[i * 3] = color.r;
			colors[i * 3 + 1] = color.g;
			colors[i * 3 + 2] = color.b;
		}

		return {
			particles: particleList,
			buffers: { positions, alphas, sizes, colors },
		};
	}, [expandedRadius]);

	// Handle spawn/despawn when userCount changes
	useEffect(() => {
		const safeCount =
			typeof userCount === 'number' && !Number.isNaN(userCount)
				? Math.max(1, Math.min(userCount, MAX_PARTICLES))
				: 1;

		const prevCount = prevUserCountRef.current;

		// Spawn new particles
		for (let i = prevCount; i < safeCount; i++) {
			particles[i].targetAlpha = 1;
			particles[i].alpha = 0; // Start invisible, fade in
		}

		// Despawn excess particles
		for (let i = safeCount; i < prevCount; i++) {
			particles[i].targetAlpha = 0; // Fade out
		}

		prevUserCountRef.current = safeCount;
	}, [userCount, particles]);

	// Main animation loop - JS physics + GPU buffer updates
	useFrame((state) => {
		if (!(materialRef.current && geometryRef.current)) return;

		const elapsed = state.clock.elapsedTime;
		const breathValue = getBreathValue(breathStateRef.current);
		const mat = materialRef.current;
		const geo = geometryRef.current;

		// Update uniforms
		mat.uniforms.uTime.value = elapsed;
		mat.uniforms.uBreathValue.value = breathValue;

		// Calculate scale: contracted when inhaled (breathValue=1), expanded when exhaled (breathValue=0)
		const scale = lerp(expandedRadius, contractedRadius, breathValue);
		const scaleRatio = scale / expandedRadius;

		// Rotation: small fixed angle tied to breath value (not accumulating over time)
		// When inhaled (breathValue=1): rotated by ~15 degrees (0.26 rad)
		// When exhaled (breathValue=0): no rotation
		// This creates a gentle "twist" during inhale that unwinds during exhale
		const rotationAngle = breathValue * 0.26;
		const cosA = Math.cos(rotationAngle);
		const sinA = Math.sin(rotationAngle);

		// Get buffer arrays
		const posAttr = geo.attributes.position;
		const alphaAttr = geo.attributes.alpha;
		const positions = posAttr.array as Float32Array;
		const alphas = alphaAttr.array as Float32Array;

		// Physics loop for all potentially visible particles
		for (let i = 0; i < MAX_PARTICLES; i++) {
			const p = particles[i];

			// Alpha lerp (entry/exit fade)
			p.alpha += (p.targetAlpha - p.alpha) * 0.015;

			// Skip physics for invisible particles
			if (p.alpha < 0.001 && p.targetAlpha === 0) {
				alphas[i] = 0;
				continue;
			}

			// 1. Calculate scaled home position
			const scaledHomeX = p.homeX * scaleRatio;
			const scaledHomeY = p.homeY * scaleRatio;
			const scaledHomeZ = p.homeZ * scaleRatio;

			// 2. Rotate around Y axis (subtle twist during inhale)
			const targetX = scaledHomeX * cosA - scaledHomeZ * sinA;
			const targetZ = scaledHomeX * sinA + scaledHomeZ * cosA;
			const targetY = scaledHomeY;

			// 3. Spring physics (Euler integration with damping)
			const dx = targetX - p.x;
			const dy = targetY - p.y;
			const dz = targetZ - p.z;

			// Acceleration = stiffness * displacement
			p.vx += dx * p.stiffness;
			p.vy += dy * p.stiffness;
			p.vz += dz * p.stiffness;

			// Apply damping ("dense air" drag)
			p.vx *= p.damping;
			p.vy *= p.damping;
			p.vz *= p.damping;

			// Update position
			p.x += p.vx;
			p.y += p.vy;
			p.z += p.vz;

			// 4. Write to GPU buffer
			positions[i * 3] = p.x;
			positions[i * 3 + 1] = p.y;
			positions[i * 3 + 2] = p.z;
			alphas[i] = p.alpha;
		}

		// Signal GPU to read new data
		posAttr.needsUpdate = true;
		alphaAttr.needsUpdate = true;
	});

	return (
		<points>
			<bufferGeometry ref={geometryRef}>
				<bufferAttribute
					attach="attributes-position"
					args={[buffers.positions, 3]}
					usage={THREE.DynamicDrawUsage}
				/>
				<bufferAttribute
					attach="attributes-alpha"
					args={[buffers.alphas, 1]}
					usage={THREE.DynamicDrawUsage}
				/>
				<bufferAttribute attach="attributes-size" args={[buffers.sizes, 1]} />
				<bufferAttribute attach="attributes-color" args={[buffers.colors, 3]} />
			</bufferGeometry>
			<shaderMaterial
				ref={materialRef}
				uniforms={{
					uTime: { value: 0 },
					uBreathValue: { value: 0 },
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

// Also export with old name for backwards compatibility
export { Sphere as BreathingSphere };
