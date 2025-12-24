import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
	DEFAULT_CONFIG,
	updateConfig,
	type VisualizationConfig,
} from '../lib/config';
import type { PatternId } from '../lib/patterns';
import {
	DEFAULT_SIMULATION_CONFIG,
	type MoodDistribution,
	type MoodId,
	type SimulationConfig,
} from '../lib/simulationConfig';

export interface UserIdentity {
	name: string;
	avatar: string;
	mood: MoodId | '';
	moodDetail: string;
}

interface AppState {
	// User identity
	user: UserIdentity | null;
	setUser: (user: UserIdentity) => void;
	clearUser: () => void;

	// Visualization config
	config: VisualizationConfig;
	setConfig: (config: VisualizationConfig) => void;
	updateConfigPartial: (updates: Partial<VisualizationConfig>) => void;
	resetConfig: () => void;

	// Breathing pattern
	pattern: PatternId;
	setPattern: (pattern: PatternId) => void;

	// UI state
	showDebug: boolean;
	setShowDebug: (show: boolean) => void;
	toggleDebug: () => void;

	showIdentity: boolean;
	setShowIdentity: (show: boolean) => void;

	// Simulation config
	simulationConfig: SimulationConfig;
	setSimulationConfig: (config: SimulationConfig) => void;
	updateSimulationConfig: (updates: Partial<SimulationConfig>) => void;
	setSimulationEnabled: (enabled: boolean) => void;
	setTargetPopulation: (target: number) => void;
	setMeanStayDuration: (duration: number) => void;
	setTimeScale: (scale: number) => void;
	setMoodDistribution: (distribution: MoodDistribution) => void;
	resetSimulationConfig: () => void;
}

export const useAppStore = create<AppState>()(
	persist(
		(set, get) => ({
			// User identity
			user: null,
			setUser: (user) => set({ user }),
			clearUser: () => set({ user: null }),

			// Visualization config
			config: DEFAULT_CONFIG,
			setConfig: (config) => set({ config }),
			updateConfigPartial: (updates) => {
				const current = get().config;
				set({ config: updateConfig(current, updates) });
			},
			resetConfig: () => set({ config: DEFAULT_CONFIG }),

			// Breathing pattern
			pattern: 'box',
			setPattern: (pattern) => set({ pattern }),

			// UI state
			showDebug: false,
			setShowDebug: (showDebug) => set({ showDebug }),
			toggleDebug: () => set((state) => ({ showDebug: !state.showDebug })),

			showIdentity: false,
			setShowIdentity: (showIdentity) => set({ showIdentity }),

			// Simulation config
			simulationConfig: DEFAULT_SIMULATION_CONFIG,
			setSimulationConfig: (simulationConfig) => set({ simulationConfig }),
			updateSimulationConfig: (updates) =>
				set((state) => ({
					simulationConfig: { ...state.simulationConfig, ...updates },
				})),
			setSimulationEnabled: (enabled) =>
				set((state) => ({
					simulationConfig: { ...state.simulationConfig, enabled },
				})),
			setTargetPopulation: (targetPopulation) =>
				set((state) => ({
					simulationConfig: { ...state.simulationConfig, targetPopulation },
				})),
			setMeanStayDuration: (meanStayDuration) =>
				set((state) => ({
					simulationConfig: { ...state.simulationConfig, meanStayDuration },
				})),
			setTimeScale: (timeScale) =>
				set((state) => ({
					simulationConfig: { ...state.simulationConfig, timeScale },
				})),
			setMoodDistribution: (moodDistribution) =>
				set((state) => ({
					simulationConfig: { ...state.simulationConfig, moodDistribution },
				})),
			resetSimulationConfig: () =>
				set({ simulationConfig: DEFAULT_SIMULATION_CONFIG }),
		}),
		{
			name: 'breathe-together-storage',
			partialize: (state) => ({
				user: state.user,
				config: state.config,
				pattern: state.pattern,
				simulationConfig: state.simulationConfig,
			}),
		},
	),
);

// ============================================================================
// SELECTORS - simplified for new config structure
// ============================================================================

export const selectMoodColor = (state: AppState) => {
	const moodId = state.user?.mood;
	if (!moodId) return '#7EB5C1';
	return moodId;
};

export const selectSphereConfig = (state: AppState) => ({
	sphereContractedRadius: state.config.sphereContractedRadius,
	sphereExpandedRadius: state.config.sphereExpandedRadius,
	particleBrightness: state.config.particleBrightness,
	particleSize: state.config.particleSize,
	noiseStrength: state.config.noiseStrength,
	rotationSpeed: state.config.rotationSpeed,
});

export const selectColorConfig = (state: AppState) => ({
	backgroundColor: state.config.backgroundColor,
	primaryColor: state.config.primaryColor,
});

export const selectSimulationState = (state: AppState) => ({
	enabled: state.simulationConfig.enabled,
	targetPopulation: state.simulationConfig.targetPopulation,
	timeScale: state.simulationConfig.timeScale,
});

export const selectUIState = (state: AppState) => ({
	showDebug: state.showDebug,
	showIdentity: state.showIdentity,
});

export const selectUser = (state: AppState) => state.user;
export const selectPattern = (state: AppState) => state.pattern;
