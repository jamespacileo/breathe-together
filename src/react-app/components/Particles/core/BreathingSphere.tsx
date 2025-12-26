import { useFrame } from '@react-three/fiber';
import { memo, useRef } from 'react';
import { useGlobalUniforms } from '../../../hooks/useGlobalUniforms';
import { CrystalCore } from './CrystalCore';
import { InnerGlow } from './InnerGlow';
import { OrbitingShell } from './OrbitingShell';
import { OuterHalo } from './OuterHalo';

interface BreathingSphereProps {
	contractedRadius: number;
}

/**
 * Breathing Sphere - Hybrid Glass + Particles Implementation
 *
 * A stunning 4-layer visualization that creates maximum visual impact:
 *
 * Layer 1 (innermost): CrystalCore
 *   - MeshTransmissionMaterial glass orb with refraction
 *   - Chromatic aberration for rainbow edge effects
 *   - Distortion calms during hold phases
 *
 * Layer 2: InnerGlow
 *   - Fresnel-based soft inner light
 *   - Phase-specific color tinting
 *   - Subtle pulsing animation
 *
 * Layer 3: OrbitingShell
 *   - 500 particles in spherical shells
 *   - Contract on inhale, expand on exhale
 *   - Slow orbit during holds, faster during breathing
 *
 * Layer 4 (outermost): OuterHalo
 *   - Soft atmospheric glow
 *   - Very low opacity ethereal effect
 *   - Inverted fresnel for edge glow
 *
 * All layers respond to breath phases:
 * - Inhale: gathering energy, contracting
 * - Hold In: crystallized, calm, still
 * - Exhale: releasing energy, expanding
 * - Hold Out: serene, still, wide
 */
export const BreathingSphere = memo(
	({ contractedRadius }: BreathingSphereProps) => {
		const globalUniforms = useGlobalUniforms();

		// Track breath data in a ref for child components
		const breathDataRef = useRef({
			breathPhase: 0,
			phaseType: 0,
			crystallization: 0,
		});

		// Read from global uniforms each frame (no redundant computation)
		useFrame(() => {
			const { breathPhase, phaseType, crystallization } = globalUniforms.current;
			breathDataRef.current.breathPhase = breathPhase;
			breathDataRef.current.phaseType = phaseType;
			breathDataRef.current.crystallization = crystallization;
		});

		// Use getters for current values (components will read in their own useFrame)
		const { breathPhase, phaseType, crystallization } = breathDataRef.current;

		return (
			<group>
				{/* Layer 4: Outer atmospheric halo (renders first, behind everything) */}
				<OuterHalo
					radius={contractedRadius}
					breathPhase={breathPhase}
					phaseType={phaseType}
					crystallization={crystallization}
				/>

				{/* Layer 3: Orbiting particle shell */}
				<OrbitingShell
					baseRadius={contractedRadius * 0.7}
					breathPhase={breathPhase}
					phaseType={phaseType}
					crystallization={crystallization}
				/>

				{/* Layer 2: Inner glow (fresnel-based) */}
				<InnerGlow
					radius={contractedRadius}
					breathPhase={breathPhase}
					phaseType={phaseType}
					crystallization={crystallization}
				/>

				{/* Layer 1: Crystal core (MeshTransmissionMaterial) */}
				<CrystalCore
					radius={contractedRadius}
					breathPhase={breathPhase}
					phaseType={phaseType}
					crystallization={crystallization}
				/>
			</group>
		);
	},
);
