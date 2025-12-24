/**
 * UTC-synchronized breath phase calculation
 * All users worldwide see identical animation at the same moment
 */

import {
	applyEasing,
	getTemperatureShift,
	type PhaseType,
} from './easingCurves';
import type { BreathPreset } from './presets';

export interface BreathState {
	phase: PhaseType;
	phaseType: number; // 0=inhale, 1=hold-full, 2=exhale, 3=hold-empty
	phaseProgress: number; // 0-1 within current phase (raw)
	easedProgress: number; // 0-1 with easing applied
	cycleProgress: number; // 0-1 within entire cycle
	temperature: number; // -1 (cool) to +1 (warm)
}

/**
 * Get the current breath phase based on UTC time
 */
export function getBreathPhase(preset: BreathPreset): BreathState {
	const { inhale, holdFull, exhale, holdEmpty, totalDuration } = preset;
	const cycleLength = totalDuration * 1000; // ms
	const msInCycle = Date.now() % cycleLength;
	const secondsInCycle = msInCycle / 1000;

	let phase: PhaseType;
	let phaseType: number;
	let phaseProgress: number;

	if (secondsInCycle < inhale) {
		// Inhale phase
		phase = 'inhale';
		phaseType = 0;
		phaseProgress = inhale > 0 ? secondsInCycle / inhale : 0;
	} else if (secondsInCycle < inhale + holdFull) {
		// Hold after inhale
		phase = 'hold-full';
		phaseType = 1;
		phaseProgress = holdFull > 0 ? (secondsInCycle - inhale) / holdFull : 0;
	} else if (secondsInCycle < inhale + holdFull + exhale) {
		// Exhale phase
		phase = 'exhale';
		phaseType = 2;
		phaseProgress =
			exhale > 0 ? (secondsInCycle - inhale - holdFull) / exhale : 0;
	} else {
		// Hold after exhale
		phase = 'hold-empty';
		phaseType = 3;
		phaseProgress =
			holdEmpty > 0
				? (secondsInCycle - inhale - holdFull - exhale) / holdEmpty
				: 0;
	}

	// Clamp progress to valid range
	phaseProgress = Math.min(1, Math.max(0, phaseProgress));

	const easedProgress = applyEasing(phase, phaseProgress);
	const cycleProgress = secondsInCycle / totalDuration;
	const temperature = getTemperatureShift(phase, phaseProgress);

	return {
		phase,
		phaseType,
		phaseProgress,
		easedProgress,
		cycleProgress,
		temperature,
	};
}

/**
 * Get the sphere radius based on breath state
 * Inhale: contracts toward center
 * Exhale: expands outward
 */
export function getSphereRadius(
	breathState: BreathState,
	baseRadius: number,
	breathDepth: number,
): number {
	const { phase, easedProgress } = breathState;

	switch (phase) {
		case 'inhale':
			// Contract toward center as we inhale
			return baseRadius - breathDepth * easedProgress;
		case 'hold-full':
			// Stay contracted
			return baseRadius - breathDepth;
		case 'exhale':
			// Expand outward as we exhale
			return baseRadius - breathDepth + breathDepth * easedProgress;
		case 'hold-empty':
			// Stay expanded
			return baseRadius;
		default:
			return baseRadius;
	}
}

export type { PhaseType };
