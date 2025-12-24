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

		// Scale with breathing - larger when exhaled, smaller when inhaled
		const scale = 1.2 + (1.0 - breathValue) * 0.8;
		mesh.scale.setScalar(scale);

		// Subtle rotation
		mesh.rotation.y = time * 0.05;
		mesh.rotation.x = Math.sin(time * 0.03) * 0.05;
	});

	return (
		<mesh ref={meshRef}>
			<sphereGeometry args={[baseRadius, 48, 48]} />
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
				side={THREE.FrontSide}
				blending={THREE.AdditiveBlending}
				depthWrite={false}
			/>
		</mesh>
	);
}

/**
 * Inner glow - a smaller, brighter core
 * Brighter when exhaled, dimmer when inhaled
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

		// Scale with breathing - larger when exhaled
		const scale = 0.9 + (1.0 - breathValue) * 0.3;
		mesh.scale.setScalar(scale);

		// Update material opacity - brighter when exhaled
		const material = mesh.material as THREE.MeshBasicMaterial;
		material.opacity = 0.06 + (1.0 - breathValue) * 0.08;
	});

	return (
		<mesh ref={meshRef}>
			<sphereGeometry args={[baseRadius, 24, 24]} />
			<meshBasicMaterial
				color={new THREE.Color(0.55, 0.8, 0.95)}
				transparent
				opacity={0.1}
				blending={THREE.AdditiveBlending}
				depthWrite={false}
			/>
		</mesh>
	);
}
