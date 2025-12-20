import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
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

	// Get color from mood
	const color = useMemo(
		() => new THREE.Color(moodColor || config.primaryColor),
		[moodColor, config.primaryColor],
	);

	// Create a plane geometry with segments for wave deformation
	const { geometry, material } = useMemo(() => {
		const geo = new THREE.PlaneGeometry(8, 8, 32, 32);
		const mat = new THREE.MeshBasicMaterial({
			color: color,
			wireframe: true,
			transparent: true,
			opacity: 0.7,
			blending: THREE.AdditiveBlending,
		});
		return { geometry: geo, material: mat };
	}, [color]);

	// Animation loop
	useFrame((state) => {
		if (!meshRef.current) return;

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
		const initialPositions = geometry.attributes.position;

		for (let i = 0; i < positions.count; i++) {
			const x = initialPositions.getX(i);
			const y = initialPositions.getY(i);

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
		<mesh
			ref={meshRef}
			geometry={geometry}
			material={material}
			rotation={[-0.6, 0, 0]}
		/>
	);
}
