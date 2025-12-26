import { Instance, Instances } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { memo, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
	type GlobalUniformsData,
	useGlobalUniforms,
} from '../../../hooks/useGlobalUniforms';

interface UserParticlesInstancedProps {
	colorCounts: Record<string, number>;
	sphereRadius: number;
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
const SETTLED_RADIUS_MULT = 1.5; // Inhale: 1.5x sphere radius
const SPREAD_RADIUS_MULT = 4.0; // Exhale: 4.0x sphere radius
const BASE_ORBIT_SPEED = 0.18;
const ORBIT_SPEED_BY_PHASE = [1.2, 0.8, 1.3, 0.7]; // inhale, hold-in, exhale, hold-out
const CRYSTAL_ORBIT_REDUCTION = 0.4; // Up to 40% slower during crystallization
const POSITION_SMOOTHING = 0.08;
const BOB_AMOUNT = 0.3;
const BOB_SPEED = 0.5;
const BASE_SIZE = 0.03;

const MAX_PARTICLES = 1024;

// Pre-allocate reusable vector for lerp target
const tempVec3 = new THREE.Vector3();

/**
 * Generate particle data with colors from mood configuration
 */
function generateParticles(colorCounts: Record<string, number>): ParticleData[] {
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
	globalUniforms: React.MutableRefObject<GlobalUniformsData>;
}

/**
 * Individual user particle with orbital animation
 */
const UserParticle = memo(
	({ data, sphereRadius, globalUniforms }: UserParticleProps) => {
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

		useFrame((state, delta) => {
			if (!ref.current) return;

			const { breathPhase, phaseType, crystallization, diaphragmDirection, time } =
				globalUniforms.current;

			// === 1. BREATH-RESPONSIVE RADIUS ===
			// Match BreathingSphere's exact scale calculation
			const minScale = sphereRadius * 0.5;
			const maxScale = sphereRadius;
			const currentSphereScale = minScale + (maxScale - minScale) * (1 - breathPhase);

			const settledRadius = currentSphereScale * SETTLED_RADIUS_MULT;
			const spreadRadius = currentSphereScale * SPREAD_RADIUS_MULT;
			let targetRadius = lerp(spreadRadius, settledRadius, breathPhase);

			// Radius variation during exhale (±15%)
			const radiusVariation = 0.85 + data.phase / (Math.PI * 2) * 0.3;
			const variationAmount = 1 - breathPhase;
			targetRadius *= lerp(1.0, radiusVariation, variationAmount);

			// === 2. ORBITAL MOTION ===
			const phaseIndex = Math.floor(phaseType) as 0 | 1 | 2 | 3;
			let orbitSpeedMult = ORBIT_SPEED_BY_PHASE[phaseIndex] ?? 1;
			orbitSpeedMult *= 1 - crystallization * CRYSTAL_ORBIT_REDUCTION;

			const orbitSpeed = BASE_ORBIT_SPEED * orbitSpeedMult * data.orbitSpeed;
			angleRef.current = (angleRef.current + orbitSpeed * delta) % (Math.PI * 2);

			// === 3. VERTICAL BOBBING ===
			const bobAmount = BOB_AMOUNT * (1 - crystallization * 0.6);
			const verticalBob = Math.sin(time * BOB_SPEED + data.phase) * bobAmount;

			// === 4. DIAPHRAGM INFLUENCE ===
			const diaphragmInfluence = diaphragmDirection * 0.3 * (1 - crystallization);

			// === 5. SPHERICAL TO CARTESIAN ===
			const radius = targetRadius * (1 + data.radiusOffset);
			const x = Math.sin(data.phi) * Math.cos(angleRef.current) * radius;
			const y = Math.cos(data.phi) * radius + verticalBob + diaphragmInfluence;
			const z = Math.sin(data.phi) * Math.sin(angleRef.current) * radius;

			// === 6. SMOOTH INTERPOLATION ===
			// Frame-rate independent smoothing
			const smoothing = 1 - Math.pow(1 - POSITION_SMOOTHING, delta * 60);
			tempVec3.set(x, y, z);
			posRef.current.lerp(tempVec3, smoothing);

			ref.current.position.copy(posRef.current);

			// === 7. SIZE ===
			const baseSize = BASE_SIZE + (1 - breathPhase) * 0.015;
			ref.current.scale.setScalar(baseSize * data.size);
		});

		return <Instance ref={ref} color={data.color} />;
	},
);

/**
 * UserParticlesInstanced - InstancedMesh replacement for GPGPU particles
 *
 * Each particle represents one user, colored by their mood.
 * Particles orbit around the central sphere in a Dyson swarm pattern,
 * responding to breathing phases.
 */
export const UserParticlesInstanced = memo(
	({ colorCounts, sphereRadius }: UserParticlesInstancedProps) => {
		const globalUniforms = useGlobalUniforms();

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

		return (
			<Instances
				limit={MAX_PARTICLES}
				range={totalUsers}
				frustumCulled={false}
			>
				<sphereGeometry args={[1, 6, 6]} />
				<meshBasicMaterial
					transparent
					depthWrite={false}
					blending={THREE.AdditiveBlending}
				/>
				{particles.slice(0, totalUsers).map((p, i) => (
					<UserParticle
						key={i}
						data={p}
						sphereRadius={sphereRadius}
						globalUniforms={globalUniforms}
					/>
				))}
			</Instances>
		);
	},
);
