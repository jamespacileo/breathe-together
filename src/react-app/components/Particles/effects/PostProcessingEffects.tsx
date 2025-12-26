/**
 * Post-Processing Effects
 *
 * Centralized post-processing effects for the 3D scene.
 * - Bloom: Soft glow around bright elements
 * - Vignette: Dark edges for focus
 * - Noise: Film grain for atmosphere
 */
import {
	Bloom,
	EffectComposer,
	Noise,
	Vignette,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import type { VisualizationConfig } from '../../../lib/config';
import { POST_PROCESSING } from '../../../lib/layers';

interface PostProcessingEffectsProps {
	config: VisualizationConfig;
}

export function PostProcessingEffects({ config }: PostProcessingEffectsProps) {
	return (
		<EffectComposer disableNormalPass>
			<Bloom
				intensity={POST_PROCESSING.BLOOM_INTENSITY}
				luminanceThreshold={POST_PROCESSING.BLOOM_THRESHOLD}
				luminanceSmoothing={POST_PROCESSING.BLOOM_SMOOTHING}
				mipmapBlur
				radius={POST_PROCESSING.BLOOM_RADIUS}
			/>
			<Vignette
				darkness={config.vignetteIntensity}
				offset={POST_PROCESSING.VIGNETTE_OFFSET}
				blendFunction={BlendFunction.NORMAL}
			/>
			<Noise
				premultiply
				blendFunction={BlendFunction.SOFT_LIGHT}
				opacity={config.noiseOpacity}
			/>
		</EffectComposer>
	);
}
