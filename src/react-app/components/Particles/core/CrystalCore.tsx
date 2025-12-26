import { MeshTransmissionMaterial } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { memo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { SPHERE_PHASE_COLORS } from '../../../lib/colors';
import { crystalCoreObj } from '../../../lib/theatre';
import type { CrystalCoreProps as TheatreCrystalProps } from '../../../lib/theatre/types';
import { useTheatreBreath } from '../TheatreBreathProvider';

interface CrystalCoreProps {
	radius: number;
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
 * - Driven by Theatre.js for cinematic control
 * - Distortion decreases during hold phases for "crystallization" effect
 * - Thickness varies with breath for visual depth
 * - Chromatic aberration creates rainbow edge effects
 */
export const CrystalCore = memo(({ radius }: CrystalCoreProps) => {
	const meshRef = useRef<THREE.Mesh>(null);
	const materialRef = useRef<any>(null);
	const theatreBreath = useTheatreBreath();
	const theatrePropsRef = useRef<TheatreCrystalProps>(crystalCoreObj.value);

	// Subscribe to Theatre.js object changes (Ref-only, no re-renders)
	useEffect(() => {
		const unsubscribe = crystalCoreObj.onValuesChange((values) => {
			theatrePropsRef.current = values;
		});
		return unsubscribe;
	}, []);

	// Animate each frame
	useFrame(() => {
		if (!(meshRef.current && materialRef.current)) return;

		const { breathPhase, phaseType, crystallization } = theatreBreath.current;
		const theatreProps = theatrePropsRef.current;

		// 1. Update Scale
		// breathPhase: 0 = exhaled (expanded), 1 = inhaled (contracted)
		const minScale = radius * theatreProps.scale;
		const maxScale = radius * theatreProps.scale * 2;
		const currentScale = minScale + (maxScale - minScale) * (1 - breathPhase);
		meshRef.current.scale.setScalar(currentScale);

		// 2. Update Material Properties
		const isHoldPhase = phaseType === 1 || phaseType === 3;

		// During holds: low distortion (calm, crystallized)
		// During breathing: higher distortion (active, fluid)
		const distortion = isHoldPhase
			? theatreProps.distortion * 0.25
			: theatreProps.distortion + breathPhase * 0.06;

		const temporalDistortion = isHoldPhase
			? theatreProps.temporalDistortion * 0.1
			: theatreProps.temporalDistortion;

		const thickness = theatreProps.thickness + breathPhase * 0.15;
		const roughness = theatreProps.roughness + crystallization * 0.03;

		// Get current phase color
		const phaseColor = PHASE_COLORS[phaseType] || PHASE_COLORS[0];

		// Apply to material
		materialRef.current.distortion = distortion;
		materialRef.current.temporalDistortion = temporalDistortion;
		materialRef.current.thickness = thickness;
		materialRef.current.roughness = roughness;
		materialRef.current.color.copy(phaseColor);
		materialRef.current.transmission = theatreProps.transmission;
		materialRef.current.chromaticAberration = theatreProps.chromaticAberration;
		materialRef.current.distortionScale = theatreProps.distortionScale;
	});

	return (
		<mesh ref={meshRef} renderOrder={3}>
			<sphereGeometry args={[1, 64, 64]} />
			<MeshTransmissionMaterial
				ref={materialRef}
				backside
				resolution={512}
				samples={6}
				anisotropy={0.5}
			/>
		</mesh>
	);
});
