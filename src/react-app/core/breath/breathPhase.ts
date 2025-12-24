/**
 * Breath phase calculation with UTC synchronization
 * All users worldwide see identical animation synced to UTC time
 */

import type {
	BreathPreset,
	BreathState,
	PhaseIndex,
	PhaseType,
} from '../types';

// Breathing presets matching the spec
export const BREATH_PRESETS: Record<string, BreathPreset> = {
	box: {
		id: 'box',
		name: 'Box Breathing',
		inhale: 4,
		holdFull: 4,
		exhale: 4,
		holdEmpty: 4,
		totalDuration: 16,
	},
	diaphragmatic: {
		id: 'diaphragmatic',
		name: 'Diaphragmatic',
		inhale: 4,
		holdFull: 0,
		exhale: 6,
		holdEmpty: 0,
		totalDuration: 10,
	},
	relaxation: {
		id: 'relaxation',
		name: '4-7-8 Relaxation',
		inhale: 4,
		holdFull: 7,
		exhale: 8,
		holdEmpty: 0,
		totalDuration: 19,
	},
};

/**
 * Get current breath phase based on UTC time
 */
export function getBreathPhase(
	presetId: string = 'box',
	applyEasing: (phase: PhaseType, t: number) => number = (_, t) => t,
): BreathState {
	const preset = BREATH_PRESETS[presetId] ?? BREATH_PRESETS.box;
	const cycleLength = preset.totalDuration;
	const msInCycle = Date.now() % (cycleLength * 1000);
	const secondsInCycle = msInCycle / 1000;

	let phase: PhaseType;
	let phaseIndex: PhaseIndex;
	let phaseProgress: number;

	if (secondsInCycle < preset.inhale) {
		// Inhale phase
		phase = 'inhale';
		phaseIndex = 0;
		phaseProgress = secondsInCycle / preset.inhale;
	} else if (
		preset.holdFull > 0 &&
		secondsInCycle < preset.inhale + preset.holdFull
	) {
		// Hold full phase
		phase = 'hold-full';
		phaseIndex = 1;
		phaseProgress = (secondsInCycle - preset.inhale) / preset.holdFull;
	} else if (secondsInCycle < preset.inhale + preset.holdFull + preset.exhale) {
		// Exhale phase
		phase = 'exhale';
		phaseIndex = 2;
		const exhaleStart = preset.inhale + preset.holdFull;
		phaseProgress = (secondsInCycle - exhaleStart) / preset.exhale;
	} else {
		// Hold empty phase
		phase = 'hold-empty';
		phaseIndex = 3;
		const holdEmptyStart = preset.inhale + preset.holdFull + preset.exhale;
		phaseProgress =
			preset.holdEmpty > 0
				? (secondsInCycle - holdEmptyStart) / preset.holdEmpty
				: 0;
	}

	// Clamp progress
	phaseProgress = Math.max(0, Math.min(1, phaseProgress));

	return {
		phase,
		phaseIndex,
		phaseProgress,
		easedProgress: applyEasing(phase, phaseProgress),
		cycleProgress: secondsInCycle / cycleLength,
	};
}

/**
 * Get phase type as numeric index for shader uniform
 */
export function phaseToIndex(phase: PhaseType): PhaseIndex {
	switch (phase) {
		case 'inhale':
			return 0;
		case 'hold-full':
			return 1;
		case 'exhale':
			return 2;
		case 'hold-empty':
			return 3;
	}
}
