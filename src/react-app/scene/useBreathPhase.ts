/**
 * React hook for breath phase with UTC sync
 * Returns current phase, progress, and eased values
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getBreathPhase } from '../core/breath/breathPhase';
import { applyEasing } from '../core/breath/easingCurves';
import type { BreathState } from '../core/types';

export interface UseBreathPhaseOptions {
	presetId?: string;
	enabled?: boolean;
}

export function useBreathPhase(
	options: UseBreathPhaseOptions = {},
): BreathState {
	const { presetId = 'box', enabled = true } = options;

	const [state, setState] = useState<BreathState>(() =>
		getBreathPhase(presetId, applyEasing),
	);

	const rafRef = useRef<number>(0);
	const lastPhaseRef = useRef<string>('');

	const update = useCallback(() => {
		const newState = getBreathPhase(presetId, applyEasing);
		setState(newState);

		// Track phase changes for word trigger
		if (newState.phase !== lastPhaseRef.current) {
			lastPhaseRef.current = newState.phase;
		}

		rafRef.current = requestAnimationFrame(update);
	}, [presetId]);

	useEffect(() => {
		if (!enabled) return;

		rafRef.current = requestAnimationFrame(update);

		return () => {
			if (rafRef.current) {
				cancelAnimationFrame(rafRef.current);
			}
		};
	}, [enabled, update]);

	return state;
}

/**
 * Get temperature shift based on breath phase
 * Cool during inhale, warm during exhale
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
