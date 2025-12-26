import { create } from 'zustand';
import {
	getCurrentPhase,
	PATTERNS,
	type PatternId,
	type PhaseType,
} from '../lib/patterns';

export interface BreathState {
	phase: PhaseType;
	phaseName: string;
	progress: number;
	cycleProgress: number;
	phaseIndex: number;
}

interface BreathStore {
	state: BreathState;
	update: (patternId: PatternId) => void;
}

/**
 * Non-reactive store for breath state to avoid React re-renders on every frame.
 * Components can subscribe to specific changes or read the state in useFrame.
 */
export const useBreathStore = create<BreathStore>((set) => ({
	state: {
		phase: 'hold-out',
		phaseName: 'Hold',
		progress: 0,
		cycleProgress: 0,
		phaseIndex: 0,
	},
	update: (patternId) => {
		const pattern = PATTERNS[patternId];
		const { phase, phaseIndex, progress, cycleProgress } = getCurrentPhase(pattern);
		set({
			state: {
				phase: phase.type,
				phaseName: phase.name,
				progress,
				cycleProgress,
				phaseIndex,
			},
		});
	},
}));

/**
 * Helper to get the current breath state without subscribing to changes.
 * Useful for useFrame loops.
 */
export const getBreathState = () => useBreathStore.getState().state;
