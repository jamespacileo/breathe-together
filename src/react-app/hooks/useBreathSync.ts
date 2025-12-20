import { useEffect, useState } from 'react';
import {
	getCurrentPhase,
	PATTERNS,
	type PatternId,
	type PhaseType,
} from '../lib/patterns';

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
 */
export function useBreathSync(patternId: PatternId = 'box'): BreathState {
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

	useEffect(() => {
		const pattern = PATTERNS[patternId];

		const updateBreath = () => {
			const { phase, phaseIndex, progress, cycleProgress } =
				getCurrentPhase(pattern);
			setBreathState({
				phase: phase.type,
				phaseName: phase.name,
				progress,
				cycleProgress,
				phaseIndex,
			});
		};

		// Update at 60fps for smooth animations
		const interval = setInterval(updateBreath, 16);
		updateBreath();

		return () => clearInterval(interval);
	}, [patternId]);

	return breathState;
}
