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
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
	peripheralFragmentShader,
	peripheralVertexShader,
} from '../../shaders';
import type { EnhancedBreathData } from './GPGPUScene';

const PERIPHERAL_COUNT = 60; // Sparse - felt not seen
const PERIPHERAL_DISTANCE = 35; // Far from center

interface PeripheralParticlesProps {
	breathData: EnhancedBreathData;
}

export function PeripheralParticles({ breathData }: PeripheralParticlesProps) {
	const materialRef = useRef<THREE.ShaderMaterial>(null);

	// Ref for props used inside useFrame (avoids stale closure capture)
	const breathDataRef = useRef(breathData);
	breathDataRef.current = breathData;

	const { geometry } = useMemo(() => {
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

		return { geometry: geo };
	}, []);

	// Cleanup geometry on unmount
	useEffect(() => {
		return () => {
			geometry.dispose();
		};
	}, [geometry]);

	useFrame((state) => {
		if (!materialRef.current) return;

		const currentBreathData = breathDataRef.current;
		const mat = materialRef.current;
		mat.uniforms.uTime.value = state.clock.elapsedTime;
		mat.uniforms.uBreathPhase.value = currentBreathData.breathPhase;
		mat.uniforms.uDiaphragmDirection.value =
			currentBreathData.diaphragmDirection;
		mat.uniforms.uCrystallization.value = currentBreathData.crystallization;
		mat.uniforms.uViewOffset.value.set(
			currentBreathData.viewOffset.x,
			currentBreathData.viewOffset.y,
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
