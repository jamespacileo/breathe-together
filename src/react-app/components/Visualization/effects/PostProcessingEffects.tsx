/**
 * Post-Processing Effects
 *
 * Centralized post-processing effects for the 3D scene.
 * - Bloom: Soft glow around bright elements
 * - Vignette: Dark edges for focus
 * - Noise: Film grain for atmosphere
 * - Driven by Theatre.js for cinematic control
 */
import {
	Bloom,
	EffectComposer,
	Noise,
	Vignette,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useEffect, useState } from 'react';
import { postProcessingObj } from '../../../lib/theatre';
import type { PostProcessingProps as TheatrePostProps } from '../../../lib/theatre/types';

export function PostProcessingEffects() {
	const [theatreProps, setTheatreProps] = useState<TheatrePostProps>(
		postProcessingObj.value,
	);

	// Subscribe to Theatre.js object changes
	useEffect(() => {
		const unsubscribe = postProcessingObj.onValuesChange((values) => {
			setTheatreProps(values);
		});
		return unsubscribe;
	}, []);

	return (
		<EffectComposer enableNormalPass={false}>
			<Bloom
				intensity={theatreProps.bloomIntensity}
				luminanceThreshold={theatreProps.bloomThreshold}
				luminanceSmoothing={theatreProps.bloomSmoothing}
				mipmapBlur
				radius={theatreProps.bloomRadius}
			/>
			<Vignette
				darkness={theatreProps.vignetteDarkness}
				offset={theatreProps.vignetteOffset}
				blendFunction={BlendFunction.NORMAL}
			/>
			<Noise
				premultiply
				blendFunction={BlendFunction.SOFT_LIGHT}
				opacity={theatreProps.noiseOpacity}
			/>
		</EffectComposer>
	);
}
