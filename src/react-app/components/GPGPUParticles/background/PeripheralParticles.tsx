import { Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { memo, useRef } from 'react';
import type * as THREE from 'three';
import { useGlobalUniforms } from '../../../hooks/useGlobalUniforms';
import { LAYER_DEPTHS } from '../../../lib/layers';

/**
 * Peripheral Vision Particles using drei's Sparkles
 *
 * These particles exist in the outer edges of vision - creating a subtle
 * sense of being "cocooned" in the breathing experience. Uses drei's
 * Sparkles with breath-synchronized transformations for a meditative feel.
 */
export const PeripheralParticles = memo(() => {
	const groupRef = useRef<THREE.Group>(null);
	const globalUniforms = useGlobalUniforms();

	useFrame((_, delta) => {
		if (!groupRef.current) return;

		// Read from global uniforms (computed once per frame at scene root)
		const { breathPhase, diaphragmDirection } = globalUniforms.current;

		// Gentle counter-rotation to stars (creates depth parallax)
		const baseRotation = -0.008;
		groupRef.current.rotation.y += baseRotation * delta;

		// Subtle breathing scale - expand/contract with breath
		const targetScale = 1 + breathPhase * 0.1; // 1.0 to 1.1
		const currentScale = groupRef.current.scale.x;
		const newScale = currentScale + (targetScale - currentScale) * 0.03;
		groupRef.current.scale.setScalar(newScale);

		// Vertical drift following diaphragm (opposite to stars for depth)
		const targetY = -diaphragmDirection * 0.15;
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
});
