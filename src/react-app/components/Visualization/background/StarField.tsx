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
	const theatrePropsRef = useRef<TheatreStarFieldProps>(starFieldObj.value);

	// Subscribe to Theatre.js object changes (Ref-only, no re-renders)
	useEffect(() => {
		const unsubscribe = starFieldObj.onValuesChange((values) => {
			theatrePropsRef.current = values;
		});
		return unsubscribe;
	}, []);

	// Reactive state for Stars component props that require re-render
	const [starsConfig, setStarsConfig] = useState({
		count: theatrePropsRef.current.count,
		factor: theatrePropsRef.current.factor,
	});

	useEffect(() => {
		return starFieldObj.onValuesChange((v) => {
			setStarsConfig({ count: v.count, factor: v.factor });
		});
	}, []);

	useFrame((_, delta) => {
		if (!groupRef.current) return;

		// Read from Theatre.js breath values
		const { breathPhase, diaphragmDirection } = theatreBreath.current;
		const theatreProps = theatrePropsRef.current;

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
				count={starsConfig.count}
				factor={starsConfig.factor}
				saturation={0.3}
				fade
				speed={0.3}
			/>
		</group>
	);
});
