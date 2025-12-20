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
	const breathRef = useRef(1);
	const velocityRef = useRef(0);
	const originalPositionsRef = useRef<Float32Array | null>(null);

	// Get color from mood - ensure valid color
	const color = useMemo(() => {
		try {
			return new THREE.Color(moodColor || config.primaryColor || '#4a90d9');
		} catch {
			return new THREE.Color('#4a90d9');
		}
	}, [moodColor, config.primaryColor]);

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

		// Spring physics for breathing - INVERTED: inhale = small/focused, exhale = expanded
		const targetScale = calculateTargetScale(breathState, config);
		// Invert: when targetScale is high (inhale), we want contraction
		// Map from [0.85, 1.15] to [1.3, 0.7] approximately
		const invertedTarget = 2 - targetScale;

		const stiffness = config.mainSpringTension * 0.0001;
		const damping = config.mainSpringFriction * 0.05;
		const force = (invertedTarget - breathRef.current) * stiffness;
		velocityRef.current = velocityRef.current * (1 - damping) + force;
		breathRef.current += velocityRef.current;

		const breath = breathRef.current;

		// Gentle rotation
		meshRef.current.rotation.z = Math.sin(time * 0.15) * 0.03;

		// Deform vertices based on breathing
		const positions = meshRef.current.geometry.attributes.position;
		const original = originalPositionsRef.current;

		for (let i = 0; i < positions.count; i++) {
			const idx = i * 3;
			const ox = original[idx];
			const oy = original[idx + 1];

			// Distance from center
			const dist = Math.sqrt(ox * ox + oy * oy);
			const maxDist = 5; // radius of our circle geometry
			const normalizedDist = dist / maxDist;

			// Radial breathing effect:
			// - Inhale (breath low): vertices move toward center, forming tighter circle
			// - Exhale (breath high): vertices expand outward, relaxed fabric
			const breathExpansion = 0.5 + breath * 0.5; // 0.5 to 1.5 range
			const radialScale =
				breathExpansion + normalizedDist * (1 - breathExpansion) * 0.3;

			// New X,Y positions with radial scaling
			const newX = ox * radialScale;
			const newY = oy * radialScale;

			// Z deformation - waves that are stronger toward edges
			const edgeFactor = normalizedDist * normalizedDist;
			const wave1 = Math.sin(dist * 0.8 + time * 0.6) * 0.4;
			const wave2 = Math.sin(ox * 0.3 + oy * 0.3 + time * 0.4) * 0.3;
			const breathWave = Math.sin(dist * 2 - time * 0.8) * (1 - breath) * 0.5;

			// Center rises on inhale (focused), flattens on exhale (relaxed)
			const centerRise = (1 - normalizedDist) * (2 - breath) * 0.8;

			const z = (wave1 + wave2) * edgeFactor + breathWave + centerRise;

			positions.setXYZ(i, newX, newY, z);
		}

		positions.needsUpdate = true;
	});

	return (
		<mesh ref={meshRef} rotation={[-0.5, 0, 0]}>
			<circleGeometry args={[5, 64, 64]} />
			<meshBasicMaterial
				color={color}
				wireframe={true}
				transparent={true}
				opacity={0.7}
				side={THREE.DoubleSide}
			/>
		</mesh>
	);
}
