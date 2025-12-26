import { Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { memo, useEffect, useRef, useState } from 'react';
import type * as THREE from 'three';
import { LAYER_DEPTHS } from '../../../lib/layers';
import { peripheralParticlesObj } from '../../../lib/theatre';
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

	// Ref for high-frequency animation values
	const theatrePropsRef = useRef(peripheralParticlesObj.value);

	// State for structural/material values that require re-render
	const [theatreProps, setTheatreProps] = useState({
		count: peripheralParticlesObj.value.count,
		size: peripheralParticlesObj.value.size,
		opacity: peripheralParticlesObj.value.opacity,
		color: peripheralParticlesObj.value.color,
	});

	// Subscribe to Theatre.js object changes
	useEffect(() => {
		const unsubscribe = peripheralParticlesObj.onValuesChange((values) => {
			theatrePropsRef.current = values;

			// Only update state for structural/material changes
			setTheatreProps((prev) => {
				if (
					prev.count !== values.count ||
					prev.size !== values.size ||
					prev.opacity !== values.opacity ||
					prev.color !== values.color
				) {
					return {
						count: values.count,
						size: values.size,
						opacity: values.opacity,
						color: values.color,
					};
				}
				return prev;
			});
		});
		return unsubscribe;
	}, []);

	useFrame((_, delta) => {
		if (!groupRef.current) return;

		const props = theatrePropsRef.current;
		// Read from Theatre.js breath values
		const { breathPhase, diaphragmDirection } = theatreBreath.current;

		// Gentle counter-rotation to stars (creates depth parallax)
		groupRef.current.rotation.y += props.rotationSpeed * delta;

		// Subtle breathing scale - expand/contract with breath
		const targetScale = props.scale + breathPhase * 0.1;
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
