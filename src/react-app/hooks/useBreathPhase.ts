/**
 * Hook for UTC-synchronized breathing with eased progress
 * Provides phase information with bezier-eased progress values
 */
import { useEffect, useRef, useState } from 'react';
import {
	BREATH_PRESETS,
	type BreathState,
	getBreathPhase,
	type PresetId,
} from '../core/breath';

/**
 * Hook that provides UTC-synchronized breathing state with easing
 * All users worldwide see the same breath phase at the same moment
 *
 * Uses requestAnimationFrame for smooth 60fps updates
 */
export function useBreathPhase(presetId: PresetId = 'box'): BreathState {
	const [breathState, setBreathState] = useState<BreathState>(() => {
		const preset = BREATH_PRESETS[presetId];
		return getBreathPhase(preset);
	});

	const rafRef = useRef<number>(0);
	const prevPhaseRef = useRef<string>(breathState.phase);

	useEffect(() => {
		const preset = BREATH_PRESETS[presetId];

		const updateBreath = () => {
			const newState = getBreathPhase(preset);

			// Only update if values have changed meaningfully
			// This helps reduce re-renders
			setBreathState((prev) => {
				// Always update if phase changed
				if (newState.phase !== prev.phase) {
					prevPhaseRef.current = newState.phase;
					return newState;
				}

				// Update if progress changed by more than threshold
				const progressDelta = Math.abs(
					newState.phaseProgress - prev.phaseProgress,
				);
				if (progressDelta > 0.001) {
					return newState;
				}

				return prev;
			});

			rafRef.current = requestAnimationFrame(updateBreath);
		};

		rafRef.current = requestAnimationFrame(updateBreath);

		return () => cancelAnimationFrame(rafRef.current);
	}, [presetId]);

	return breathState;
}

/**
 * Track inhale count for word trigger logic
 */
export function useInhaleTracker(breathState: BreathState): number {
	const [inhaleCount, setInhaleCount] = useState(0);
	const prevPhaseRef = useRef<string>(breathState.phase);

	useEffect(() => {
		// Increment counter when entering inhale phase
		if (breathState.phase === 'inhale' && prevPhaseRef.current !== 'inhale') {
			setInhaleCount((c) => c + 1);
		}
		prevPhaseRef.current = breathState.phase;
	}, [breathState.phase]);

	return inhaleCount;
}
