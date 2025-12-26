import { Cloud, Clouds } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { memo, useRef } from 'react';
import type * as THREE from 'three';
import { useGlobalUniforms } from '../../../hooks/useGlobalUniforms';

/**
 * Nebula Background
 *
 * Volumetric cloud layers creating a dreamy cosmic atmosphere.
 * Multiple cloud layers at different depths create parallax effect.
 * Breath-synchronized opacity and drift for immersive meditation.
 */
export const NebulaBackground = memo(() => {
	const groupRef = useRef<THREE.Group>(null);
	const globalUniforms = useGlobalUniforms();

	// Track opacity values for smooth animation
	const opacityRef = useRef({ layer1: 0.3, layer2: 0.25, layer3: 0.2 });

	useFrame((_, delta) => {
		if (!groupRef.current) return;

		// Read from global uniforms (computed once per frame at scene root)
		const { breathPhase, diaphragmDirection } = globalUniforms.current;

		// Gentle rotation for cosmic drift effect
		const baseRotation = 0.003;
		groupRef.current.rotation.y += baseRotation * delta;

		// Subtle vertical movement following breath
		const targetY = diaphragmDirection * 0.5;
		groupRef.current.position.y +=
			(targetY - groupRef.current.position.y) * 0.015;

		// Breath-synchronized scale pulse (very subtle)
		const targetScale = 1 + breathPhase * 0.03;
		const currentScale = groupRef.current.scale.x;
		const newScale = currentScale + (targetScale - currentScale) * 0.02;
		groupRef.current.scale.setScalar(newScale);

		// Update opacity based on breath phase
		const breathInfluence = breathPhase * 0.08;
		opacityRef.current.layer1 = 0.3 + breathInfluence;
		opacityRef.current.layer2 = 0.25 + breathInfluence * 0.7;
		opacityRef.current.layer3 = 0.2 + breathInfluence * 0.5;
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
					opacity={0.5}
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
					opacity={0.4}
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
					opacity={0.35}
					speed={0.05}
					fade={50}
					position={[-20, -8, 5]}
				/>
			</Clouds>
		</group>
	);
});
