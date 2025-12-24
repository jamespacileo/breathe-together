/**
 * Breathing easing curves using bezier-easing
 * Provides physiologically-appropriate easing for each breath phase
 */
import BezierEasing from 'bezier-easing';

export type PhaseType = 'inhale' | 'hold-full' | 'exhale' | 'hold-empty';

// Inhale: slow→fast (ease-in) - lung resistance at start
const easeIn = BezierEasing(0.42, 0, 1, 1);

// Exhale: fast→slow (ease-out) - quick release, controlled end
const easeOut = BezierEasing(0, 0, 0.58, 1);

// Holds: linear (steady state)
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
			return linear(t);
	}
}

/**
 * Get temperature shift for color effects
 * -1 = cool (inhale), +1 = warm (exhale)
 */
export function getTemperatureShift(
	phase: PhaseType,
	progress: number,
): number {
	switch (phase) {
		case 'inhale':
			// Start neutral, shift cool
			return -progress;
		case 'exhale':
			// Start cool, shift warm
			return -1 + progress * 2;
		case 'hold-full':
			// Stay cool
			return -1;
		case 'hold-empty':
			// Stay warm
			return 1;
		default:
			return 0;
	}
}
