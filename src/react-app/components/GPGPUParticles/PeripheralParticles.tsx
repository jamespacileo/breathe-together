import { Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';
import { getEnhancedBreathData } from '../../hooks/useEnhancedBreathData';
import { LAYER_DEPTHS } from '../../lib/layers';
import { useViewOffset } from '../../hooks/useViewOffset';
import { getBreathState } from '../../stores/breathStore';

/**
 * Peripheral Vision Particles using drei's Sparkles
 *
 * These particles exist in the outer edges of vision - creating a subtle
 * sense of being "cocooned" in the breathing experience. Uses drei's
 * Sparkles with breath-synchronized transformations for a meditative feel.
 */
export function PeripheralParticles() {
	const groupRef = useRef<THREE.Group>(null);
	const viewOffsetRef = useViewOffset();

	useFrame((_, delta) => {
		if (!groupRef.current) return;

		const breathState = getBreathState();
		const breathData = getEnhancedBreathData(breathState, viewOffsetRef.current);

		// Gentle counter-rotation to stars (creates depth parallax)
		const baseRotation = -0.008;
		groupRef.current.rotation.y += baseRotation * delta;

		// Subtle breathing scale - expand/contract with breath
		const targetScale = 1 + breathData.breathPhase * 0.1; // 1.0 to 1.1
		const currentScale = groupRef.current.scale.x;
		const newScale = currentScale + (targetScale - currentScale) * 0.03;
		groupRef.current.scale.setScalar(newScale);

		// Vertical drift following diaphragm (opposite to stars for depth)
		const targetY = -breathData.diaphragmDirection * 0.15;
		groupRef.current.position.y +=
			(targetY - groupRef.current.position.y) * 0.02;
	});

	return (
		<group ref={groupRef}>
			<Sparkles
				count={60}
				scale={[80, 80, LAYER_DEPTHS.PERIPHERAL_PARTICLES_Z]}
				size={4}
				speed={0.15}
				opacity={0.12}
				color="#7ec8d4"
				noise={0.5}
			/>
		</group>
	);
}
