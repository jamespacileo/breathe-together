import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
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
	const [isReady, setIsReady] = useState(false);

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
			const geo = meshRef.current.geometry;
			if (geo?.attributes?.position) {
				const positions = geo.attributes.position;
				originalPositionsRef.current = new Float32Array(positions.array);
				setIsReady(true);
			}
		}
	}, []);

	// Animation loop
	useFrame((state) => {
		if (!meshRef.current) return;

		const time = state.clock.elapsedTime;

		// Spring physics for breathing - INVERTED: inhale = small/focused, exhale = expanded
		const targetScale = calculateTargetScale(breathState, config);
		// Invert: when targetScale is high (inhale), we want contraction
		const invertedTarget = 2 - targetScale;

		const stiffness = config.mainSpringTension * 0.0001;
		const damping = config.mainSpringFriction * 0.05;
		const force = (invertedTarget - breathRef.current) * stiffness;
		velocityRef.current = velocityRef.current * (1 - damping) + force;
		breathRef.current += velocityRef.current;

		const breath = breathRef.current;

		// Gentle rotation
		meshRef.current.rotation.z = Math.sin(time * 0.15) * 0.03;

		// Only deform if we have original positions stored
		if (!isReady || !originalPositionsRef.current) return;

		const positions = meshRef.current.geometry.attributes.position;
		const original = originalPositionsRef.current;

		for (let i = 0; i < positions.count; i++) {
			const idx = i * 3;
			const ox = original[idx];
			const oy = original[idx + 1];

			// Distance from center
			const dist = Math.sqrt(ox * ox + oy * oy);
			const maxDist = 5;
			const normalizedDist = Math.min(dist / maxDist, 1);

			// Radial breathing effect
			const breathExpansion = 0.6 + breath * 0.4;
			const radialScale =
				breathExpansion + normalizedDist * (1 - breathExpansion) * 0.3;

			// New X,Y positions with radial scaling
			const newX = ox * radialScale;
			const newY = oy * radialScale;

			// Z deformation - waves that are stronger toward edges
			const edgeFactor = normalizedDist * normalizedDist;
			const wave1 = Math.sin(dist * 0.8 + time * 0.6) * 0.3;
			const wave2 = Math.sin(ox * 0.3 + oy * 0.3 + time * 0.4) * 0.2;
			const breathWave = Math.sin(dist * 2 - time * 0.8) * (1 - breath) * 0.4;

			// Center rises on inhale (focused), flattens on exhale (relaxed)
			const centerRise = (1 - normalizedDist) * (2 - breath) * 0.6;

			const z = (wave1 + wave2) * edgeFactor + breathWave + centerRise;

			positions.setXYZ(i, newX, newY, z);
		}

		positions.needsUpdate = true;
	});

	return (
		<group>
			{/* Main breathing mesh */}
			<mesh ref={meshRef} rotation={[-0.5, 0, 0]}>
				<circleGeometry args={[5, 48, 24]} />
				<meshBasicMaterial
					color={color}
					wireframe={true}
					transparent={true}
					opacity={0.7}
					side={THREE.DoubleSide}
				/>
			</mesh>

			{/* Debug: simple test ring that should always be visible */}
			<mesh rotation={[-0.5, 0, 0]} position={[0, 0, -0.1]}>
				<ringGeometry args={[4.8, 5, 64]} />
				<meshBasicMaterial
					color={color}
					transparent={true}
					opacity={0.3}
					side={THREE.DoubleSide}
				/>
			</mesh>
		</group>
	);
}
