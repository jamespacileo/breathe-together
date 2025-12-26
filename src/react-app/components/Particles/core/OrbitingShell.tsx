import { Instance, Instances } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { memo, useMemo, useRef } from 'react';
import * as THREE from 'three';

interface OrbitingShellProps {
	baseRadius: number;
	breathPhase: number;
	phaseType: number;
	crystallization: number;
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

// Pre-allocate reusable vector
const tempVec3 = new THREE.Vector3();

/**
 * Orbiting Shell - Particle shell surrounding the crystal core
 *
 * Creates an energy field of orbiting particles that respond to breathing:
 * - Contract on inhale, expand on exhale
 * - Slow orbit during holds, faster during active breathing
 * - Size and opacity pulse with breath
 */
export const OrbitingShell = memo(
	({ baseRadius, breathPhase, phaseType, crystallization }: OrbitingShellProps) => {
		const instancesRef = useRef<THREE.InstancedMesh>(null);
		const timeRef = useRef(0);

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

		// Check if in hold phase
		const isHoldPhase = phaseType === 1 || phaseType === 3;

		// Calculate breath-responsive properties
		// Radius: contracts on inhale (high breathPhase), expands on exhale (low breathPhase)
		const minRadius = baseRadius * 1.2;
		const maxRadius = baseRadius * 1.8;
		const currentRadius = minRadius + (maxRadius - minRadius) * (1 - breathPhase);

		// Orbit speed: slower during holds for calm, crystallized effect
		const orbitSpeedMultiplier = isHoldPhase ? 0.2 : 0.6 + (1 - crystallization) * 0.4;

		// Particle size: larger for better visibility
		const baseSize = 0.025 + (1 - breathPhase) * 0.015;

		// Opacity: higher for better visibility
		const opacity = 0.6 + crystallization * 0.2;

		// Animation frame
		useFrame((_, delta) => {
			if (!instancesRef.current) return;
			timeRef.current += delta * orbitSpeedMultiplier;
		});

		return (
			<Instances
				ref={instancesRef}
				limit={PARTICLE_COUNT}
				range={PARTICLE_COUNT}
				frustumCulled={false}
			>
				<sphereGeometry args={[1, 8, 8]} />
				<meshBasicMaterial
					color="#b8e8f8"
					transparent
					opacity={opacity}
					depthWrite={false}
					blending={THREE.AdditiveBlending}
				/>
				{particles.map((particle, i) => (
					<OrbitingParticle
						key={i}
						data={particle}
						currentRadius={currentRadius}
						baseSize={baseSize}
						orbitSpeedMultiplier={orbitSpeedMultiplier}
						crystallization={crystallization}
					/>
				))}
			</Instances>
		);
	},
);

interface OrbitingParticleProps {
	data: ParticleData;
	currentRadius: number;
	baseSize: number;
	orbitSpeedMultiplier: number;
	crystallization: number;
}

const OrbitingParticle = memo(
	({
		data,
		currentRadius,
		baseSize,
		orbitSpeedMultiplier,
		crystallization,
	}: OrbitingParticleProps) => {
		const instanceRef = useRef<THREE.InstancedMesh>(null);

		useFrame((state) => {
			if (!instanceRef.current) return;

			const time = state.clock.elapsedTime;

			// Calculate orbital position with time-based rotation
			const orbitTime = time * BASE_ORBIT_SPEED * data.orbitSpeed * orbitSpeedMultiplier;
			const theta = data.theta + orbitTime;
			const phi = data.phi + Math.sin(orbitTime * 0.5 + data.phase) * 0.1;

			// Calculate radius with subtle pulsing
			const pulseOffset = Math.sin(time * 2 + data.phase) * 0.02 * (1 - crystallization);
			const radius = currentRadius * (1 + data.radiusOffset) + pulseOffset;

			// Convert spherical to cartesian coordinates
			const x = radius * Math.sin(phi) * Math.cos(theta);
			const y = radius * Math.cos(phi);
			const z = radius * Math.sin(phi) * Math.sin(theta);

			// Update position
			instanceRef.current.position.set(x, y, z);

			// Update scale with subtle size variation
			const sizeVariation = 1 + Math.sin(time * 3 + data.phase) * 0.15 * (1 - crystallization);
			const scale = baseSize * data.size * sizeVariation;
			instanceRef.current.scale.setScalar(scale);
		});

		return <Instance ref={instanceRef} />;
	},
);
