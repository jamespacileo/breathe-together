/**
 * Peripheral Vision Particles
 *
 * These particles exist in the outer edges of vision - almost invisible when
 * looked at directly, but creating a subtle sense of being "cocooned" in the
 * breathing experience. They drift gently inward during inhale, outward during
 * exhale, and move slower during holds.
 *
 * This leverages the fact that peripheral vision is more sensitive to motion
 * than central vision.
 */

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { EnhancedBreathData } from './GPGPUScene';

const PERIPHERAL_COUNT = 60; // Sparse - felt not seen
const PERIPHERAL_DISTANCE = 35; // Far from center

const peripheralVertexShader = `
uniform float uTime;
uniform float uBreathPhase;
uniform float uDiaphragmDirection;
uniform float uCrystallization;
uniform vec2 uViewOffset;

attribute float aPhase;
attribute float aSize;

varying float vAlpha;
varying float vPhase;

void main() {
  vec3 pos = position;

  // Radial breathing motion - inward during inhale, outward during exhale
  float radialOffset = (uBreathPhase - 0.5) * 2.0; // -1 to 1
  float dist = length(pos.xy);
  vec2 dir = dist > 0.001 ? normalize(pos.xy) : vec2(0.0, 1.0);

  // Drift toward/away from center based on breath
  pos.xy -= dir * radialOffset * 1.5;

  // Vertical drift for diaphragmatic cue (very subtle)
  pos.y += uDiaphragmDirection * 0.3 * (1.0 - uCrystallization);

  // Micro-saccade response (view offset)
  pos.x += uViewOffset.x * 15.0;
  pos.y += uViewOffset.y * 15.0;

  // Gentle orbital drift (slower during holds)
  float orbitSpeed = 0.05 * (1.0 - uCrystallization * 0.7);
  float angle = uTime * orbitSpeed + aPhase * 6.28;
  float cosA = cos(angle);
  float sinA = sin(angle);
  vec3 rotatedPos = vec3(
    pos.x * cosA - pos.z * sinA,
    pos.y,
    pos.x * sinA + pos.z * cosA
  );

  vec4 mvPosition = modelViewMatrix * vec4(rotatedPos, 1.0);

  // Size based on distance (larger when further = more peripheral)
  float depthSize = 1.0 + (-mvPosition.z - 30.0) * 0.02;
  gl_PointSize = aSize * depthSize * 2.0;

  // Very low alpha - these should be felt, not seen
  // Even lower during holds (crystallization)
  vAlpha = 0.08 * (1.0 - uCrystallization * 0.5);
  vPhase = aPhase;

  gl_Position = projectionMatrix * mvPosition;
}
`;

const peripheralFragmentShader = `
uniform float uTime;
uniform float uBreathPhase;

varying float vAlpha;
varying float vPhase;

void main() {
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);

  // Soft, diffuse particles
  float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;

  if (alpha < 0.001) discard;

  // Very subtle color - almost gray with hint of the breathing color
  vec3 color = vec3(0.4, 0.5, 0.55);

  // Subtle pulse synchronized with breath
  float pulse = sin(uTime * 0.5 + vPhase * 6.28) * 0.1 + 0.9;
  alpha *= pulse;

  gl_FragColor = vec4(color, alpha);
}
`;

interface PeripheralParticlesProps {
	breathData: EnhancedBreathData;
}

export function PeripheralParticles({ breathData }: PeripheralParticlesProps) {
	const materialRef = useRef<THREE.ShaderMaterial>(null);

	const { geometry, positions } = useMemo(() => {
		const geo = new THREE.BufferGeometry();
		const pos = new Float32Array(PERIPHERAL_COUNT * 3);
		const phases = new Float32Array(PERIPHERAL_COUNT);
		const sizes = new Float32Array(PERIPHERAL_COUNT);

		for (let i = 0; i < PERIPHERAL_COUNT; i++) {
			// Distribute in a ring around the outer edges
			const angle = (i / PERIPHERAL_COUNT) * Math.PI * 2 + Math.random() * 0.5;
			const radiusVariation = 0.8 + Math.random() * 0.4;
			const radius = PERIPHERAL_DISTANCE * radiusVariation;

			// Slight z variation for depth
			const z = (Math.random() - 0.5) * 20;

			pos[i * 3] = Math.cos(angle) * radius;
			pos[i * 3 + 1] = Math.sin(angle) * radius;
			pos[i * 3 + 2] = z;

			phases[i] = Math.random();
			sizes[i] = 8 + Math.random() * 12;
		}

		geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
		geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
		geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

		return { geometry: geo, positions: pos };
	}, []);

	useFrame((state) => {
		if (!materialRef.current) return;

		const mat = materialRef.current;
		mat.uniforms.uTime.value = state.clock.elapsedTime;
		mat.uniforms.uBreathPhase.value = breathData.breathPhase;
		mat.uniforms.uDiaphragmDirection.value = breathData.diaphragmDirection;
		mat.uniforms.uCrystallization.value = breathData.crystallization;
		mat.uniforms.uViewOffset.value.set(
			breathData.viewOffset.x,
			breathData.viewOffset.y
		);
	});

	return (
		<points geometry={geometry}>
			<shaderMaterial
				ref={materialRef}
				uniforms={{
					uTime: { value: 0 },
					uBreathPhase: { value: 0 },
					uDiaphragmDirection: { value: 0 },
					uCrystallization: { value: 0 },
					uViewOffset: { value: new THREE.Vector2(0, 0) },
				}}
				vertexShader={peripheralVertexShader}
				fragmentShader={peripheralFragmentShader}
				transparent
				blending={THREE.AdditiveBlending}
				depthWrite={false}
			/>
		</points>
	);
}
