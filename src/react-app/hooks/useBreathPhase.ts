/**
 * Hook for UTC-synchronized breath phase
 * Uses new core/breath utilities
 */

import { useEffect, useRef, useState } from 'react';
import {
	type BreathPresetId,
	type BreathState,
	getBreathPhase,
	getTemperatureShift,
} from '../core';

export interface EnhancedBreathState extends BreathState {
	temperatureShift: number;
}

/**
 * Hook that provides UTC-synchronized breathing state
 * All users worldwide see the same breath phase at the same moment
 */
export function useBreathPhase(
	presetId: BreathPresetId = 'box',
): EnhancedBreathState {
	const [state, setState] = useState<EnhancedBreathState>(() => {
		const breathState = getBreathPhase(presetId);
		return {
			...breathState,
			temperatureShift: getTemperatureShift(breathState),
		};
	});

	const rafRef = useRef<number>(0);

	useEffect(() => {
		const update = () => {
			const breathState = getBreathPhase(presetId);
			setState({
				...breathState,
				temperatureShift: getTemperatureShift(breathState),
			});
			rafRef.current = requestAnimationFrame(update);
		};

		rafRef.current = requestAnimationFrame(update);

		return () => cancelAnimationFrame(rafRef.current);
	}, [presetId]);

	return state;
}
