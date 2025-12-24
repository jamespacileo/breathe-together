import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { BreathState } from '../../../hooks/useBreathSync';
import { getBreathValue } from '../../../lib/breathUtils';
import type { VisualizationConfig } from '../../../lib/config';

const PARTICLE_COUNT = 1500;

// Avatar/mood color palette - slightly muted for softer look
const COLOR_PALETTE = [
	[0.31, 0.75, 0.72], // Teal
	[0.9, 0.45, 0.45], // Coral
	[0.95, 0.85, 0.45], // Yellow
	[0.55, 0.82, 0.78], // Mint
	[0.88, 0.52, 0.52], // Salmon
	[0.62, 0.56, 0.78], // Lavender
	[0.92, 0.7, 0.78], // Pink
	[0.62, 0.8, 0.88], // Sky blue
	[0.92, 0.9, 0.45], // Lemon
	[0.5, 0.8, 0.65], // Seafoam
	[0.92, 0.65, 0.62], // Peach
	[0.68, 0.85, 0.92], // Light blue
	[0.82, 0.88, 0.72], // Pale green
	[0.95, 0.8, 0.68], // Apricot
	[0.75, 0.65, 0.92], // Lilac
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
	ox: number;
	oy: number;
	oz: number;
	x: number;
	y: number;
	z: number;
	originalDist: number;
	phase: number;
}

// Vertex shader with configurable brightness and size
const VERTEX_SHADER = `
attribute float size;

uniform float uBreathPhase;
uniform float uBrightness;
uniform float uSizeMultiplier;

varying vec3 vColor;
varying float vAlpha;
varying float vBrightness;

void main() {
	vColor = color;
	vBrightness = uBrightness;

	// Softer alpha variation with breath
	vAlpha = 0.2 + uBreathPhase * 0.4;

	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
	gl_PointSize = size * uSizeMultiplier * (250.0 / -mvPosition.z);
	gl_Position = projectionMatrix * mvPosition;
}
`;

// Fragment shader with reduced glow
const FRAGMENT_SHADER = `
varying vec3 vColor;
varying float vAlpha;
varying float vBrightness;

void main() {
	float dist = length(gl_PointCoord - vec2(0.5));
	if (dist > 0.5) discard;

	// Softer falloff
	float alpha = smoothstep(0.5, 0.15, dist) * vAlpha;

	// Apply configurable brightness
	vec3 color = vColor * vBrightness;

	// Subtle center highlight only
	color += vec3(0.05) * (1.0 - dist * 2.0);

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

	// Use config values with defaults
	const expandedRadius = config.sphereExpandedRadius;
	const compressedRadius = config.sphereContractedRadius;
	const noiseStrength = config.noiseStrength;
	const rotationSpeed = config.rotationSpeed;
	const brightness = config.particleBrightness;
	const sizeMultiplier = config.particleSize;

	// Initialize particles
	const { particles, buffers } = useMemo(() => {
		const particleList: Particle[] = [];
		const positions = new Float32Array(PARTICLE_COUNT * 3);
		const sizes = new Float32Array(PARTICLE_COUNT);
		const colors = new Float32Array(PARTICLE_COUNT * 3);

		for (let i = 0; i < PARTICLE_COUNT; i++) {
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

			positions[i * 3] = ox * expandedRadius;
			positions[i * 3 + 1] = oy * expandedRadius;
			positions[i * 3 + 2] = oz * expandedRadius;

			sizes[i] = 0.5 + Math.random() * 1.5;

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

		// Update shader uniforms
		const uniforms = materialRef.current.uniforms;
		uniforms.uBreathPhase.value = breathPhase;
		uniforms.uBrightness.value = brightness;
		uniforms.uSizeMultiplier.value = sizeMultiplier;

		const positionAttr = geometryRef.current.attributes.position;
		const positions = positionAttr.array as Float32Array;

		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const p = particles[i];

			const nx = p.ox / p.originalDist;
			const ny = p.oy / p.originalDist;
			const nz = p.oz / p.originalDist;

			const targetRadius =
				expandedRadius - breathPhase * (expandedRadius - compressedRadius);

			const radiusVariation = (p.originalDist / 2) * 0.3;
			const particleTargetRadius = targetRadius * (0.85 + radiusVariation);

			let x = nx * particleTargetRadius;
			let y = ny * particleTargetRadius;
			let z = nz * particleTargetRadius;

			// Configurable noise displacement
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

			// Use configurable noise strength
			const effectiveNoiseStrength =
				(0.1 + (1 - breathPhase) * 0.4) * noiseStrength;
			x += noiseX * effectiveNoiseStrength;
			y += noiseY * effectiveNoiseStrength;
			z += noiseZ * effectiveNoiseStrength;

			// Gentle floating motion
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

		// Configurable rotation
		pointsRef.current.rotation.y += rotationSpeed;
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
					uBrightness: { value: brightness },
					uSizeMultiplier: { value: sizeMultiplier },
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
