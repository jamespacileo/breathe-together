import { useFrame } from '@react-three/fiber';
import { memo, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { PARTICLE_RADIUS_SCALE } from '../../../lib/layers';
import {
	sceneObj,
	userPresenceObj,
	useTheatreObject,
	useTheatreRef,
} from '../../../lib/theatre';
import type {
	SceneProps,
	UserPresenceProps as TheatrePresenceProps,
} from '../../../lib/theatre/types';
import { useTheatreBreath } from '../TheatreBreathProvider';

interface UserPresenceProps {
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

// Pre-allocate reusable objects for performance
const tempVec3 = new THREE.Vector3();
const tempMatrix = new THREE.Matrix4();
const tempColor = new THREE.Color();

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

/**
 * UserPresence - Instanced particle rendering for user presence
 *
 * Each particle represents one user, colored by their mood.
 * Particles orbit around the central sphere in a Dyson swarm pattern,
 * responding to breathing phases.
 * 
 * Optimized to use a single useFrame for all particles.
 */
export const UserPresence = memo(({ colorCounts }: UserPresenceProps) => {
	const meshRef = useRef<THREE.InstancedMesh>(null);
	const theatreBreath = useTheatreBreath();

	// Use unified subscription helpers
	const { ref: theatrePropsRef, structural } =
		useTheatreObject<TheatrePresenceProps>(userPresenceObj, {
			structuralKeys: ['opacity'],
		});
	const scenePropsRef = useTheatreRef<SceneProps>(sceneObj);

	// Mutable state for particle animation
	const anglesRef = useRef<Float32Array>(new Float32Array(MAX_PARTICLES));
	const positionsRef = useRef<THREE.Vector3[]>([]);

	// Opacity from structural props (triggers re-render for material)
	const opacity = structural.opacity ?? 0.7;

	// Generate particle data with colors from mood configuration
	const particles = useMemo(() => {
		const data = generateParticles(colorCounts);
		
		// Initialize angles and positions
		const contractedRadius = scenePropsRef.current.sphereBaseRadius * PARTICLE_RADIUS_SCALE;
		const sphereMaxScale = contractedRadius * 0.7;
		
		positionsRef.current = data.map((p) => {
			const initialRadius = sphereMaxScale * (2.5 + Math.random());
			return new THREE.Vector3(
				Math.sin(p.phi) * Math.cos(p.theta) * initialRadius,
				Math.cos(p.phi) * initialRadius,
				Math.sin(p.phi) * Math.sin(p.theta) * initialRadius,
			);
		});
		
		for (let i = 0; i < MAX_PARTICLES; i++) {
			anglesRef.current[i] = data[i].theta;
		}
		
		return data;
	}, [colorCounts]);

	// Count actual users (non-hidden particles)
	const totalUsers = useMemo(
		() => Object.values(colorCounts).reduce((a, b) => a + b, 0),
		[colorCounts],
	);

	useFrame((_, delta) => {
		if (!meshRef.current) return;

		const {
			breathPhase,
			phaseType,
			crystallization,
			diaphragmDirection,
			time,
		} = theatreBreath.current;

		const theatreProps = theatrePropsRef.current;
		const sceneProps = scenePropsRef.current;
		
		const contractedRadius = sceneProps.sphereBaseRadius * PARTICLE_RADIUS_SCALE;
		const sphereMaxScale = contractedRadius * 0.7;

		// Breath-responsive radius calculations
		const minScale = sphereMaxScale * 0.5;
		const maxScale = sphereMaxScale;
		const currentSphereScale = minScale + (maxScale - minScale) * (1 - breathPhase);

		const settledRadius = currentSphereScale * theatreProps.settledRadiusMult;
		const spreadRadius = currentSphereScale * theatreProps.spreadRadiusMult;
		const baseTargetRadius = lerp(spreadRadius, settledRadius, breathPhase);

		const phaseIndex = Math.floor(phaseType) as 0 | 1 | 2 | 3;
		let orbitSpeedMult = ORBIT_SPEED_BY_PHASE[phaseIndex] ?? 1;
		orbitSpeedMult *= 1 - crystallization * theatreProps.crystalOrbitReduction;
		
		const baseOrbitSpeed = BASE_ORBIT_SPEED * orbitSpeedMult * theatreProps.orbitSpeed;
		const bobAmount = theatreProps.bobAmount * (1 - crystallization * 0.6);
		const diaphragmInfluence = diaphragmDirection * 0.3 * (1 - crystallization);
		const smoothing = 1 - (1 - POSITION_SMOOTHING) ** (delta * 60);

		for (let i = 0; i < totalUsers; i++) {
			const data = particles[i];
			
			// 1. Update Angle
			anglesRef.current[i] = (anglesRef.current[i] + baseOrbitSpeed * data.orbitSpeed * delta) % (Math.PI * 2);
			
			// 2. Calculate Target Position
			let targetRadius = baseTargetRadius;
			const radiusVariation = 0.85 + (data.phase / (Math.PI * 2)) * 0.3;
			targetRadius *= lerp(1.0, radiusVariation, 1 - breathPhase);
			
			const radius = targetRadius * (1 + data.radiusOffset);
			const verticalBob = Math.sin(time * BOB_SPEED + data.phase) * bobAmount;
			
			const tx = Math.sin(data.phi) * Math.cos(anglesRef.current[i]) * radius;
			const ty = Math.cos(data.phi) * radius + verticalBob + diaphragmInfluence;
			const tz = Math.sin(data.phi) * Math.sin(anglesRef.current[i]) * radius;
			
			// 3. Smooth Interpolation
			const pos = positionsRef.current[i];
			pos.x += (tx - pos.x) * smoothing;
			pos.y += (ty - pos.y) * smoothing;
			pos.z += (tz - pos.z) * smoothing;
			
			// 4. Set Matrix
			const baseSize = theatreProps.baseSize + (1 - breathPhase) * 0.015;
			const scale = baseSize * data.size;
			
			tempMatrix.makeScale(scale, scale, scale);
			tempMatrix.setPosition(pos);
			meshRef.current.setMatrixAt(i, tempMatrix);
			meshRef.current.setColorAt(i, data.color);
		}

		meshRef.current.instanceMatrix.needsUpdate = true;
		if (meshRef.current.instanceColor) {
			meshRef.current.instanceColor.needsUpdate = true;
		}
	});

	return (
		<instancedMesh 
			ref={meshRef} 
			args={[undefined, undefined, MAX_PARTICLES]} 
			frustumCulled={false}
		>
			<sphereGeometry args={[1, 6, 6]} />
			<meshBasicMaterial
				transparent
				opacity={opacity}
				depthWrite={false}
				blending={THREE.AdditiveBlending}
			/>
		</instancedMesh>
	);
});

