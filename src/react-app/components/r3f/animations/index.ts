import type { ComponentType } from 'react';
import { hasLimitedWebGL } from '../../../lib/device';
import { MinimalAnimation } from './minimal';
import { NebulaAnimation } from './nebula';
import { RingAnimation } from './ring';
import type { AnimationMeta, ParticleAnimationProps } from './types';

export type { AnimationMeta, ParticleAnimationProps } from './types';

/**
 * Available animation types
 */
export type AnimationType = 'nebula' | 'ring' | 'minimal';

/**
 * Animation registry - maps IDs to components and metadata.
 * To add a new animation:
 * 1. Create a component in animations/ that accepts ParticleAnimationProps
 * 2. Add an entry here with id, name, description, and component
 */
export const ANIMATIONS: Record<
	AnimationType,
	{
		component: ComponentType<ParticleAnimationProps>;
		meta: AnimationMeta;
	}
> = {
	nebula: {
		component: NebulaAnimation,
		meta: {
			id: 'nebula',
			name: 'Nebula',
			description: 'Flowing particles with orbital motion using three-nebula',
		},
	},
	ring: {
		component: RingAnimation,
		meta: {
			id: 'ring',
			name: 'Ring',
			description: 'Classic circular particle ring with gentle wobble',
		},
	},
	minimal: {
		component: MinimalAnimation,
		meta: {
			id: 'minimal',
			name: 'Minimal',
			description: 'Clean, zen-like breathing circle',
		},
	},
};

/**
 * Get animation component by type
 */
export function getAnimation(
	type: AnimationType,
): ComponentType<ParticleAnimationProps> {
	return ANIMATIONS[type].component;
}

/**
 * Get all available animation metadata (for UI selectors)
 */
export function getAnimationList(): AnimationMeta[] {
	return Object.values(ANIMATIONS).map((a) => a.meta);
}

/**
 * Default animation type
 */
export const DEFAULT_ANIMATION: AnimationType = 'nebula';

/**
 * iOS fallback animation (nebula has issues on iOS Safari)
 */
export const IOS_FALLBACK_ANIMATION: AnimationType = 'ring';

/**
 * Get effective animation type, applying device-specific fallbacks.
 * iOS Safari has WebGL issues with three-nebula's SpriteRenderer,
 * so we fall back to the simpler ring animation.
 */
export function getEffectiveAnimationType(
	requested: AnimationType,
): AnimationType {
	// If nebula is requested but device has limited WebGL, use ring instead
	if (requested === 'nebula' && hasLimitedWebGL()) {
		return IOS_FALLBACK_ANIMATION;
	}
	return requested;
}
