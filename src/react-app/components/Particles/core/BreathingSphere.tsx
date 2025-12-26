import { memo, useEffect, useState } from 'react';
import { PARTICLE_RADIUS_SCALE } from '../../../lib/layers';
import { sceneObj } from '../../../lib/theatre';
import type { SceneProps } from '../../../lib/theatre/types';
import { CrystalCore } from './CrystalCore';
import { InnerGlow } from './InnerGlow';
import { OrbitingShell } from './OrbitingShell';
import { OuterHalo } from './OuterHalo';

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
 * All layers respond to breath phases via TheatreBreathProvider.
 */
export const BreathingSphere = memo(() => {
	const [theatreProps, setTheatreProps] = useState<SceneProps>(sceneObj.value);

	// Subscribe to Theatre.js object changes
	useEffect(() => {
		const unsubscribe = sceneObj.onValuesChange((values) => {
			setTheatreProps(values);
		});
		return unsubscribe;
	}, []);

	const contractedRadius =
		theatreProps.sphereBaseRadius * PARTICLE_RADIUS_SCALE;

	return (
		<group>
			{/* Layer 4: Outer atmospheric halo (renders first, behind everything) */}
			<OuterHalo radius={contractedRadius} />

			{/* Layer 3: Orbiting particle shell */}
			<OrbitingShell baseRadius={contractedRadius * 0.7} />

			{/* Layer 2: Inner glow (fresnel-based) */}
			<InnerGlow radius={contractedRadius} />

			{/* Layer 1: Crystal core (MeshTransmissionMaterial) */}
			<CrystalCore radius={contractedRadius} />
		</group>
	);
});
