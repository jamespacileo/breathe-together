import { useEffect, useRef, useState } from 'react';
import {
	getCurrentPhase,
	PATTERNS,
	type PatternId,
	type PhaseType,
} from '../lib/patterns';
import { useBreathStore } from '../stores/breathStore';

export interface BreathState {
	phase: PhaseType;
	phaseName: string;
	progress: number; // 0-1 within current phase
	cycleProgress: number; // 0-1 within entire cycle
	phaseIndex: number;
}

/**
 * Hook that provides UTC-synchronized breathing state
 * All users worldwide see the same breath phase at the same moment
 *
 * Updates both a reactive state (for UI) and a non-reactive store (for 3D).
 */
export function useBreathSync(patternId: PatternId = 'box'): BreathState {
	const updateStore = useBreathStore((state) => state.update);

	const [breathState, setBreathState] = useState<BreathState>(() => {
		const pattern = PATTERNS[patternId];
		const { phase, phaseIndex, progress, cycleProgress } =
			getCurrentPhase(pattern);
		return {
			phase: phase.type,
			phaseName: phase.name,
			progress,
			cycleProgress,
			phaseIndex,
		};
	});

	const rafRef = useRef<number>(0);

	useEffect(() => {
		const updateBreath = () => {
			// Update non-reactive store for 3D scene (no re-render)
			updateStore(patternId);

			// Update reactive state for UI (triggers re-render)
			const pattern = PATTERNS[patternId];
			const { phase, phaseIndex, progress, cycleProgress } =
				getCurrentPhase(pattern);

			setBreathState({
				phase: phase.type,
				phaseName: phase.name,
				progress,
				cycleProgress,
				phaseIndex,
			});

			rafRef.current = requestAnimationFrame(updateBreath);
		};

		// Start the animation loop
		rafRef.current = requestAnimationFrame(updateBreath);

		return () => cancelAnimationFrame(rafRef.current);
	}, [patternId, updateStore]);

	return breathState;
}
