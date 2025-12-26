import { MeshTransmissionMaterial } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { memo, useRef } from 'react';
import * as THREE from 'three';
import { SPHERE_PHASE_COLORS } from '../../../lib/colors';

interface CrystalCoreProps {
	radius: number;
	breathPhase: number;
	phaseType: number;
	crystallization: number;
}

// Phase colors as THREE.Color for efficient interpolation
const PHASE_COLORS = [
	new THREE.Color(
		SPHERE_PHASE_COLORS.inhale.r,
		SPHERE_PHASE_COLORS.inhale.g,
		SPHERE_PHASE_COLORS.inhale.b,
	),
	new THREE.Color(
		SPHERE_PHASE_COLORS.holdIn.r,
		SPHERE_PHASE_COLORS.holdIn.g,
		SPHERE_PHASE_COLORS.holdIn.b,
	),
	new THREE.Color(
		SPHERE_PHASE_COLORS.exhale.r,
		SPHERE_PHASE_COLORS.exhale.g,
		SPHERE_PHASE_COLORS.exhale.b,
	),
	new THREE.Color(
		SPHERE_PHASE_COLORS.holdOut.r,
		SPHERE_PHASE_COLORS.holdOut.g,
		SPHERE_PHASE_COLORS.holdOut.b,
	),
];

/**
 * Crystal Core - Glass/crystal sphere with MeshTransmissionMaterial
 *
 * Creates a stunning refractive crystal orb that responds to breathing phases.
 * - Distortion decreases during hold phases for "crystallization" effect
 * - Thickness varies with breath for visual depth
 * - Chromatic aberration creates rainbow edge effects
 */
export const CrystalCore = memo(
	({ radius, breathPhase, phaseType, crystallization }: CrystalCoreProps) => {
		const meshRef = useRef<THREE.Mesh>(null);
		const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
		const colorRef = useRef(new THREE.Color());

		// Calculate current scale based on breath phase
		// breathPhase: 0 = exhaled (expanded), 1 = inhaled (contracted)
		const minScale = radius * 0.35;
		const maxScale = radius * 0.7;
		const currentScale = minScale + (maxScale - minScale) * (1 - breathPhase);

		// Check if in hold phase (1 = holdIn, 3 = holdOut)
		const isHoldPhase = phaseType === 1 || phaseType === 3;

		// Calculate breath-responsive material properties
		// During holds: low distortion (calm, crystallized)
		// During breathing: higher distortion (active, fluid)
		const distortion = isHoldPhase ? 0.02 : 0.08 + breathPhase * 0.06;
		const temporalDistortion = isHoldPhase ? 0.01 : 0.03;
		const thickness = 0.2 + breathPhase * 0.15;
		const roughness = 0.02 + crystallization * 0.03;

		// Get current phase color with smooth interpolation
		const phaseColor = PHASE_COLORS[phaseType] || PHASE_COLORS[0];

		// Animate material properties
		useFrame(() => {
			if (meshRef.current) {
				meshRef.current.scale.setScalar(currentScale);
			}
		});

		return (
			<mesh ref={meshRef} renderOrder={3}>
				<sphereGeometry args={[1, 64, 64]} />
				<MeshTransmissionMaterial
					ref={materialRef}
					transmission={0.92}
					thickness={thickness}
					roughness={roughness}
					chromaticAberration={0.012}
					distortion={distortion}
					temporalDistortion={temporalDistortion}
					color={phaseColor}
					backside
					resolution={512}
					samples={6}
					anisotropy={0.5}
				/>
			</mesh>
		);
	},
);
