import type { AnimationComponent, AnimationId, AnimationMeta } from './types';

// Lazy imports for code splitting
const OrbAnimation = () =>
	import('./OrbAnimation').then((m) => ({ default: m.OrbAnimation }));
const GalaxyAnimation = () =>
	import('./GalaxyAnimation').then((m) => ({ default: m.GalaxyAnimation }));

/**
 * Registry of available animations
 */
export const ANIMATION_REGISTRY: Record<AnimationId, AnimationMeta> = {
	orb: {
		id: 'orb',
		name: 'Breathing Orb',
		description: 'Classic circular particle ring that expands and contracts',
		component: null as never, // Loaded dynamically
	},
	galaxy: {
		id: 'galaxy',
		name: 'Galaxy Nebula',
		description: 'Spiral galaxy that contracts into shape and diffuses',
		component: null as never, // Loaded dynamically
	},
};

/**
 * Dynamic import map for animations
 */
export const ANIMATION_LOADERS: Record<
	AnimationId,
	() => Promise<{ default: AnimationComponent }>
> = {
	orb: OrbAnimation,
	galaxy: GalaxyAnimation,
};

/**
 * Default animation to use
 */
export const DEFAULT_ANIMATION: AnimationId = 'orb';

/**
 * Get list of available animations
 */
export function getAvailableAnimations(): AnimationMeta[] {
	return Object.values(ANIMATION_REGISTRY);
}
