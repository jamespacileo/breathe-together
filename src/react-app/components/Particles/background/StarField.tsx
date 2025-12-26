import { Stars } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { memo, useEffect, useRef, useState } from 'react';
import type * as THREE from 'three';
import { LAYER_DEPTHS } from '../../../lib/layers';
import { starFieldObj } from '../../../lib/theatre';
import type { StarFieldProps as TheatreStarFieldProps } from '../../../lib/theatre/types';
import { useTheatreBreath } from '../TheatreBreathProvider';

/**
 * Background star field using drei's Stars component
 * Subtly responds to breath phases for a connected, meditative feel
 * Driven by Theatre.js for cinematic control.
 */
export const StarField = memo(() => {
	const groupRef = useRef<THREE.Group>(null);
	const theatreBreath = useTheatreBreath();
	const [theatreProps, setTheatreProps] = useState<TheatreStarFieldProps>(
		starFieldObj.value,
	);

	// Subscribe to Theatre.js object changes
	useEffect(() => {
		const unsubscribe = starFieldObj.onValuesChange((values) => {
			setTheatreProps(values);
		});
		return unsubscribe;
	}, []);

	useFrame((_, delta) => {
		if (!groupRef.current) return;

		// Read from Theatre.js breath values
		const { breathPhase, diaphragmDirection } = theatreBreath.current;

		// Galaxy-like slow rotation around center
		// Base rotation speed with breath modulation for a meditative feel
		const baseRotation = theatreProps.rotationSpeed;
		const breathModulation = 0.7 + breathPhase * 0.3; // 0.7 to 1.0
		groupRef.current.rotation.y += baseRotation * breathModulation * delta;

		// Subtle vertical drift following diaphragm direction
		const targetY = diaphragmDirection * 0.3;
		groupRef.current.position.y +=
			(targetY - groupRef.current.position.y) * 0.02;
	});

	return (
		<group ref={groupRef}>
			<Stars
				radius={LAYER_DEPTHS.STAR_FIELD_RADIUS}
				depth={LAYER_DEPTHS.STAR_FIELD_DEPTH}
				count={theatreProps.count}
				factor={4}
				saturation={0.3}
				fade
				speed={0.3}
			/>
		</group>
	);
});
