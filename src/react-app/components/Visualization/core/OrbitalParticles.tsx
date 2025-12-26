import { useFrame } from '@react-three/fiber';
import { memo, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
	type OrbitalParticlesProps as TheatreOrbitalProps,
	orbitalParticlesObj,
	useTheatreObject,
} from '../../../lib/theatre';
import { useTheatreBreath } from '../TheatreBreathProvider';

interface OrbitalParticlesProps {
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

// Pre-allocate reusable objects for performance
const tempMatrix = new THREE.Matrix4();
const tempVec3 = new THREE.Vector3();

/**
 * Orbital Particles - Particle shell surrounding the crystal core
 *
 * Creates an energy field of orbiting particles that respond to breathing:
 * - Contract on inhale, expand on exhale
 * - Slow orbit during holds, faster during active breathing
 * - Size and opacity pulse with breath
 * - Driven by Theatre.js for cinematic control
 * 
 * Optimized to use a single useFrame for all particles.
 */
export const OrbitalParticles = memo(
	({ baseRadius }: OrbitalParticlesProps) => {
		const meshRef = useRef<THREE.InstancedMesh>(null);
		const theatreBreath = useTheatreBreath();

		// Use unified subscription helper - structural keys trigger re-renders for material
		const { ref: theatrePropsRef, structural } =
			useTheatreObject<TheatreOrbitalProps>(orbitalParticlesObj, {
				structuralKeys: ['colorR', 'colorG', 'colorB', 'opacity'],
			});

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

		// Color from Theatre.js (structural keys trigger re-renders for material updates)
		const color = useMemo(
			() =>
				new THREE.Color(
					structural.colorR ?? 0.5,
					structural.colorG ?? 0.7,
					structural.colorB ?? 0.9,
				),
			[structural.colorR, structural.colorG, structural.colorB],
		);
		const opacity = structural.opacity ?? 0.6;

		useFrame((state) => {
			if (!meshRef.current) return;

			const { breathPhase, phaseType, crystallization } = theatreBreath.current;
			const theatreProps = theatrePropsRef.current;
			const time = state.clock.elapsedTime;

			// Calculate Radius
			const minRadius = baseRadius * theatreProps.minRadiusScale;
			const maxRadius = baseRadius * theatreProps.maxRadiusScale;
			const currentRadius = minRadius + (maxRadius - minRadius) * (1 - breathPhase);

			// Calculate Orbit Speed
			const isHoldPhase = phaseType === 1 || phaseType === 3;
			const orbitSpeedMultiplier = isHoldPhase
				? theatreProps.orbitSpeed * 0.3
				: theatreProps.orbitSpeed * (0.6 + (1 - crystallization) * 0.4);

			const baseOrbitTime = time * BASE_ORBIT_SPEED * orbitSpeedMultiplier;

			for (let i = 0; i < PARTICLE_COUNT; i++) {
				const data = particles[i];
				
				const orbitTime = baseOrbitTime * data.orbitSpeed;
				const theta = data.theta + orbitTime;
				const phi = data.phi + Math.sin(orbitTime * 0.5 + data.phase) * 0.1;

				const pulseOffset =
					Math.sin(time * 2 + data.phase) *
					0.02 *
					theatreProps.pulseAmount *
					(1 - crystallization);
				const radius = currentRadius * (1 + data.radiusOffset) + pulseOffset;

				tempVec3.set(
					radius * Math.sin(phi) * Math.cos(theta),
					radius * Math.cos(phi),
					radius * Math.sin(phi) * Math.sin(theta)
				);

				// Calculate Scale
				const baseSize = theatreProps.particleSize * (1 + (1 - breathPhase) * 0.5);
				const sizeVariation =
					1 +
					Math.sin(time * 3 + data.phase) *
						0.15 *
						theatreProps.pulseAmount *
						(1 - crystallization);
				const scale = baseSize * data.size * sizeVariation;
				
				tempMatrix.makeScale(scale, scale, scale);
				tempMatrix.setPosition(tempVec3);
				meshRef.current.setMatrixAt(i, tempMatrix);
			}

			meshRef.current.instanceMatrix.needsUpdate = true;
		});

		return (
			<instancedMesh
				ref={meshRef}
				args={[undefined, undefined, PARTICLE_COUNT]}
				frustumCulled={false}
			>
				<sphereGeometry args={[1, 6, 6]} />
				<meshBasicMaterial
					color={color}
					transparent
					opacity={opacity}
					depthWrite={false}
					blending={THREE.AdditiveBlending}
				/>
			</instancedMesh>
		);
	},
);

