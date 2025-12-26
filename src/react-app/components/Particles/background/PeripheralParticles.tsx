import { Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { memo, useEffect, useRef, useState } from 'react';
import type * as THREE from 'three';
import { LAYER_DEPTHS } from '../../../lib/layers';
import { peripheralParticlesObj } from '../../../lib/theatre';
import type { PeripheralParticlesProps } from '../../../lib/theatre/types';
import { useTheatreBreath } from '../TheatreBreathProvider';

/**
 * Peripheral Vision Particles using drei's Sparkles
 *
 * These particles exist in the outer edges of vision - creating a subtle
 * sense of being "cocooned" in the breathing experience. Uses drei's
 * Sparkles with breath-synchronized transformations for a meditative feel.
 * Driven by Theatre.js for cinematic control.
 */
export const PeripheralParticles = memo(() => {
	const groupRef = useRef<THREE.Group>(null);
	const theatreBreath = useTheatreBreath();
	const [theatreProps, setTheatreProps] = useState<PeripheralParticlesProps>(
		peripheralParticlesObj.value,
	);

	// Subscribe to Theatre.js object changes
	useEffect(() => {
		const unsubscribe = peripheralParticlesObj.onValuesChange((values) => {
			setTheatreProps(values);
		});
		return unsubscribe;
	}, []);

	useFrame((_, delta) => {
		if (!groupRef.current) return;

		// Read from Theatre.js breath values
		const { breathPhase, diaphragmDirection } = theatreBreath.current;

		// Gentle counter-rotation to stars (creates depth parallax)
		groupRef.current.rotation.y += theatreProps.rotationSpeed * delta;

		// Subtle breathing scale - expand/contract with breath
		const targetScale = theatreProps.scale + breathPhase * 0.1;
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
				count={theatreProps.count}
				scale={[80, 80, LAYER_DEPTHS.PERIPHERAL_PARTICLES_Z]}
				size={theatreProps.size}
				speed={0.15}
				opacity={theatreProps.opacity}
				color={theatreProps.color}
				noise={0.5}
			/>
		</group>
	);
});
