import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PatternId } from '../lib/patterns';
import {
	DEFAULT_SIMULATION_CONFIG,
	type MoodId,
	type SimulationConfig,
} from '../lib/simulationConfig';

export interface UserIdentity {
	name: string;
	avatar: string;
	mood: MoodId | ''; // Empty string for unset mood
	moodDetail: string;
}

interface AppState {
	// User identity
	user: UserIdentity | null;
	setUser: (user: UserIdentity) => void;

	// Breathing pattern
	pattern: PatternId;
	setPattern: (pattern: PatternId) => void;

	// UI state
	showIdentity: boolean;
	setShowIdentity: (show: boolean) => void;

	// Simulation config
	simulationConfig: SimulationConfig;
	updateSimulationConfig: (updates: Partial<SimulationConfig>) => void;
}

export const useAppStore = create<AppState>()(
	persist(
		(set) => ({
			// User identity
			user: null,
			setUser: (user) => set({ user }),

			// Breathing pattern
			pattern: 'box',
			setPattern: (pattern) => set({ pattern }),

			// UI state
			showIdentity: false,
			setShowIdentity: (showIdentity) => set({ showIdentity }),

			// Simulation config
			simulationConfig: DEFAULT_SIMULATION_CONFIG,
			updateSimulationConfig: (updates) =>
				set((state) => ({
					simulationConfig: { ...state.simulationConfig, ...updates },
				})),
		}),
		{
			name: 'breathe-together-storage',
			partialize: (state) => ({
				user: state.user,
				pattern: state.pattern,
				simulationConfig: state.simulationConfig,
			}),
			// Merge persisted state with defaults to handle missing fields from old localStorage
			merge: (persistedState, currentState) => {
				const persisted = persistedState as Partial<AppState>;
				return {
					...currentState,
					...persisted,
					simulationConfig: {
						...DEFAULT_SIMULATION_CONFIG,
						...(persisted.simulationConfig || {}),
					},
				};
			},
		},
	),
);
