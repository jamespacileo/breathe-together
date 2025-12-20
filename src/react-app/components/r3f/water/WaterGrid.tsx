import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { calculateTargetScale } from '../../../hooks/useBreathingSpring';
import type { BreathState } from '../../../hooks/useBreathSync';
import type { VisualizationConfig } from '../../../lib/config';

interface WaterGridProps {
	breathState: BreathState;
	config: VisualizationConfig;
	moodColor: string;
}

export function WaterGrid({ breathState, config, moodColor }: WaterGridProps) {
	const meshRef = useRef<THREE.Mesh>(null);
	const scaleRef = useRef(1);
	const velocityRef = useRef(0);
	const originalPositionsRef = useRef<Float32Array | null>(null);

	// Get color from mood
	const color = useMemo(
		() => new THREE.Color(moodColor || config.primaryColor),
		[moodColor, config.primaryColor],
	);

	// Store original positions once mesh is mounted
	useEffect(() => {
		if (meshRef.current) {
			const positions = meshRef.current.geometry.attributes.position;
			originalPositionsRef.current = new Float32Array(positions.array);
		}
	}, []);

	// Animation loop
	useFrame((state) => {
		if (!meshRef.current || !originalPositionsRef.current) return;

		const time = state.clock.elapsedTime;

		// Spring physics for breathing
		const targetScale = calculateTargetScale(breathState, config);
		const stiffness = config.mainSpringTension * 0.0001;
		const damping = config.mainSpringFriction * 0.05;
		const force = (targetScale - scaleRef.current) * stiffness;
		velocityRef.current = velocityRef.current * (1 - damping) + force;
		scaleRef.current += velocityRef.current;

		// Apply scale
		const scale = scaleRef.current;
		meshRef.current.scale.set(scale, scale, scale);

		// Gentle rotation
		meshRef.current.rotation.z = Math.sin(time * 0.2) * 0.05;

		// Wave deformation on the geometry
		const positions = meshRef.current.geometry.attributes.position;
		const original = originalPositionsRef.current;

		for (let i = 0; i < positions.count; i++) {
			const idx = i * 3;
			const x = original[idx];
			const y = original[idx + 1];

			// Create wave effect
			const wave1 = Math.sin(x * 0.5 + time * 0.8) * 0.3;
			const wave2 = Math.sin(y * 0.5 + time * 0.6) * 0.3;
			const wave3 = Math.sin((x + y) * 0.3 + time * 0.4) * 0.2;

			// Combine waves with breath intensity
			const z = (wave1 + wave2 + wave3) * scale * 0.5;
			positions.setZ(i, z);
		}

		positions.needsUpdate = true;
	});

	return (
		<mesh ref={meshRef} rotation={[-0.6, 0, 0]}>
			<planeGeometry args={[8, 8, 32, 32]} />
			<meshBasicMaterial
				color={color}
				wireframe
				transparent
				opacity={0.7}
				blending={THREE.AdditiveBlending}
			/>
		</mesh>
	);
}
