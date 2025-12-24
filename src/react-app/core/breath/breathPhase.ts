/**
 * UTC-synchronized breath phase calculation
 * All users worldwide see identical animation synced to UTC time
 */

import { BREATH_PRESETS, type BreathPresetId } from '../constants';
import type {
	BreathPreset,
	BreathState,
	PhaseType,
	PhaseTypeNumber,
} from '../types';
import { applyEasing } from './easingCurves';

/**
 * Get current breath state from UTC time
 */
export function getBreathPhase(presetId: BreathPresetId = 'box'): BreathState {
	const preset = BREATH_PRESETS[presetId];
	const cycleLength = preset.total;
	const msInCycle = Date.now() % (cycleLength * 1000);
	const secondsInCycle = msInCycle / 1000;

	let phase: PhaseType;
	let phaseProgress: number;
	let phaseTypeNumber: PhaseTypeNumber;

	if (secondsInCycle < preset.inhale) {
		// Inhale phase
		phase = 'inhale';
		phaseProgress = secondsInCycle / preset.inhale;
		phaseTypeNumber = 0;
	} else if (
		preset.holdFull > 0 &&
		secondsInCycle < preset.inhale + preset.holdFull
	) {
		// Hold full phase
		phase = 'hold-full';
		phaseProgress = (secondsInCycle - preset.inhale) / preset.holdFull;
		phaseTypeNumber = 1;
	} else if (secondsInCycle < preset.inhale + preset.holdFull + preset.exhale) {
		// Exhale phase
		phase = 'exhale';
		phaseProgress =
			(secondsInCycle - preset.inhale - preset.holdFull) / preset.exhale;
		phaseTypeNumber = 2;
	} else {
		// Hold empty phase
		phase = 'hold-empty';
		const holdEmptyStart = preset.inhale + preset.holdFull + preset.exhale;
		phaseProgress =
			preset.holdEmpty > 0
				? (secondsInCycle - holdEmptyStart) / preset.holdEmpty
				: 0;
		phaseTypeNumber = 3;
	}

	// Clamp to valid range
	phaseProgress = Math.max(0, Math.min(1, phaseProgress));

	// Apply easing
	const easedProgress = applyEasing(phase, phaseProgress);

	// Calculate cycle progress
	const cycleProgress = secondsInCycle / cycleLength;

	return {
		phase,
		phaseProgress,
		easedProgress,
		cycleProgress,
		phaseTypeNumber,
	};
}

/**
 * Get temperature shift for color effects
 * -1 (cool/cyan) during inhale, +1 (warm/magenta) during exhale
 */
export function getTemperatureShift(state: BreathState): number {
	switch (state.phase) {
		case 'inhale':
			return -1 + state.easedProgress * 0.5; // -1 to -0.5
		case 'hold-full':
			return -0.5 + state.phaseProgress * 0.5; // -0.5 to 0
		case 'exhale':
			return state.easedProgress; // 0 to 1
		case 'hold-empty':
			return 1 - state.phaseProgress * 0.5; // 1 to 0.5
		default:
			return 0;
	}
}

/**
 * Check if we just entered a new phase (for word triggering)
 */
export function isPhaseStart(
	currentPhase: PhaseType,
	prevPhase: PhaseType | null,
): boolean {
	return currentPhase !== prevPhase;
}

/**
 * Count completed inhales in session
 */
export function countInhales(
	sessionStartTime: number,
	preset: BreathPreset = BREATH_PRESETS.box,
): number {
	const elapsed = (Date.now() - sessionStartTime) / 1000;
	return Math.floor(elapsed / preset.total);
}
