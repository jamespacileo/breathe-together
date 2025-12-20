import { Suspense, useCallback, useEffect, useState } from 'react';
import type { BreathState } from '../../hooks/useBreathSync';
import type { VisualizationConfig } from '../../lib/config';
import { AnimationErrorBoundary } from './AnimationErrorBoundary';
import {
	type AnimationId,
	DEFAULT_ANIMATION,
	GalaxyAnimation,
	OrbAnimation,
} from './animations';

interface AnimationRendererProps {
	breathState: BreathState;
	config: VisualizationConfig;
	moodColor: string;
	animationId?: AnimationId;
}

/**
 * Animation component map for direct imports (faster than dynamic)
 */
const ANIMATION_COMPONENTS: Record<
	AnimationId,
	React.ComponentType<{
		breathState: BreathState;
		config: VisualizationConfig;
		moodColor: string;
	}>
> = {
	orb: OrbAnimation,
	galaxy: GalaxyAnimation,
};

/**
 * Renders the selected animation with error boundary
 * Falls back to default animation if selected one fails
 */
export function AnimationRenderer({
	breathState,
	config,
	moodColor,
	animationId = DEFAULT_ANIMATION,
}: AnimationRendererProps) {
	const [fallbackToDefault, setFallbackToDefault] = useState(false);

	const effectiveAnimationId = fallbackToDefault
		? DEFAULT_ANIMATION
		: animationId;

	const handleReset = useCallback(() => {
		setFallbackToDefault(false);
	}, []);

	// Reset fallback when animation changes
	useEffect(() => {
		setFallbackToDefault(false);
	}, [animationId]);

	const AnimationComponent = ANIMATION_COMPONENTS[effectiveAnimationId];

	if (!AnimationComponent) {
		console.warn(`Unknown animation: ${effectiveAnimationId}, using default`);
		const DefaultComponent = ANIMATION_COMPONENTS[DEFAULT_ANIMATION];
		return (
			<DefaultComponent
				breathState={breathState}
				config={config}
				moodColor={moodColor}
			/>
		);
	}

	return (
		<AnimationErrorBoundary
			animationId={effectiveAnimationId}
			onReset={handleReset}
		>
			<Suspense fallback={null}>
				<AnimationComponent
					breathState={breathState}
					config={config}
					moodColor={moodColor}
				/>
			</Suspense>
		</AnimationErrorBoundary>
	);
}
