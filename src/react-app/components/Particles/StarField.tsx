import { Stars } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { memo, useRef } from 'react';
import type * as THREE from 'three';
import { getEnhancedBreathData } from '../../hooks/useEnhancedBreathData';
import { LAYER_DEPTHS } from '../../lib/layers';
import { useViewOffset } from '../../hooks/useViewOffset';
import { getBreathState } from '../../lib/breathUtils';

/**
 * Background star field using drei's Stars component
 * Subtly responds to breath phases for a connected, meditative feel
 */
export const StarField = memo(() => {
	const groupRef = useRef<THREE.Group>(null);
	const viewOffsetRef = useViewOffset();

	useFrame((_, delta) => {
		if (!groupRef.current) return;

		const breathState = getBreathState();
		const breathData = getEnhancedBreathData(breathState, viewOffsetRef.current);

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
				radius={LAYER_DEPTHS.STAR_FIELD_RADIUS}
				depth={LAYER_DEPTHS.STAR_FIELD_DEPTH}
				count={300}
				factor={4}
				saturation={0.3}
				fade
				speed={0.3}
			/>
		</group>
	);
});
