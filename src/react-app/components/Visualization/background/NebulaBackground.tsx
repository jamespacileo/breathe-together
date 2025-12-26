import { Cloud, Clouds } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { memo, useEffect, useRef, useState } from 'react';
import type * as THREE from 'three';
import { nebulaObj } from '../../../lib/theatre';
import type { NebulaProps as TheatreNebulaProps } from '../../../lib/theatre/types';
import { useTheatreBreath } from '../TheatreBreathProvider';

/**
 * Nebula Background
 *
 * Volumetric cloud layers creating a dreamy cosmic atmosphere.
 * Multiple cloud layers at different depths create parallax effect.
 * Breath-synchronized opacity and drift for immersive meditation.
 * Driven by Theatre.js for cinematic control.
 */
export const NebulaBackground = memo(() => {
	const groupRef = useRef<THREE.Group>(null);
	const theatreBreath = useTheatreBreath();
	const theatrePropsRef = useRef<TheatreNebulaProps>(nebulaObj.value);

	// Subscribe to Theatre.js object changes (Ref-only, no re-renders)
	useEffect(() => {
		const unsubscribe = nebulaObj.onValuesChange((values) => {
			theatrePropsRef.current = values;
		});
		return unsubscribe;
	}, []);

	// Opacity state for material (reactive)
	const [opacity, setOpacity] = useState(theatrePropsRef.current.opacity);
	useEffect(() => {
		return nebulaObj.onValuesChange((v) => setOpacity(v.opacity));
	}, []);

	useFrame((_, delta) => {
		if (!groupRef.current) return;

		// Read from Theatre.js breath values
		const { breathPhase, diaphragmDirection } = theatreBreath.current;
		const theatreProps = theatrePropsRef.current;

		// Gentle rotation for cosmic drift effect
		groupRef.current.rotation.y += theatreProps.rotationSpeed * delta;

		// Subtle vertical movement following breath
		const targetY = diaphragmDirection * theatreProps.verticalDrift * 25;
		groupRef.current.position.y +=
			(targetY - groupRef.current.position.y) * 0.015;

		// Breath-synchronized scale pulse (very subtle)
		const targetScale = theatreProps.scale * (1 + breathPhase * 0.03);
		const currentScale = groupRef.current.scale.x;
		const newScale = currentScale + (targetScale - currentScale) * 0.02;
		groupRef.current.scale.setScalar(newScale);
	});

	return (
		<group ref={groupRef} position={[0, 0, -35]}>
			<Clouds>
				{/* Deep background layer - slowest, largest */}
				<Cloud
					seed={1}
					segments={30}
					bounds={[100, 60, 40]}
					volume={30}
					color="#1a2a45"
					opacity={0.5 * opacity}
					speed={0.02}
					fade={80}
					position={[0, 0, -15]}
				/>
				{/* Mid layer - medium movement */}
				<Cloud
					seed={42}
					segments={25}
					bounds={[80, 50, 30]}
					volume={22}
					color="#253550"
					opacity={0.4 * opacity}
					speed={0.04}
					fade={60}
					position={[15, 8, -5]}
				/>
				{/* Front accent layer - subtle highlight */}
				<Cloud
					seed={123}
					segments={20}
					bounds={[60, 40, 25]}
					volume={16}
					color="#2a4060"
					opacity={0.35 * opacity}
					speed={0.05}
					fade={50}
					position={[-20, -8, 5]}
				/>
			</Clouds>
		</group>
	);
});
