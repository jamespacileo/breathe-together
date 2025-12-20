import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { calculateTargetScale } from '../../../hooks/useBreathingSpring';
import type { BreathState } from '../../../hooks/useBreathSync';
import type { VisualizationConfig } from '../../../lib/config';

interface WaterGridProps {
	breathState: BreathState;
	config: VisualizationConfig;
	moodColor: string;
}

export function WaterGrid({ breathState, config }: WaterGridProps) {
	const meshRef = useRef<THREE.Mesh>(null);
	const breathRef = useRef(1);
	const velocityRef = useRef(0);
	const originalPositionsRef = useRef<Float32Array | null>(null);
	const [isReady, setIsReady] = useState(false);

	// Store original positions once mesh is mounted
	useEffect(() => {
		// Small delay to ensure geometry is ready
		const timer = setTimeout(() => {
			if (meshRef.current?.geometry?.attributes?.position) {
				const positions = meshRef.current.geometry.attributes.position;
				originalPositionsRef.current = new Float32Array(positions.array);
				setIsReady(true);
			}
		}, 100);
		return () => clearTimeout(timer);
	}, []);

	// Animation loop
	useFrame((state) => {
		if (!meshRef.current) return;

		const time = state.clock.elapsedTime;

		// Spring physics for breathing - INVERTED
		const targetScale = calculateTargetScale(breathState, config);
		const invertedTarget = 2 - targetScale;

		const stiffness = config.mainSpringTension * 0.0001;
		const damping = config.mainSpringFriction * 0.05;
		const force = (invertedTarget - breathRef.current) * stiffness;
		velocityRef.current = velocityRef.current * (1 - damping) + force;
		breathRef.current += velocityRef.current;

		const breath = breathRef.current;

		// Gentle rotation
		meshRef.current.rotation.z = Math.sin(time * 0.15) * 0.03;

		// Only deform if ready
		if (!isReady || !originalPositionsRef.current) return;

		const positions = meshRef.current.geometry.attributes.position;
		const original = originalPositionsRef.current;

		for (let i = 0; i < positions.count; i++) {
			const idx = i * 3;
			const ox = original[idx];
			const oy = original[idx + 1];

			const dist = Math.sqrt(ox * ox + oy * oy);
			const maxDist = 5;
			const normalizedDist = Math.min(dist / maxDist, 1);

			// Radial breathing
			const breathExpansion = 0.6 + breath * 0.4;
			const radialScale =
				breathExpansion + normalizedDist * (1 - breathExpansion) * 0.3;

			const newX = ox * radialScale;
			const newY = oy * radialScale;

			// Z waves
			const edgeFactor = normalizedDist * normalizedDist;
			const wave1 = Math.sin(dist * 0.8 + time * 0.6) * 0.3;
			const wave2 = Math.sin(ox * 0.3 + oy * 0.3 + time * 0.4) * 0.2;
			const breathWave = Math.sin(dist * 2 - time * 0.8) * (1 - breath) * 0.4;
			const centerRise = (1 - normalizedDist) * (2 - breath) * 0.6;

			const z = (wave1 + wave2) * edgeFactor + breathWave + centerRise;

			positions.setXYZ(i, newX, newY, z);
		}

		positions.needsUpdate = true;
	});

	return (
		<group>
			{/* Super simple test: bright colored box - MUST be visible */}
			<mesh position={[0, 0, 0]}>
				<boxGeometry args={[1, 1, 1]} />
				<meshBasicMaterial color="#ff0000" />
			</mesh>

			{/* Main breathing mesh */}
			<mesh ref={meshRef} rotation={[-0.5, 0, 0]}>
				<circleGeometry args={[5, 48, 24]} />
				<meshBasicMaterial
					color="#4a90d9"
					wireframe
					transparent
					opacity={0.7}
					side={THREE.DoubleSide}
				/>
			</mesh>
		</group>
	);
}
