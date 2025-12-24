/**
 * Bezier-based easing curves for breathing phases
 * Uses bezier-easing library for smooth, natural motion
 */

import BezierEasing from 'bezier-easing';
import type { PhaseType } from '../types';

// Inhale: slow start, accelerates (ease-in feel)
// Mimics the initial effort of drawing breath
const easeIn = BezierEasing(0.42, 0, 1, 1);

// Exhale: starts quickly, slows down (ease-out feel)
// Mimics natural relaxation during release
const easeOut = BezierEasing(0, 0, 0.58, 1);

// Holds: linear - no easing needed
const linear = (t: number): number => t;

/**
 * Apply phase-appropriate easing to progress value
 */
export function applyEasing(phase: PhaseType, t: number): number {
	switch (phase) {
		case 'inhale':
			return easeIn(t);
		case 'exhale':
			return easeOut(t);
		case 'hold-full':
		case 'hold-empty':
			return linear(t);
		default:
			return t;
	}
}

/**
 * Get the easing function for a specific phase
 */
export function getEasingFunction(phase: PhaseType): (t: number) => number {
	switch (phase) {
		case 'inhale':
			return easeIn;
		case 'exhale':
			return easeOut;
		default:
			return linear;
	}
}

/**
 * Create custom bezier easing
 */
export function createEasing(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
): (t: number) => number {
	return BezierEasing(x1, y1, x2, y2);
}

// Export pre-made easings for direct use
export { easeIn, easeOut, linear };
