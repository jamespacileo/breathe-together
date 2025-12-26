/**
 * useBreathSync Hook
 *
 * Provides breathing state from Theatre.js for React UI components.
 * This hook triggers React re-renders, unlike the ref-based 3D hooks.
 *
 * Used for:
 * - Phase name display
 * - Progress bar
 * - Other UI elements that need breath state
 */

import { useEffect, useState } from 'react';
import { breathCycleObj } from '../lib/theatre';

/**
 * Breathing phase names
 */
export type BreathPhase = 'in' | 'hold-in' | 'out' | 'hold-out';

/**
 * Breath state for UI components
 */
export interface BreathState {
	phase: BreathPhase;
	progress: number;
	cycleProgress: number;
	phaseName: string;
}

/**
 * Map phaseType number to phase name
 */
const PHASE_NAMES: Record<number, { phase: BreathPhase; name: string }> = {
	0: { phase: 'in', name: 'Breathe In' },
	1: { phase: 'hold-in', name: 'Hold' },
	2: { phase: 'out', name: 'Breathe Out' },
	3: { phase: 'hold-out', name: 'Rest' },
};

/**
 * Hook to get breathing state for UI components
 *
 * This subscribes to Theatre.js breathCycle object and triggers
 * React re-renders when values change (throttled for performance).
 *
 * @param _pattern - Unused, kept for API compatibility
 */
export function useBreathSync(_pattern?: unknown): BreathState {
	const [state, setState] = useState<BreathState>({
		phase: 'in',
		progress: 0,
		cycleProgress: 0,
		phaseName: 'Breathe In',
	});

	useEffect(() => {
		let lastPhaseType = -1;
		let lastProgress = 0;
		let frameId: number;

		const update = () => {
			const values = breathCycleObj.value;
			const phaseType = Math.floor(values.phaseType) as 0 | 1 | 2 | 3;
			const progress = values.rawProgress;

			// Only update state if significant change (throttle re-renders)
			const phaseChanged = phaseType !== lastPhaseType;
			const progressChanged = Math.abs(progress - lastProgress) > 0.01;

			if (phaseChanged || progressChanged) {
				lastPhaseType = phaseType;
				lastProgress = progress;

				const phaseInfo = PHASE_NAMES[phaseType] || PHASE_NAMES[0];

				setState({
					phase: phaseInfo.phase,
					progress,
					cycleProgress: (phaseType + progress) / 4,
					phaseName: phaseInfo.name,
				});
			}

			frameId = requestAnimationFrame(update);
		};

		frameId = requestAnimationFrame(update);

		return () => {
			cancelAnimationFrame(frameId);
		};
	}, []);

	return state;
}
