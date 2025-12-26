/**
 * Breathing pattern configurations
 * All patterns are synchronized globally via UTC time
 */

export type PhaseType = 'in' | 'hold-in' | 'out' | 'hold-out';

/** Map phase type string to numeric value for shaders */
export const PHASE_TYPE_MAP: Record<PhaseType, number> = {
	in: 0,
	'hold-in': 1,
	out: 2,
	'hold-out': 3,
} as const;

/** Phase-specific properties for animation logic */
export const PHASE_PROPERTIES: Record<
	PhaseType,
	{ diaphragmDirection: -1 | 0 | 1; isActive: boolean }
> = {
	in: { diaphragmDirection: -1, isActive: true },
	'hold-in': { diaphragmDirection: 0, isActive: false },
	out: { diaphragmDirection: 1, isActive: true },
	'hold-out': { diaphragmDirection: 0, isActive: false },
} as const;

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

	const cycleProgress = cyclePosition / pattern.totalDuration;

	return {
		phase: currentPhase,
		phaseIndex,
		progress: Math.min(1, Math.max(0, phaseProgress)),
		cycleProgress: Math.min(1, Math.max(0, cycleProgress)),
	};
}
