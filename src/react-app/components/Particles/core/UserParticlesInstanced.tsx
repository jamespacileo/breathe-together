import { Instance, Instances } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { PARTICLE_RADIUS_SCALE } from '../../../lib/layers';
import { sceneObj, userParticlesObj } from '../../../lib/theatre';
import type {
	SceneProps,
	UserParticlesProps,
} from '../../../lib/theatre/types';
import {
	type TheatreBreathData,
	useTheatreBreath,
} from '../TheatreBreathProvider';

interface UserParticlesInstancedProps {
	colorCounts: Record<string, number>;
}

interface ParticleData {
	// Spherical coordinates (fixed at creation)
	theta: number; // Initial longitude [0, 2π]
	phi: number; // Latitude from pole [0, π]

	// Per-particle randomization (fixed)
	orbitSpeed: number; // Speed multiplier [0.7-1.3]
	size: number; // Size multiplier [0.8-1.4]
	phase: number; // Animation offset [0, 2π]
	radiusOffset: number; // Radius variation [-0.15, 0.15]

	// Color from mood
	color: THREE.Color;
}

// Constants from userSim.frag.ts
const BASE_ORBIT_SPEED = 0.18;
const ORBIT_SPEED_BY_PHASE = [1.2, 0.8, 1.3, 0.7]; // inhale, hold-in, exhale, hold-out
const POSITION_SMOOTHING = 0.08;
const BOB_SPEED = 0.5;

const MAX_PARTICLES = 1024;

// Pre-allocate reusable vector for lerp target
const tempVec3 = new THREE.Vector3();

/**
 * Generate particle data with colors from mood configuration
 */
function generateParticles(
	colorCounts: Record<string, number>,
): ParticleData[] {
	const particles: ParticleData[] = [];

	// Create particles for each mood color
	for (const [hexColor, count] of Object.entries(colorCounts)) {
		const color = new THREE.Color(hexColor);
		for (let i = 0; i < count; i++) {
			// Spherical distribution
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);

			particles.push({
				theta,
				phi,
				orbitSpeed: 0.7 + Math.random() * 0.6, // [0.7, 1.3]
				size: 0.8 + Math.random() * 0.6, // [0.8, 1.4]
				phase: Math.random() * Math.PI * 2,
				radiusOffset: -0.15 + Math.random() * 0.3, // [-0.15, 0.15]
				color,
			});
		}
	}

	// Fill remaining slots with hidden particles (black = invisible with additive blending)
	const hiddenColor = new THREE.Color('#000000');
	while (particles.length < MAX_PARTICLES) {
		particles.push({
			theta: Math.random() * Math.PI * 2,
			phi: Math.acos(2 * Math.random() - 1),
			orbitSpeed: 1,
			size: 0, // Zero size makes them invisible
			phase: 0,
			radiusOffset: 0,
			color: hiddenColor,
		});
	}

	return particles;
}

/**
 * Linear interpolation
 */
function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

interface UserParticleProps {
	data: ParticleData;
	sphereRadius: number;
	theatreBreath: React.RefObject<TheatreBreathData>;
	theatreProps: UserParticlesProps;
}

/**
 * Individual user particle with orbital animation
 */
const UserParticle = memo(
	({ data, sphereRadius, theatreBreath, theatreProps }: UserParticleProps) => {
		const ref = useRef<THREE.InstancedMesh>(null);

		// Mutable angle state (persists across frames)
		const angleRef = useRef(data.theta);
		const posRef = useRef(new THREE.Vector3());

		// Initialize position
		useRef(() => {
			const initialRadius = sphereRadius * (2.5 + Math.random());
			posRef.current.set(
				Math.sin(data.phi) * Math.cos(data.theta) * initialRadius,
				Math.cos(data.phi) * initialRadius,
				Math.sin(data.phi) * Math.sin(data.theta) * initialRadius,
			);
		});

		useFrame((_, delta) => {
			if (!ref.current) return;

			const {
				breathPhase,
				phaseType,
				crystallization,
				diaphragmDirection,
				time,
			} = theatreBreath.current;

			// === 1. BREATH-RESPONSIVE RADIUS ===
			// Match BreathingSphere's exact scale calculation
			const minScale = sphereRadius * 0.5;
			const maxScale = sphereRadius;
			const currentSphereScale =
				minScale + (maxScale - minScale) * (1 - breathPhase);

			const settledRadius = currentSphereScale * theatreProps.settledRadiusMult;
			const spreadRadius = currentSphereScale * theatreProps.spreadRadiusMult;
			let targetRadius = lerp(spreadRadius, settledRadius, breathPhase);

			// Radius variation during exhale (±15%)
			const radiusVariation = 0.85 + (data.phase / (Math.PI * 2)) * 0.3;
			const variationAmount = 1 - breathPhase;
			targetRadius *= lerp(1.0, radiusVariation, variationAmount);

			// === 2. ORBITAL MOTION ===
			const phaseIndex = Math.floor(phaseType) as 0 | 1 | 2 | 3;
			let orbitSpeedMult = ORBIT_SPEED_BY_PHASE[phaseIndex] ?? 1;
			orbitSpeedMult *=
				1 - crystallization * theatreProps.crystalOrbitReduction;

			const orbitSpeed =
				BASE_ORBIT_SPEED *
				orbitSpeedMult *
				data.orbitSpeed *
				theatreProps.orbitSpeed;
			angleRef.current =
				(angleRef.current + orbitSpeed * delta) % (Math.PI * 2);

			// === 3. VERTICAL BOBBING ===
			const bobAmount = theatreProps.bobAmount * (1 - crystallization * 0.6);
			const verticalBob = Math.sin(time * BOB_SPEED + data.phase) * bobAmount;

			// === 4. DIAPHRAGM INFLUENCE ===
			const diaphragmInfluence =
				diaphragmDirection * 0.3 * (1 - crystallization);

			// === 5. SPHERICAL TO CARTESIAN ===
			const radius = targetRadius * (1 + data.radiusOffset);
			const x = Math.sin(data.phi) * Math.cos(angleRef.current) * radius;
			const y = Math.cos(data.phi) * radius + verticalBob + diaphragmInfluence;
			const z = Math.sin(data.phi) * Math.sin(angleRef.current) * radius;

			// === 6. SMOOTH INTERPOLATION ===
			// Frame-rate independent smoothing
			const smoothing = 1 - (1 - POSITION_SMOOTHING) ** (delta * 60);
			tempVec3.set(x, y, z);
			posRef.current.lerp(tempVec3, smoothing);

			ref.current.position.copy(posRef.current);

			// === 7. SIZE ===
			const baseSize = theatreProps.baseSize + (1 - breathPhase) * 0.015;
			ref.current.scale.setScalar(baseSize * data.size);
		});

		return <Instance ref={ref} color={data.color} />;
	},
);

/**
 * UserParticlesInstanced - Instanced particle rendering for user presence
 *
 * Each particle represents one user, colored by their mood.
 * Particles orbit around the central sphere in a Dyson swarm pattern,
 * responding to breathing phases.
 */
export const UserParticlesInstanced = memo(
	({ colorCounts }: UserParticlesInstancedProps) => {
		const theatreBreath = useTheatreBreath();
		const [theatreProps, setTheatreProps] = useState<UserParticlesProps>(
			userParticlesObj.value,
		);
		const [sceneProps, setSceneProps] = useState<SceneProps>(sceneObj.value);

		// Subscribe to Theatre.js object changes
		useEffect(() => {
			const unsubUser = userParticlesObj.onValuesChange((values) => {
				setTheatreProps(values);
			});
			const unsubScene = sceneObj.onValuesChange((values) => {
				setSceneProps(values);
			});
			return () => {
				unsubUser();
				unsubScene();
			};
		}, []);

		// Generate particle data with colors from mood configuration
		const particles = useMemo(
			() => generateParticles(colorCounts),
			[colorCounts],
		);

		// Count actual users (non-hidden particles)
		const totalUsers = useMemo(
			() => Object.values(colorCounts).reduce((a, b) => a + b, 0),
			[colorCounts],
		);

		// Calculate sphere radius for orbit alignment
		const contractedRadius =
			sceneProps.sphereBaseRadius * PARTICLE_RADIUS_SCALE;
		const sphereMaxScale = contractedRadius * 0.7;

		return (
			<Instances limit={MAX_PARTICLES} range={totalUsers} frustumCulled={false}>
				<sphereGeometry args={[1, 6, 6]} />
				<meshBasicMaterial
					transparent
					opacity={theatreProps.opacity}
					depthWrite={false}
					blending={THREE.AdditiveBlending}
				/>
				{particles.slice(0, totalUsers).map((p, i) => (
					<UserParticle
						key={i}
						data={p}
						sphereRadius={sphereMaxScale}
						theatreBreath={theatreBreath}
						theatreProps={theatreProps}
					/>
				))}
			</Instances>
		);
	},
);
