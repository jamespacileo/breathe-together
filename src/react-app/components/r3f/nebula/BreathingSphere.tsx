import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { BreathState } from '../../../hooks/useBreathSync';
import { getBreathValue } from '../../../lib/breathUtils';
import type { VisualizationConfig } from '../../../lib/config';

// Vertex shader matching the HTML example
const VERTEX_SHADER = `
attribute float size;
varying vec3 vColor;
varying float vDist;

void main() {
  vColor = color;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vDist = -mv.z;
  gl_PointSize = size * (4.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

// Fragment shader matching the HTML example
const FRAGMENT_SHADER = `
uniform sampler2D uTexture;
varying vec3 vColor;
varying float vDist;

void main() {
  vec4 tex = texture2D(uTexture, gl_PointCoord);
  float fade = smoothstep(8.0, 2.0, vDist);
  gl_FragColor = vec4(vColor, tex.a * 0.7 * fade);
}
`;

// Create glow texture matching the HTML example exactly
function createGlowTexture(): THREE.CanvasTexture {
	const canvas = document.createElement('canvas');
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext('2d')!;

	const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
	gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
	gradient.addColorStop(0.15, 'rgba(255, 255, 255, 0.7)');
	gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.2)');
	gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

	ctx.fillStyle = gradient;
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

// 3D noise function for organic movement
function noise3D(x: number, y: number, z: number, time: number): number {
	const freq = 0.8;
	return (
		(Math.sin(x * freq + time) * Math.cos(y * freq * 0.7 + time * 1.1) +
			Math.sin(z * freq * 0.9 + time * 0.8) *
				Math.cos(x * freq * 0.6 - time * 0.9) +
			Math.sin(y * freq * 0.8 - time * 1.2) *
				Math.cos(z * freq * 0.5 + time * 0.7)) *
		0.33
	);
}

// Particle data structure
interface Particle {
	homeX: number;
	homeY: number;
	homeZ: number;
	x: number;
	y: number;
	z: number;
	vx: number;
	vy: number;
	vz: number;
	phaseOffset: number;
	stiffness: number;
	damping: number;
	twinkleSpeed: number;
	twinkleOffset: number;
	baseSize: number;
	pulseSpeed: number;
	pulseOffset: number;
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
	const pointsRef = useRef<THREE.Points>(null);
	const groupRef = useRef<THREE.Group>(null);
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	const startTimeRef = useRef(Date.now());
	const breathStateRef = useRef(breathState);
	breathStateRef.current = breathState;

	// Configuration
	const safeUserCount =
		typeof userCount === 'number' && !Number.isNaN(userCount) ? userCount : 1;
	const particleCount = Math.max(1, Math.min(safeUserCount, 500));
	const contractedRadius = config.sphereContractedRadius ?? 0.7;
	const expandedRadius = config.sphereExpandedRadius ?? 2.2;
	const rotationSpeed = config.sphereRotationSpeed ?? 0.025;

	// Store particles in ref for mutation during animation
	const particlesRef = useRef<Particle[]>([]);

	// Get glow texture
	const texture = useMemo(() => getGlowTexture(), []);

	// Initialize particles and buffers
	const { positions, colors, sizes, particles } = useMemo(() => {
		const count = particleCount;
		const newParticles: Particle[] = [];

		const positionsArr = new Float32Array(count * 3);
		const colorsArr = new Float32Array(count * 3);
		const sizesArr = new Float32Array(count);

		for (let i = 0; i < count; i++) {
			// Fibonacci sphere distribution
			const phi = Math.acos(1 - (2 * (i + 0.5)) / Math.max(count, 1));
			const theta = Math.PI * (1 + Math.sqrt(5)) * i;
			const baseRadius = expandedRadius * (0.3 + Math.random() * 0.7);

			const homeX = baseRadius * Math.sin(phi) * Math.cos(theta);
			const homeY = baseRadius * Math.sin(phi) * Math.sin(theta);
			const homeZ = baseRadius * Math.cos(phi);

			// Particle size: larger when fewer users for visibility
			const baseSize =
				count < 10 ? 25 + Math.random() * 20 : 12 + Math.random() * 18;

			newParticles.push({
				homeX,
				homeY,
				homeZ,
				x: homeX,
				y: homeY,
				z: homeZ,
				vx: 0,
				vy: 0,
				vz: 0,
				phaseOffset: Math.random() * Math.PI * 2,
				stiffness: 1.2 + Math.random() * 0.8,
				damping: 0.94 + Math.random() * 0.03,
				twinkleSpeed: 0.4 + Math.random() * 1.5,
				twinkleOffset: Math.random() * Math.PI * 2,
				baseSize,
				pulseSpeed: 0.2 + Math.random() * 0.3,
				pulseOffset: Math.random() * Math.PI * 2,
			});

			// Initial positions
			positionsArr[i * 3] = homeX;
			positionsArr[i * 3 + 1] = homeY;
			positionsArr[i * 3 + 2] = homeZ;

			// Color palette matching the HTML example exactly
			const c = Math.random();
			if (c < 0.35) {
				// Light blue (35%)
				colorsArr[i * 3] = 0.45 + Math.random() * 0.15;
				colorsArr[i * 3 + 1] = 0.75 + Math.random() * 0.15;
				colorsArr[i * 3 + 2] = 0.9 + Math.random() * 0.1;
			} else if (c < 0.65) {
				// Purple-blue (30%)
				colorsArr[i * 3] = 0.65 + Math.random() * 0.15;
				colorsArr[i * 3 + 1] = 0.55 + Math.random() * 0.15;
				colorsArr[i * 3 + 2] = 0.9 + Math.random() * 0.1;
			} else if (c < 0.85) {
				// Warm white (20%)
				colorsArr[i * 3] = 0.95;
				colorsArr[i * 3 + 1] = 0.9 + Math.random() * 0.05;
				colorsArr[i * 3 + 2] = 0.85 + Math.random() * 0.1;
			} else {
				// Pink-magenta (15%)
				colorsArr[i * 3] = 0.9 + Math.random() * 0.1;
				colorsArr[i * 3 + 1] = 0.6 + Math.random() * 0.15;
				colorsArr[i * 3 + 2] = 0.7 + Math.random() * 0.15;
			}

			sizesArr[i] = baseSize;
		}

		particlesRef.current = newParticles;

		return {
			positions: positionsArr,
			colors: colorsArr,
			sizes: sizesArr,
			particles: newParticles,
		};
	}, [particleCount, expandedRadius]);

	// Animation loop
	useFrame(() => {
		if (!(pointsRef.current && groupRef.current)) return;

		const currentParticles = particlesRef.current;
		if (currentParticles.length === 0) return;

		const elapsed = (Date.now() - startTimeRef.current) / 1000;
		const breathValue = getBreathValue(breathStateRef.current);

		const targetRadius =
			expandedRadius - (expandedRadius - contractedRadius) * breathValue;
		const scale = targetRadius / expandedRadius;

		for (let i = 0; i < currentParticles.length; i++) {
			const p = currentParticles[i];

			// Target position based on breath
			const tx = p.homeX * scale;
			const ty = p.homeY * scale;
			const tz = p.homeZ * scale;

			// Noise for organic movement - use HOME position (stable), not animated
			const noiseStrength = 0.1 * (1 - breathValue * 0.5);
			const noiseTime = elapsed * 0.35 + p.phaseOffset;
			const nx = noise3D(p.homeX, p.homeY, p.homeZ, noiseTime) * noiseStrength;
			const ny =
				noise3D(p.homeY, p.homeZ, p.homeX, noiseTime + 100) * noiseStrength;
			const nz =
				noise3D(p.homeZ, p.homeX, p.homeY, noiseTime + 200) * noiseStrength;

			// Spring physics
			const dx = tx + nx - p.x;
			const dy = ty + ny - p.y;
			const dz = tz + nz - p.z;

			p.vx = (p.vx + dx * p.stiffness * 0.016) * p.damping;
			p.vy = (p.vy + dy * p.stiffness * 0.016) * p.damping;
			p.vz = (p.vz + dz * p.stiffness * 0.016) * p.damping;

			p.x += p.vx;
			p.y += p.vy;
			p.z += p.vz;

			// Update position buffer
			positions[i * 3] = p.x;
			positions[i * 3 + 1] = p.y;
			positions[i * 3 + 2] = p.z;

			// Twinkle and pulse effects on size
			const twinkle = Math.sin(elapsed * p.twinkleSpeed + p.twinkleOffset);
			const pulse = Math.sin(elapsed * p.pulseSpeed + p.pulseOffset);
			sizes[i] = p.baseSize * (0.75 + twinkle * 0.25) * (1 + pulse * 0.1);
		}

		// Update geometry attributes
		const geometry = pointsRef.current.geometry;
		if (geometry.attributes.position) {
			geometry.attributes.position.needsUpdate = true;
		}
		if (geometry.attributes.size) {
			geometry.attributes.size.needsUpdate = true;
		}

		// Slow rotation
		groupRef.current.rotation.y = elapsed * rotationSpeed;
		groupRef.current.rotation.x = Math.sin(elapsed * 0.06) * 0.06;
	});

	return (
		<group ref={groupRef}>
			<points ref={pointsRef}>
				<bufferGeometry>
					<bufferAttribute attach="attributes-position" args={[positions, 3]} />
					<bufferAttribute attach="attributes-color" args={[colors, 3]} />
					<bufferAttribute attach="attributes-size" args={[sizes, 1]} />
				</bufferGeometry>
				<shaderMaterial
					ref={materialRef}
					uniforms={{ uTexture: { value: texture } }}
					vertexShader={VERTEX_SHADER}
					fragmentShader={FRAGMENT_SHADER}
					transparent
					vertexColors
					blending={THREE.AdditiveBlending}
					depthWrite={false}
				/>
			</points>
		</group>
	);
}
