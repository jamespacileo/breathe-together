import type { BreathState } from '../hooks/useBreathSync';

/**
 * Calculate breath value (0 = exhaled, 1 = inhaled) with smoothstep interpolation
 * Used by all visualization components for synchronized breathing animation
 */
export function getBreathValue(breathState: BreathState): number {
	const { phase, progress } = breathState;

	if (phase === 'in') {
		// Smoothstep interpolation for natural easing
		return progress * progress * (3 - 2 * progress);
	}
	if (phase === 'hold-in') {
		return 1;
	}
	if (phase === 'out') {
		// Inverse smoothstep for exhale
		return 1 - progress * progress * (3 - 2 * progress);
	}
	// hold-out
	return 0;
}
