/**
 * Post-Processing Effects
 *
 * Centralized post-processing effects for the 3D scene.
 * - Bloom: Soft glow around bright elements (tuned via luminance threshold)
 * - Vignette: Dark edges for focus
 * - Noise: Film grain for atmosphere
 * - Driven by Theatre.js for cinematic control
 *
 * Performance Note: True selective bloom (Selection/Select) would require
 * scene restructuring. Current approach uses luminance threshold to achieve
 * similar selectivity - only the brightest elements (GlassOrb, OrbGlow) bloom
 * while darker particles and background don't.
 */
import {
	Bloom,
	EffectComposer,
	Noise,
	Vignette,
} from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import { memo, useMemo } from 'react';
import { postProcessingObj, useTheatreRef } from '../../../lib/theatre';
import type { PostProcessingProps as TheatrePostProps } from '../../../lib/theatre/types';

export const PostProcessingEffects = memo(() => {
	// Use ref-based subscription - post-processing props animate smoothly
	const theatrePropsRef = useTheatreRef<TheatrePostProps>(postProcessingObj);

	// Memoize stable props for EffectComposer
	const glProps = useMemo(
		() => ({
			multisampling: 0, // Disable MSAA in composer for performance
			stencilBuffer: false,
		}),
		[],
	);

	// Get current values (will be read each render, but ref avoids subscription overhead)
	const props = theatrePropsRef.current;

	return (
		<EffectComposer
			enableNormalPass={false}
			{...glProps}
		>
			<Bloom
				intensity={props.bloomIntensity}
				luminanceThreshold={props.bloomThreshold}
				luminanceSmoothing={props.bloomSmoothing}
				mipmapBlur
				radius={props.bloomRadius}
				kernelSize={KernelSize.MEDIUM}
				levels={5}
			/>
			<Vignette
				darkness={props.vignetteDarkness}
				offset={props.vignetteOffset}
				blendFunction={BlendFunction.NORMAL}
			/>
			<Noise
				premultiply
				blendFunction={BlendFunction.SOFT_LIGHT}
				opacity={props.noiseOpacity}
			/>
		</EffectComposer>
	);
});
