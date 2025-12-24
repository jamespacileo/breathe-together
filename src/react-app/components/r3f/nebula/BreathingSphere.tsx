import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { BreathState } from '../../../hooks/useBreathSync';
import { getBreathValue } from '../../../lib/breathUtils';
import type { VisualizationConfig } from '../../../lib/config';

const PARTICLE_COUNT = 300;

// Simple 3D noise function for organic drift
function noise3D(x: number, y: number, z: number, seed: number): number {
	const n =
		Math.sin(x * 1.2 + seed) * Math.cos(y * 0.9 + seed * 0.7) +
		Math.sin(y * 1.1 + seed * 0.5) * Math.cos(z * 0.8 + seed * 0.3) +
		Math.sin(z * 1.0 + seed * 0.9) * Math.cos(x * 0.7 + seed * 0.6);
	return n / 3;
}

// Particle state for fluid simulation
interface Particle {
	// Spherical coordinates (stable reference)
	theta: number;
	phi: number;
	baseRadius: number;

	// Current position (animated)
	x: number;
	y: number;
	z: number;

	// Velocity for spring physics
	vx: number;
	vy: number;
	vz: number;

	// Noise offsets for organic drift
	noiseOffsetX: number;
	noiseOffsetY: number;
	noiseOffsetZ: number;

	// Per-particle variation
	radiusVariation: number;
	driftSpeed: number;
}

// Vertex shader - simple point rendering with size attenuation
const VERTEX_SHADER = `
attribute float size;

uniform float uTime;
uniform float uBreathValue;

varying vec3 vColor;
varying float vAlpha;

void main() {
	vColor = color;

	// Subtle twinkle based on position
	float twinkle = sin(uTime * 0.5 + position.x * 3.0 + position.y * 2.0) * 0.15 + 0.85;
	vAlpha = twinkle;

	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
	float dist = -mvPosition.z;

	// Size attenuation with distance
	gl_PointSize = size * (5.0 / dist) * (0.8 + uBreathValue * 0.2);
	gl_Position = projectionMatrix * mvPosition;
}
`;

// Fragment shader - soft glowing particle
const FRAGMENT_SHADER = `
varying vec3 vColor;
varying float vAlpha;

void main() {
	// Soft circular gradient
	vec2 center = gl_PointCoord - 0.5;
	float dist = length(center);

	// Soft falloff
	float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
	alpha *= alpha; // Extra soft edges

	if (alpha < 0.01) discard;

	gl_FragColor = vec4(vColor, alpha * vAlpha * 0.9);
}
`;

interface BreathingSphereProps {
	breathState: BreathState;
	config: VisualizationConfig;
	userCount: number;
}

export function BreathingSphere({ breathState, config }: BreathingSphereProps) {
	const pointsRef = useRef<THREE.Points>(null);
	const geometryRef = useRef<THREE.BufferGeometry>(null);
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	const breathStateRef = useRef(breathState);
	const rotationRef = useRef(0);
	breathStateRef.current = breathState;

	// Configuration
	const contractedRadius = config.sphereContractedRadius ?? 0.7;
	const expandedRadius = config.sphereExpandedRadius ?? 2.2;

	// Initialize particles with spherical distribution
	const { particles, buffers } = useMemo(() => {
		const particleList: Particle[] = [];
		const positions = new Float32Array(PARTICLE_COUNT * 3);
		const sizes = new Float32Array(PARTICLE_COUNT);
		const colors = new Float32Array(PARTICLE_COUNT * 3);

		for (let i = 0; i < PARTICLE_COUNT; i++) {
			// Fibonacci sphere distribution for even spacing
			const phi = Math.acos(1 - (2 * (i + 0.5)) / PARTICLE_COUNT);
			const theta = Math.PI * (1 + Math.sqrt(5)) * i;

			// Varied base radius for depth
			const baseRadius = 0.8 + Math.random() * 0.4;

			// Initial position at expanded state
			const x = baseRadius * expandedRadius * Math.sin(phi) * Math.cos(theta);
			const y = baseRadius * expandedRadius * Math.sin(phi) * Math.sin(theta);
			const z = baseRadius * expandedRadius * Math.cos(phi);

			particleList.push({
				theta,
				phi,
				baseRadius,
				x,
				y,
				z,
				vx: 0,
				vy: 0,
				vz: 0,
				noiseOffsetX: Math.random() * 100,
				noiseOffsetY: Math.random() * 100,
				noiseOffsetZ: Math.random() * 100,
				radiusVariation: 0.9 + Math.random() * 0.2,
				driftSpeed: 0.3 + Math.random() * 0.4,
			});

			// Set initial positions
			positions[i * 3] = x;
			positions[i * 3 + 1] = y;
			positions[i * 3 + 2] = z;

			// Varied particle sizes
			sizes[i] = 15 + Math.random() * 20;

			// Color palette: soft blues and cyans with some warm whites
			const colorChoice = Math.random();
			if (colorChoice < 0.5) {
				// Soft cyan-blue
				colors[i * 3] = 0.5 + Math.random() * 0.2; // R
				colors[i * 3 + 1] = 0.7 + Math.random() * 0.2; // G
				colors[i * 3 + 2] = 0.9 + Math.random() * 0.1; // B
			} else if (colorChoice < 0.8) {
				// Soft purple
				colors[i * 3] = 0.6 + Math.random() * 0.2; // R
				colors[i * 3 + 1] = 0.5 + Math.random() * 0.2; // G
				colors[i * 3 + 2] = 0.85 + Math.random() * 0.15; // B
			} else {
				// Warm white
				colors[i * 3] = 0.9 + Math.random() * 0.1; // R
				colors[i * 3 + 1] = 0.85 + Math.random() * 0.1; // G
				colors[i * 3 + 2] = 0.8 + Math.random() * 0.15; // B
			}
		}

		return { particles: particleList, buffers: { positions, sizes, colors } };
	}, [expandedRadius]);

	// Animation loop
	useFrame((state) => {
		if (!(geometryRef.current && materialRef.current)) return;

		const time = state.clock.elapsedTime;
		const breathValue = getBreathValue(breathStateRef.current);

		// Update shader uniforms
		materialRef.current.uniforms.uTime.value = time;
		materialRef.current.uniforms.uBreathValue.value = breathValue;

		// Target radius: contracts when inhaled (breathValue=1), expands when exhaled (breathValue=0)
		const targetRadius =
			expandedRadius - (expandedRadius - contractedRadius) * breathValue;

		// Slow continuous rotation
		rotationRef.current += 0.002;
		const rotation = rotationRef.current;
		const cosR = Math.cos(rotation);
		const sinR = Math.sin(rotation);

		const positionAttr = geometryRef.current.attributes.position;
		const positions = positionAttr.array as Float32Array;

		// Spring physics parameters - soft and floaty
		const stiffness = 0.015; // Low stiffness for slow, fluid response
		const damping = 0.92; // High damping for thick fluid feel

		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const p = particles[i];

			// Calculate target position on sphere with current radius
			const radius = targetRadius * p.baseRadius * p.radiusVariation;

			// Add organic drift using noise
			const driftAmount = 0.15;
			const driftX =
				noise3D(time * p.driftSpeed + p.noiseOffsetX, p.theta, p.phi, 1) *
				driftAmount;
			const driftY =
				noise3D(p.theta, time * p.driftSpeed + p.noiseOffsetY, p.phi, 2) *
				driftAmount;
			const driftZ =
				noise3D(p.theta, p.phi, time * p.driftSpeed + p.noiseOffsetZ, 3) *
				driftAmount;

			// Spherical to cartesian with drift
			const baseX = (radius + driftX) * Math.sin(p.phi) * Math.cos(p.theta);
			const baseY = (radius + driftY) * Math.sin(p.phi) * Math.sin(p.theta);
			const baseZ = (radius + driftZ) * Math.cos(p.phi);

			// Apply rotation around Y axis
			const targetX = baseX * cosR - baseZ * sinR;
			const targetZ = baseX * sinR + baseZ * cosR;
			const targetY = baseY;

			// Spring physics toward target
			const dx = targetX - p.x;
			const dy = targetY - p.y;
			const dz = targetZ - p.z;

			// Acceleration proportional to displacement
			p.vx += dx * stiffness;
			p.vy += dy * stiffness;
			p.vz += dz * stiffness;

			// Apply damping (fluid resistance)
			p.vx *= damping;
			p.vy *= damping;
			p.vz *= damping;

			// Update position
			p.x += p.vx;
			p.y += p.vy;
			p.z += p.vz;

			// Write to buffer
			positions[i * 3] = p.x;
			positions[i * 3 + 1] = p.y;
			positions[i * 3 + 2] = p.z;
		}

		positionAttr.needsUpdate = true;
	});

	return (
		<points ref={pointsRef}>
			<bufferGeometry ref={geometryRef}>
				<bufferAttribute
					attach="attributes-position"
					args={[buffers.positions, 3]}
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
