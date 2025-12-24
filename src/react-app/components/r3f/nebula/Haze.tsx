import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { BreathState } from '../../../hooks/useBreathSync';
import { getBreathValue } from '../../../lib/breathPatterns';
import type { VisualizationConfig } from '../../../lib/visualConfig';

// Simple vertex shader for haze particles
const VERTEX_SHADER = `
attribute float size;

varying float vDist;

void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vDist = -mvPosition.z;
  gl_PointSize = size * (300.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`;

// Fragment shader with soft falloff
const FRAGMENT_SHADER = `
uniform float uOpacity;
uniform vec3 uColor;

varying float vDist;

void main() {
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  // Very soft falloff
  float alpha = exp(-dist * dist * 8.0) * uOpacity;

  // Distance fade
  float fade = smoothstep(10.0, 3.0, vDist);

  if (alpha * fade < 0.005) discard;

  gl_FragColor = vec4(uColor, alpha * fade);
}
`;

// Haze particle data
interface HazeParticle {
	baseX: number;
	baseY: number;
	baseZ: number;
	driftSpeed: number;
	driftOffset: number;
}

interface HazeProps {
	breathState: BreathState;
	config: VisualizationConfig;
	userCount: number;
}

export function Haze({ breathState, config, userCount }: HazeProps) {
	const pointsRef = useRef<THREE.Points>(null);
	const startTimeRef = useRef(Date.now());
	const breathStateRef = useRef(breathState);
	breathStateRef.current = breathState;

	// Scale haze count with user count but cap it
	const hazeCount = Math.min(Math.max(userCount * 2, 20), 150);

	// Store particles in ref
	const particlesRef = useRef<HazeParticle[]>([]);

	// Store buffers in ref
	const buffersRef = useRef<{
		positions: Float32Array;
		sizes: Float32Array;
	} | null>(null);

	// Initialize haze particles
	useEffect(() => {
		const particles: HazeParticle[] = [];

		for (let i = 0; i < hazeCount; i++) {
			const r = 2.5 + Math.random() * 3;
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);

			particles.push({
				baseX: r * Math.sin(phi) * Math.cos(theta),
				baseY: r * Math.sin(phi) * Math.sin(theta),
				baseZ: r * Math.cos(phi),
				driftSpeed: 0.08 + Math.random() * 0.12,
				driftOffset: Math.random() * Math.PI * 2,
			});
		}

		particlesRef.current = particles;

		// Initialize buffers
		buffersRef.current = {
			positions: new Float32Array(hazeCount * 3),
			sizes: new Float32Array(hazeCount),
		};

		// Fill initial values
		for (let i = 0; i < hazeCount; i++) {
			const p = particles[i];
			buffersRef.current.positions[i * 3] = p.baseX;
			buffersRef.current.positions[i * 3 + 1] = p.baseY;
			buffersRef.current.positions[i * 3 + 2] = p.baseZ;
			buffersRef.current.sizes[i] = 0.4;
		}
	}, [hazeCount]);

	// Animation loop
	useFrame(() => {
		if (!(pointsRef.current && buffersRef.current)) return;

		const particles = particlesRef.current;
		if (particles.length === 0) return;

		const elapsed = (Date.now() - startTimeRef.current) / 1000;
		const breathValue = getBreathValue(breathStateRef.current);

		const { positions, sizes } = buffersRef.current;

		// Update haze positions with slow drift
		for (let i = 0; i < particles.length; i++) {
			const p = particles[i];

			positions[i * 3] =
				p.baseX + Math.sin(elapsed * p.driftSpeed + p.driftOffset) * 0.25;
			positions[i * 3 + 1] =
				p.baseY + Math.cos(elapsed * p.driftSpeed * 0.7 + p.driftOffset) * 0.2;
			// z stays mostly static
		}

		// Update geometry
		const geometry = pointsRef.current.geometry;
		if (geometry.attributes.position) {
			(geometry.attributes.position.array as Float32Array).set(positions);
			geometry.attributes.position.needsUpdate = true;
		}
		if (geometry.attributes.size) {
			(geometry.attributes.size.array as Float32Array).set(sizes);
			geometry.attributes.size.needsUpdate = true;
		}

		// Update material opacity based on breathing (matches HTML example)
		const material = pointsRef.current.material as THREE.ShaderMaterial;
		if (material.uniforms?.uOpacity) {
			// Simple formula from HTML example: 0.06 base + 0.06 breath modulation
			material.uniforms.uOpacity.value = 0.06 + breathValue * 0.06;
		}
	});

	return (
		<points ref={pointsRef}>
			<bufferGeometry>
				<bufferAttribute
					attach="attributes-position"
					args={[new Float32Array(hazeCount * 3), 3]}
				/>
				<bufferAttribute
					attach="attributes-size"
					args={[buffersRef.current?.sizes || new Float32Array(hazeCount), 1]}
				/>
			</bufferGeometry>
			<shaderMaterial
				vertexShader={VERTEX_SHADER}
				fragmentShader={FRAGMENT_SHADER}
				uniforms={{
					uOpacity: { value: config.hazeOpacity ?? 0.08 },
					uColor: { value: new THREE.Vector3(0.35, 0.45, 0.55) },
				}}
				transparent
				depthWrite={false}
				blending={THREE.AdditiveBlending}
			/>
		</points>
	);
}

// Also export with old name for backwards compatibility
export { Haze as HazeLayer };
