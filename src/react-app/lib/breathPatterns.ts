/**
 * Breathing pattern configurations
 * All patterns are synchronized globally via UTC time
 */

export type PhaseType = 'in' | 'hold-in' | 'out' | 'hold-out';

export interface Phase {
	name: string;
	duration: number; // seconds
	type: PhaseType;
}

export interface Pattern {
	id: string;
	name: string;
	description: string;
	phases: Phase[];
	totalDuration: number; // computed sum of all phase durations
}

export const PATTERNS = {
	box: {
		id: 'box',
		name: 'Box Breathing',
		description: 'Equal 4-second phases. Used by Navy SEALs for calm focus.',
		phases: [
			{ name: 'Breathe In', duration: 4, type: 'in' },
			{ name: 'Hold', duration: 4, type: 'hold-in' },
			{ name: 'Breathe Out', duration: 4, type: 'out' },
			{ name: 'Hold', duration: 4, type: 'hold-out' },
		],
		totalDuration: 16,
	},
	relaxation: {
		id: 'relaxation',
		name: '4-7-8 Relaxation',
		description: "Dr. Andrew Weil's technique for deep relaxation and sleep.",
		phases: [
			{ name: 'Breathe In', duration: 4, type: 'in' },
			{ name: 'Hold', duration: 7, type: 'hold-in' },
			{ name: 'Breathe Out', duration: 8, type: 'out' },
		],
		totalDuration: 19,
	},
} satisfies Record<string, Pattern>;

export type PatternId = keyof typeof PATTERNS;

export const DEFAULT_PATTERN: PatternId = 'box';

/**
 * Get the current phase based on UTC time
 */
export function getCurrentPhase(pattern: Pattern): {
	phase: Phase;
	phaseIndex: number;
	progress: number; // 0-1 within current phase
	cycleProgress: number; // 0-1 within entire cycle
} {
	const now = Date.now() / 1000; // Current time in seconds
	const cyclePosition = now % pattern.totalDuration;

	let elapsed = 0;
	let currentPhase = pattern.phases[0];
	let phaseIndex = 0;

	for (let i = 0; i < pattern.phases.length; i++) {
		const phase = pattern.phases[i];
		if (cyclePosition < elapsed + phase.duration) {
			currentPhase = phase;
			phaseIndex = i;
			break;
		}
		elapsed += phase.duration;
	}

	const phaseProgress = (cyclePosition - elapsed) / currentPhase.duration;

	return {
		phase: currentPhase,
		phaseIndex,
		progress: Math.min(1, Math.max(0, phaseProgress)),
		cycleProgress: cyclePosition / pattern.totalDuration,
	};
}

// ============================================================================
// Breath Value Utilities (merged from breathUtils.ts)
// ============================================================================

/**
 * Breath state from useBreathSync hook
 */
export interface BreathState {
	phase: PhaseType;
	phaseName: string;
	progress: number;
	cycleProgress: number;
	phaseIndex: number;
}

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
