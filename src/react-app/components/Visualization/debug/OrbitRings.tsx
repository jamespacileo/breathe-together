import { useFrame } from '@react-three/fiber';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type * as THREE from 'three';
import { PARTICLE_RADIUS_SCALE } from '../../../lib/layers';
import { sceneObj, userPresenceObj } from '../../../lib/theatre';
import type { SceneProps, UserPresenceProps } from '../../../lib/theatre/types';
import { useTheatreBreath } from '../TheatreBreathProvider';

interface OrbitRingsProps {
	ringOpacity: number;
	settledRingColor: string;
	spreadRingColor: string;
}

/**
 * WireframeSphere - Wireframe sphere for visualizing radius boundaries
 */
const WireframeSphere = memo(
	({
		radius,
		color,
		opacity,
	}: {
		radius: number;
		color: string;
		opacity: number;
	}) => {
		return (
			<mesh>
				<sphereGeometry args={[radius, 32, 16]} />
				<meshBasicMaterial
					color={color}
					wireframe
					transparent
					opacity={opacity}
					depthTest={false}
				/>
			</mesh>
		);
	},
);

/**
 * AnimatedOrbitRing - Ring that animates with breath phase
 */
const AnimatedOrbitRing = memo(
	({
		settledRadius,
		spreadRadius,
		color,
		opacity,
	}: {
		settledRadius: number;
		spreadRadius: number;
		color: string;
		opacity: number;
	}) => {
		const meshRef = useRef<THREE.Mesh>(null);
		const theatreBreath = useTheatreBreath();

		useFrame(() => {
			if (!meshRef.current) return;
			const { breathPhase } = theatreBreath.current;

			// Lerp between spread and settled based on breath phase
			// breathPhase: 0 = exhaled (spread), 1 = inhaled (settled)
			const currentRadius =
				spreadRadius + (settledRadius - spreadRadius) * breathPhase;
			meshRef.current.scale.setScalar(currentRadius);
		});

		return (
			<mesh ref={meshRef}>
				<sphereGeometry args={[1, 32, 16]} />
				<meshBasicMaterial
					color={color}
					wireframe
					transparent
					opacity={opacity * 0.7}
					depthTest={false}
				/>
			</mesh>
		);
	},
);

/**
 * OrbitRings - Visualizes particle orbit boundaries
 *
 * Shows:
 * - Settled radius (green) - where particles gather on inhale
 * - Spread radius (orange) - where particles scatter on exhale
 * - Current position (animated between the two)
 */
export const OrbitRings = memo(
	({ ringOpacity, settledRingColor, spreadRingColor }: OrbitRingsProps) => {
		const [sceneProps, setSceneProps] = useState<SceneProps>(sceneObj.value);
		const [userProps, setUserProps] = useState<UserPresenceProps>(
			userPresenceObj.value,
		);

		// Subscribe to Theatre.js changes
		useEffect(() => {
			const unsubScene = sceneObj.onValuesChange(setSceneProps);
			const unsubUser = userPresenceObj.onValuesChange(setUserProps);
			return () => {
				unsubScene();
				unsubUser();
			};
		}, []);

		// Calculate radii based on current Theatre.js values
		const { settledRadius, spreadRadius, sphereRadius } = useMemo(() => {
			const contractedRadius =
				sceneProps.sphereBaseRadius * PARTICLE_RADIUS_SCALE;
			const sphereMaxScale = contractedRadius * 0.7;
			const minScale = sphereMaxScale * 0.5;

			// These match the calculations in UserPresence.tsx
			const settled = minScale * userProps.settledRadiusMult;
			const spread = minScale * userProps.spreadRadiusMult;

			return {
				settledRadius: settled,
				spreadRadius: spread,
				sphereRadius: contractedRadius,
			};
		}, [
			sceneProps.sphereBaseRadius,
			userProps.settledRadiusMult,
			userProps.spreadRadiusMult,
		]);

		return (
			<group name="orbit-rings">
				{/* Settled radius - where particles gather on inhale */}
				<WireframeSphere
					radius={settledRadius}
					color={settledRingColor}
					opacity={ringOpacity}
				/>

				{/* Spread radius - where particles scatter on exhale */}
				<WireframeSphere
					radius={spreadRadius}
					color={spreadRingColor}
					opacity={ringOpacity}
				/>

				{/* Crystal core boundary */}
				<WireframeSphere
					radius={sphereRadius * 0.35}
					color="#22d3ee"
					opacity={ringOpacity * 0.5}
				/>

				{/* Outer halo boundary */}
				<WireframeSphere
					radius={sphereRadius * 2.2}
					color="#a855f7"
					opacity={ringOpacity * 0.3}
				/>

				{/* Animated current position ring */}
				<AnimatedOrbitRing
					settledRadius={settledRadius}
					spreadRadius={spreadRadius}
					color="#ffffff"
					opacity={ringOpacity}
				/>
			</group>
		);
	},
);
