import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { BreathState } from '../../../hooks/useBreathSync';
import { getBreathValue } from '../../../lib/breathUtils';
import type { VisualizationConfig } from '../../../lib/config';

const PARTICLE_COUNT = 1500;

// Avatar/mood color palette
const COLOR_PALETTE = [
	[0.31, 0.8, 0.77], // Teal
	[1.0, 0.42, 0.42], // Coral
	[1.0, 0.9, 0.43], // Yellow
	[0.58, 0.88, 0.83], // Mint
	[0.95, 0.51, 0.51], // Salmon
	[0.67, 0.59, 0.85], // Lavender
	[0.99, 0.73, 0.83], // Pink
	[0.66, 0.85, 0.92], // Sky blue
	[0.98, 0.97, 0.44], // Lemon
	[0.53, 0.85, 0.69], // Seafoam
	[1.0, 0.67, 0.65], // Peach
	[0.71, 0.89, 0.98], // Light blue
	[0.86, 0.93, 0.76], // Pale green
	[1.0, 0.83, 0.71], // Apricot
	[0.79, 0.69, 1.0], // Lilac
];

// Simple noise function for fluid motion
function noise3D(x: number, y: number, z: number, t: number): number {
	return (
		Math.sin(x * 0.5 + t) *
			Math.cos(y * 0.5 + t * 0.7) *
			Math.sin(z * 0.5 + t * 0.3) *
			0.5 +
		Math.sin(x * 1.2 + t * 1.3) * Math.cos(y * 0.8 + t) * 0.3 +
		Math.cos(z * 0.9 + t * 0.9) * Math.sin(x * 0.7 + t * 0.5) * 0.2
	);
}

// Particle state
interface Particle {
	// Original position (for direction reference)
	ox: number;
	oy: number;
	oz: number;
	// Current position
	x: number;
	y: number;
	z: number;
	// Original distance from center
	originalDist: number;
	// Phase offset for variation
	phase: number;
}

// Vertex shader
const VERTEX_SHADER = `
attribute float size;

uniform float uBreathPhase;

varying vec3 vColor;
varying float vAlpha;
varying float vBreathPhase;

void main() {
	vColor = color;
	vBreathPhase = uBreathPhase;

	// Brighter on inhale (breathPhase = 1), more transparent on exhale
	vAlpha = 0.3 + uBreathPhase * 0.6;

	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
	gl_PointSize = size * (300.0 / -mvPosition.z);
	gl_Position = projectionMatrix * mvPosition;
}
`;

// Fragment shader
const FRAGMENT_SHADER = `
varying vec3 vColor;
varying float vAlpha;
varying float vBreathPhase;

void main() {
	float dist = length(gl_PointCoord - vec2(0.5));
	if (dist > 0.5) discard;

	float alpha = smoothstep(0.5, 0.1, dist) * vAlpha;

	// Add brightness boost on inhale
	float brightness = 1.0 + vBreathPhase * 0.5;
	vec3 color = vColor * brightness;

	// Add slight glow in center
	color += vec3(0.15) * (1.0 - dist * 2.0) * vBreathPhase;

	gl_FragColor = vec4(color, alpha);
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
	const timeRef = useRef(0);
	breathStateRef.current = breathState;

	// Radius configuration - dramatic compression
	const expandedRadius = config.sphereExpandedRadius ?? 2.2;
	const compressedRadius = config.sphereContractedRadius ?? 0.4;

	// Initialize particles
	const { particles, buffers } = useMemo(() => {
		const particleList: Particle[] = [];
		const positions = new Float32Array(PARTICLE_COUNT * 3);
		const sizes = new Float32Array(PARTICLE_COUNT);
		const colors = new Float32Array(PARTICLE_COUNT * 3);

		for (let i = 0; i < PARTICLE_COUNT; i++) {
			// Random spherical distribution
			const radius = 0.8 + Math.random() * 1.2;
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);

			const ox = radius * Math.sin(phi) * Math.cos(theta);
			const oy = radius * Math.sin(phi) * Math.sin(theta);
			const oz = radius * Math.cos(phi);

			const originalDist = Math.sqrt(ox * ox + oy * oy + oz * oz);

			particleList.push({
				ox,
				oy,
				oz,
				x: ox * expandedRadius,
				y: oy * expandedRadius,
				z: oz * expandedRadius,
				originalDist,
				phase: Math.random() * Math.PI * 2,
			});

			// Initial positions (expanded)
			positions[i * 3] = ox * expandedRadius;
			positions[i * 3 + 1] = oy * expandedRadius;
			positions[i * 3 + 2] = oz * expandedRadius;

			// Random size
			sizes[i] = 0.5 + Math.random() * 1.5;

			// Random color from palette
			const color =
				COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
			colors[i * 3] = color[0];
			colors[i * 3 + 1] = color[1];
			colors[i * 3 + 2] = color[2];
		}

		return { particles: particleList, buffers: { positions, sizes, colors } };
	}, [expandedRadius]);

	// Animation loop
	useFrame((_state, delta) => {
		if (!(geometryRef.current && materialRef.current && pointsRef.current))
			return;

		timeRef.current += delta;
		const time = timeRef.current;
		const breathPhase = getBreathValue(breathStateRef.current);

		// Update shader uniform
		materialRef.current.uniforms.uBreathPhase.value = breathPhase;

		const positionAttr = geometryRef.current.attributes.position;
		const positions = positionAttr.array as Float32Array;

		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const p = particles[i];

			// Normalize direction
			const nx = p.ox / p.originalDist;
			const ny = p.oy / p.originalDist;
			const nz = p.oz / p.originalDist;

			// Target radius based on breath phase
			// breathPhase 1 = inhaled (compressed), breathPhase 0 = exhaled (expanded)
			const targetRadius =
				expandedRadius - breathPhase * (expandedRadius - compressedRadius);

			// Add variation based on original position for organic feel
			const radiusVariation = (p.originalDist / 2) * 0.3;
			const particleTargetRadius = targetRadius * (0.85 + radiusVariation);

			// Calculate base position
			let x = nx * particleTargetRadius;
			let y = ny * particleTargetRadius;
			let z = nz * particleTargetRadius;

			// Add fluid noise displacement - less when compressed, more when expanded
			const noiseScale = 0.15;
			const noiseTime = time * 0.5;

			const noiseX = noise3D(
				p.ox * noiseScale,
				p.oy * noiseScale,
				p.oz * noiseScale,
				noiseTime + p.phase,
			);
			const noiseY = noise3D(
				p.oy * noiseScale,
				p.oz * noiseScale,
				p.ox * noiseScale,
				noiseTime + p.phase + 100,
			);
			const noiseZ = noise3D(
				p.oz * noiseScale,
				p.ox * noiseScale,
				p.oy * noiseScale,
				noiseTime + p.phase + 200,
			);

			// Noise strength decreases when inhaled (tighter formation)
			const noiseStrength = 0.1 + (1 - breathPhase) * 0.4;
			x += noiseX * noiseStrength;
			y += noiseY * noiseStrength;
			z += noiseZ * noiseStrength;

			// Add gentle floating motion - reduced when compressed
			const floatSpeed = 0.3;
			const floatAmount = 0.03 + (1 - breathPhase) * 0.05;
			x += Math.sin(time * floatSpeed + p.phase) * floatAmount;
			y += Math.cos(time * floatSpeed * 0.7 + p.phase) * floatAmount;
			z += Math.sin(time * floatSpeed * 0.5 + p.phase * 1.3) * floatAmount;

			positions[i * 3] = x;
			positions[i * 3 + 1] = y;
			positions[i * 3 + 2] = z;
		}

		positionAttr.needsUpdate = true;

		// Rotate the entire particle system slowly
		pointsRef.current.rotation.y += 0.002;
		pointsRef.current.rotation.x = Math.sin(time * 0.1) * 0.1;
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
					uBreathPhase: { value: 0 },
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
