/**
 * CentralHalo - Ambient glow sphere at the center of the particle field
 * Creates a soft, breathing halo effect
 */
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import type { BreathState } from '../../../hooks/useBreathSync';
import { getBreathValue } from '../../../lib/breathUtils';
import {
	HALO_FRAGMENT_SHADER,
	HALO_VERTEX_SHADER,
} from './shaders/particleShaders.glsl';

interface CentralHaloProps {
	breathState: BreathState;
	baseRadius?: number;
	color?: THREE.Color;
	opacity?: number;
}

export function CentralHalo({
	breathState,
	baseRadius = 0.5,
	color = new THREE.Color(0.5, 0.75, 0.9),
	opacity = 0.15,
}: CentralHaloProps) {
	const meshRef = useRef<THREE.Mesh>(null);
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	const breathStateRef = useRef(breathState);
	breathStateRef.current = breathState;

	useFrame((state) => {
		const mesh = meshRef.current;
		const material = materialRef.current;
		if (!(mesh && material)) return;

		const time = state.clock.elapsedTime;
		const breathValue = getBreathValue(breathStateRef.current);

		// Update uniforms
		material.uniforms.uTime.value = time;
		material.uniforms.uBreathValue.value = breathValue;

		// Scale with breathing
		const scale = 1 + breathValue * 1.5;
		mesh.scale.setScalar(scale);

		// Subtle rotation
		mesh.rotation.y = time * 0.1;
		mesh.rotation.x = Math.sin(time * 0.05) * 0.1;
	});

	return (
		<mesh ref={meshRef}>
			<sphereGeometry args={[baseRadius, 32, 32]} />
			<shaderMaterial
				ref={materialRef}
				vertexShader={HALO_VERTEX_SHADER}
				fragmentShader={HALO_FRAGMENT_SHADER}
				uniforms={{
					uTime: { value: 0 },
					uBreathValue: { value: 0 },
					uColor: { value: new THREE.Vector3(color.r, color.g, color.b) },
					uOpacity: { value: opacity },
				}}
				transparent
				side={THREE.BackSide}
				blending={THREE.AdditiveBlending}
				depthWrite={false}
			/>
		</mesh>
	);
}

/**
 * Inner glow - a smaller, brighter core
 */
export function InnerGlow({
	breathState,
	baseRadius = 0.3,
}: {
	breathState: BreathState;
	baseRadius?: number;
}) {
	const meshRef = useRef<THREE.Mesh>(null);
	const breathStateRef = useRef(breathState);
	breathStateRef.current = breathState;

	useFrame(() => {
		const mesh = meshRef.current;
		if (!mesh) return;

		const breathValue = getBreathValue(breathStateRef.current);

		// Scale with breathing - smaller range
		const scale = 0.8 + breathValue * 0.4;
		mesh.scale.setScalar(scale);

		// Update material opacity
		const material = mesh.material as THREE.MeshBasicMaterial;
		material.opacity = 0.05 + breathValue * 0.1;
	});

	return (
		<mesh ref={meshRef}>
			<sphereGeometry args={[baseRadius, 24, 24]} />
			<meshBasicMaterial
				color={new THREE.Color(0.6, 0.85, 1.0)}
				transparent
				opacity={0.08}
				blending={THREE.AdditiveBlending}
				depthWrite={false}
			/>
		</mesh>
	);
}
