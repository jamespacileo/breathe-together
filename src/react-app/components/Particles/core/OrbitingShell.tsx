import { Instance, Instances } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { orbitingShellObj } from '../../../lib/theatre';
import type { OrbitingShellProps as TheatreShellProps } from '../../../lib/theatre/types';
import { useTheatreBreath } from '../TheatreBreathProvider';

interface OrbitingShellProps {
	baseRadius: number;
}

interface ParticleData {
	theta: number; // longitude angle
	phi: number; // latitude angle
	orbitSpeed: number; // individual orbit speed multiplier
	size: number; // individual size multiplier
	phase: number; // animation phase offset
	radiusOffset: number; // variation in orbital radius
}

const PARTICLE_COUNT = 500;
const BASE_ORBIT_SPEED = 0.15;

/**
 * Orbiting Shell - Particle shell surrounding the crystal core
 *
 * Creates an energy field of orbiting particles that respond to breathing:
 * - Contract on inhale, expand on exhale
 * - Slow orbit during holds, faster during active breathing
 * - Size and opacity pulse with breath
 * - Driven by Theatre.js for cinematic control
 */
export const OrbitingShell = memo(({ baseRadius }: OrbitingShellProps) => {
	const instancesRef = useRef<THREE.InstancedMesh>(null);
	const theatreBreath = useTheatreBreath();
	const theatrePropsRef = useRef<TheatreShellProps>(orbitingShellObj.value);

	// Subscribe to Theatre.js object changes (Ref-only, no re-renders)
	useEffect(() => {
		const unsubscribe = orbitingShellObj.onValuesChange((values) => {
			theatrePropsRef.current = values;
		});
		return unsubscribe;
	}, []);

	// Generate particle data once
	const particles = useMemo<ParticleData[]>(() => {
		const data: ParticleData[] = [];
		for (let i = 0; i < PARTICLE_COUNT; i++) {
			// Distribute evenly on sphere using fibonacci spiral
			const goldenRatio = (1 + Math.sqrt(5)) / 2;
			const theta = (2 * Math.PI * i) / goldenRatio;
			const phi = Math.acos(1 - (2 * (i + 0.5)) / PARTICLE_COUNT);

			data.push({
				theta,
				phi,
				orbitSpeed: 0.7 + Math.random() * 0.6, // 0.7-1.3x speed
				size: 0.8 + Math.random() * 0.4, // 0.8-1.2x size
				phase: Math.random() * Math.PI * 2,
				radiusOffset: -0.1 + Math.random() * 0.2, // -0.1 to 0.1
			});
		}
		return data;
	}, []);

	// Color from Theatre.js (This will still re-render when color changes, which is fine for material updates)
	const [color, setColor] = useState(
		new THREE.Color(
			theatrePropsRef.current.colorR,
			theatrePropsRef.current.colorG,
			theatrePropsRef.current.colorB,
		),
	);
	const [opacity, setOpacity] = useState(theatrePropsRef.current.opacity);

	useEffect(() => {
		return orbitingShellObj.onValuesChange((values) => {
			setColor(new THREE.Color(values.colorR, values.colorG, values.colorB));
			setOpacity(values.opacity);
		});
	}, []);

	return (
		<Instances
			ref={instancesRef}
			limit={PARTICLE_COUNT}
			range={PARTICLE_COUNT}
			frustumCulled={false}
		>
			<sphereGeometry args={[1, 8, 8]} />
			<meshBasicMaterial
				color={color}
				transparent
				opacity={opacity}
				depthWrite={false}
				blending={THREE.AdditiveBlending}
			/>
			{particles.map((particle, i) => (
				<OrbitingParticle
					key={i}
					data={particle}
					baseRadius={baseRadius}
					theatreBreath={theatreBreath}
					theatrePropsRef={theatrePropsRef}
				/>
			))}
		</Instances>
	);
});

interface OrbitingParticleProps {
	data: ParticleData;
	baseRadius: number;
	theatreBreath: React.MutableRefObject<any>;
	theatrePropsRef: React.MutableRefObject<TheatreShellProps>;
}

const OrbitingParticle = memo(
	({
		data,
		baseRadius,
		theatreBreath,
		theatrePropsRef,
	}: OrbitingParticleProps) => {
		const instanceRef = useRef<THREE.InstancedMesh>(null);

		useFrame((state) => {
			if (!instanceRef.current) return;

			const { breathPhase, phaseType, crystallization } = theatreBreath.current;
			const theatreProps = theatrePropsRef.current;
			const time = state.clock.elapsedTime;

			// 1. Calculate Radius
			const minRadius = baseRadius * theatreProps.minRadiusScale;
			const maxRadius = baseRadius * theatreProps.maxRadiusScale;
			const currentRadius =
				minRadius + (maxRadius - minRadius) * (1 - breathPhase);

			// 2. Calculate Orbit Speed
			const isHoldPhase = phaseType === 1 || phaseType === 3;
			const orbitSpeedMultiplier = isHoldPhase
				? theatreProps.orbitSpeed * 0.3
				: theatreProps.orbitSpeed * (0.6 + (1 - crystallization) * 0.4);

			// 3. Calculate Position
			const orbitTime =
				time * BASE_ORBIT_SPEED * data.orbitSpeed * orbitSpeedMultiplier;
			const theta = data.theta + orbitTime;
			const phi = data.phi + Math.sin(orbitTime * 0.5 + data.phase) * 0.1;

			const pulseOffset =
				Math.sin(time * 2 + data.phase) *
				0.02 *
				theatreProps.pulseAmount *
				(1 - crystallization);
			const radius = currentRadius * (1 + data.radiusOffset) + pulseOffset;

			const x = radius * Math.sin(phi) * Math.cos(theta);
			const y = radius * Math.cos(phi);
			const z = radius * Math.sin(phi) * Math.sin(theta);

			instanceRef.current.position.set(x, y, z);

			// 4. Calculate Scale
			const baseSize =
				theatreProps.particleSize * (1 + (1 - breathPhase) * 0.5);
			const sizeVariation =
				1 +
				Math.sin(time * 3 + data.phase) *
					0.15 *
					theatreProps.pulseAmount *
					(1 - crystallization);
			const scale = baseSize * data.size * sizeVariation;
			instanceRef.current.scale.setScalar(scale);
		});

		return <Instance ref={instanceRef} />;
	},
);
