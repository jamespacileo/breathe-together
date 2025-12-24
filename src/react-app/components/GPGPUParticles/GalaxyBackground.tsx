import { Cloud, GradientTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import type { EnhancedBreathData } from './GPGPUScene';

interface GalaxyBackgroundProps {
	breathData: EnhancedBreathData;
}

/**
 * Ethereal Galaxy Background
 *
 * Creates a soft, dreamy cosmic atmosphere using:
 * - Radial gradient sphere for deep space feel
 * - Soft nebula clouds that drift with breathing
 * - Subtle color shifts based on breath phase
 */
export function GalaxyBackground({ breathData }: GalaxyBackgroundProps) {
	const nebulaGroupRef = useRef<THREE.Group>(null);
	const backdropRef = useRef<THREE.Mesh>(null);

	useFrame((_, delta) => {
		if (!nebulaGroupRef.current) return;

		// Very slow nebula rotation - opposite to stars for depth
		nebulaGroupRef.current.rotation.y -= 0.003 * delta;
		nebulaGroupRef.current.rotation.x += 0.001 * delta;

		// Subtle breathing scale for the nebula clouds
		const targetScale = 1 + breathData.breathPhase * 0.05;
		const currentScale = nebulaGroupRef.current.scale.x;
		const newScale = currentScale + (targetScale - currentScale) * 0.02;
		nebulaGroupRef.current.scale.setScalar(newScale);

		// Subtle vertical drift with diaphragm
		const targetY = breathData.diaphragmDirection * 2;
		nebulaGroupRef.current.position.y +=
			(targetY - nebulaGroupRef.current.position.y) * 0.01;
	});

	return (
		<group>
			{/* Deep space gradient backdrop - soft blue tones */}
			<mesh ref={backdropRef} position={[0, 0, -80]} scale={[200, 200, 1]}>
				<planeGeometry args={[1, 1]} />
				<meshBasicMaterial transparent opacity={0.6} side={THREE.DoubleSide}>
					<GradientTexture
						stops={[0, 0.35, 0.7, 1]}
						colors={['#0a0f15', '#0f1520', '#121a28', '#0a0f15']}
					/>
				</meshBasicMaterial>
			</mesh>

			{/* Soft nebula cloud layer - very subtle */}
			<group ref={nebulaGroupRef}>
				{/* Central nebula - extremely soft */}
				<Cloud
					position={[0, 0, -40]}
					opacity={0.06}
					speed={0.08}
					bounds={[80, 20, 20]}
					segments={20}
					color="#4a6080"
				/>

				{/* Upper nebula accent */}
				<Cloud
					position={[20, 25, -50]}
					opacity={0.04}
					speed={0.06}
					bounds={[50, 15, 15]}
					segments={15}
					color="#5a7090"
				/>

				{/* Lower nebula accent */}
				<Cloud
					position={[-25, -20, -45]}
					opacity={0.05}
					speed={0.07}
					bounds={[60, 18, 18]}
					segments={18}
					color="#486080"
				/>

				{/* Side accent clouds for depth */}
				<Cloud
					position={[40, 5, -55]}
					opacity={0.03}
					speed={0.05}
					bounds={[40, 12, 12]}
					segments={12}
					color="#507090"
				/>

				<Cloud
					position={[-40, -5, -52]}
					opacity={0.035}
					speed={0.055}
					bounds={[45, 14, 14]}
					segments={14}
					color="#486888"
				/>
			</group>
		</group>
	);
}
