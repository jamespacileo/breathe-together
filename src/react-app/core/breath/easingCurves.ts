/**
 * Bezier easing curves for breathing phases
 * Uses bezier-easing (~2KB) for smooth physiological curves
 */

import BezierEasing from 'bezier-easing';
import type { PhaseType } from '../types';

// Ease-in for inhale: slow start, accelerates (slow→fast)
const easeIn = BezierEasing(0.42, 0, 1, 1);

// Ease-out for exhale: fast start, decelerates (fast→slow)
const easeOut = BezierEasing(0, 0, 0.58, 1);

// Linear for hold phases
const linear = (t: number) => t;

/**
 * Apply phase-appropriate easing to raw progress
 */
export function applyEasing(phase: PhaseType, t: number): number {
	switch (phase) {
		case 'inhale':
			return easeIn(t);
		case 'exhale':
			return easeOut(t);
		default:
			// hold-full, hold-empty use linear easing
			return linear(t);
	}
}

/**
 * Get the derivative/velocity of easing at a point
 * Useful for particle physics matching breath pace
 */
export function getEasingVelocity(phase: PhaseType, t: number): number {
	const epsilon = 0.001;
	const t0 = Math.max(0, t - epsilon);
	const t1 = Math.min(1, t + epsilon);
	const dt = t1 - t0;

	if (dt === 0) return 0;

	const v0 = applyEasing(phase, t0);
	const v1 = applyEasing(phase, t1);

	return (v1 - v0) / dt;
}

/**
 * Custom easing for specific effects
 */
export const easings = {
	// Anticipation: slight pullback before action
	anticipation: BezierEasing(0.6, -0.28, 0.735, 0.045),

	// Overshoot: slight bounce past target
	overshoot: BezierEasing(0.175, 0.885, 0.32, 1.275),

	// Smooth settle: gradual deceleration
	settle: BezierEasing(0.19, 1, 0.22, 1),

	// Gentle: very smooth transitions
	gentle: BezierEasing(0.25, 0.1, 0.25, 1),

	// Crystallize: ease into stillness during holds
	crystallize: BezierEasing(0.4, 0, 0.2, 1),
};
