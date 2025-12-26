import { memo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { PARTICLE_RADIUS_SCALE } from '../../../lib/layers';
import { atmosphericHaloObj, orbGlowObj, sceneObj } from '../../../lib/theatre';
import type { SceneProps } from '../../../lib/theatre/types';
import { GlassOrb } from './GlassOrb';
import { GlowSphere } from './GlowSphere';
import { OrbitalParticles } from './OrbitalParticles';

/**
 * Core Orb - Hybrid Glass + Particles Implementation
 *
 * A stunning 4-layer visualization that creates maximum visual impact:
 *
 * Layer 1 (innermost): GlassOrb
 *   - MeshTransmissionMaterial glass orb with refraction
 *   - Chromatic aberration for rainbow edge effects
 *   - Distortion calms during hold phases
 *
 * Layer 2: OrbGlow
 *   - Fresnel-based soft inner light
 *   - Phase-specific color tinting
 *   - Subtle pulsing animation
 *
 * Layer 3: OrbitalParticles
 *   - 500 particles in spherical shells
 *   - Contract on inhale, expand on exhale
 *   - Slow orbit during holds, faster during breathing
 *
 * Layer 4 (outermost): AtmosphericHalo
 *   - Soft atmospheric glow
 *   - Very low opacity ethereal effect
 *   - Inverted fresnel for edge glow
 *
 * All layers respond to breath phases via TheatreBreathProvider.
 */
export const CoreOrb = memo(() => {
	const [theatreProps, setTheatreProps] = useState<SceneProps>(sceneObj.value);

	// Subscribe to Theatre.js object changes
	useEffect(() => {
		const unsubscribe = sceneObj.onValuesChange((values) => {
			setTheatreProps((prev) => {
				if (prev.sphereBaseRadius !== values.sphereBaseRadius) {
					return values;
				}
				return prev;
			});
		});
		return unsubscribe;
	}, []);

	const contractedRadius =
		theatreProps.sphereBaseRadius * PARTICLE_RADIUS_SCALE;

	return (
		<group>
			{/* Layer 4: Outer atmospheric halo (renders first, behind everything) */}
			<GlowSphere 
				radius={contractedRadius} 
				theatreObject={atmosphericHaloObj} 
				side={THREE.BackSide}
				renderOrder={0}
			/>

			{/* Layer 3: Orbiting particle shell */}
			<OrbitalParticles baseRadius={contractedRadius * 0.7} />

			{/* Layer 2: Inner glow (fresnel-based) */}
			<GlowSphere 
				radius={contractedRadius} 
				theatreObject={orbGlowObj} 
				side={THREE.FrontSide}
				renderOrder={2}
				isInnerGlow
			/>

			{/* Layer 1: Crystal core (MeshTransmissionMaterial) */}
			<GlassOrb radius={contractedRadius} />
		</group>
	);
});
