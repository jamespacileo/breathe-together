import { Stars } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';
import type { EnhancedBreathData } from './GPGPUScene';

interface StarFieldProps {
	breathData: EnhancedBreathData;
}

/**
 * Background star field using drei's Stars component
 * Subtly responds to breath phases for a connected, meditative feel
 */
export function StarField({ breathData }: StarFieldProps) {
	const groupRef = useRef<THREE.Group>(null);

	useFrame((_, delta) => {
		if (!groupRef.current) return;

		// Galaxy-like slow rotation around center
		// Base rotation speed with breath modulation for a meditative feel
		const baseRotation = 0.02; // Radians per second
		const breathModulation = 0.7 + breathData.breathPhase * 0.3; // 0.7 to 1.0
		groupRef.current.rotation.y += baseRotation * breathModulation * delta;

		// Subtle vertical drift following diaphragm direction
		const targetY = breathData.diaphragmDirection * 0.3;
		groupRef.current.position.y +=
			(targetY - groupRef.current.position.y) * 0.02;
	});

	return (
		<group ref={groupRef}>
			<Stars
				radius={100}
				depth={50}
				count={300}
				factor={4}
				saturation={0.3}
				fade
				speed={0.3}
			/>
		</group>
	);
}
