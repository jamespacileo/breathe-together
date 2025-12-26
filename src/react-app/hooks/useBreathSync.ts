import { useEffect, useRef, useState } from 'react';
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
 *
 * For UI components - triggers re-renders on state changes.
 * For 3D components using useFrame, use getBreathState() from lib/breathUtils instead.
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

	const rafRef = useRef<number>(0);

	useEffect(() => {
		const updateBreath = () => {
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
	}, [patternId]);

	return breathState;
}
