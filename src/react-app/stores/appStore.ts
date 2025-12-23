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
	mood: MoodId | ''; // Empty string for unset mood
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
// SELECTORS
// Use these to subscribe to specific slices of state for better performance
// Components using selectors only re-render when their slice changes
// ============================================================================

/**
 * Select user's mood ID for color computation
 */
export const selectMoodColor = (state: AppState) => {
	const moodId = state.user?.mood;
	if (!moodId) return '#7EB5C1'; // BASE_COLORS.primary
	// We'll integrate with getMoodColor from colors.ts in components
	return moodId;
};

/**
 * Select breathing-related config properties
 * Used by useBreathingSpring and calculateTargetScale
 */
export const selectBreathingConfig = (state: AppState) => ({
	breatheInScale: state.config.breatheInScale,
	breatheOutScale: state.config.breatheOutScale,
	holdOscillation: state.config.holdOscillation,
	holdOscillationSpeed: state.config.holdOscillationSpeed,
	mainSpringTension: state.config.mainSpringTension,
	mainSpringFriction: state.config.mainSpringFriction,
});

/**
 * Select 3D sphere config properties
 * Used by BreathingSphere and related components
 */
export const selectSphereConfig = (state: AppState) => ({
	nebulaEnabled: state.config.nebulaEnabled,
	sphereContractedRadius: state.config.sphereContractedRadius,
	sphereExpandedRadius: state.config.sphereExpandedRadius,
	sphereRotationSpeed: state.config.sphereRotationSpeed,
	connectionEnabled: state.config.connectionEnabled,
	connectionDistance: state.config.connectionDistance,
	connectionOpacity: state.config.connectionOpacity,
	hazeEnabled: state.config.hazeEnabled,
	hazeOpacity: state.config.hazeOpacity,
});

/**
 * Select visual effects config properties
 * Used by colors and post-processing
 */
export const selectVisualEffectsConfig = (state: AppState) => ({
	backgroundColor: state.config.backgroundColor,
	backgroundColorMid: state.config.backgroundColorMid,
	primaryColor: state.config.primaryColor,
	bloomEnabled: state.config.bloomEnabled,
	bloomStrength: state.config.bloomStrength,
	bloomThreshold: state.config.bloomThreshold,
	bloomRadius: state.config.bloomRadius,
});

/**
 * Select simulation running state
 */
export const selectSimulationState = (state: AppState) => ({
	enabled: state.simulationConfig.enabled,
	targetPopulation: state.simulationConfig.targetPopulation,
	timeScale: state.simulationConfig.timeScale,
});

/**
 * Select UI visibility state
 */
export const selectUIState = (state: AppState) => ({
	showDebug: state.showDebug,
	showIdentity: state.showIdentity,
});

/**
 * Select current user
 */
export const selectUser = (state: AppState) => state.user;

/**
 * Select current breathing pattern
 */
export const selectPattern = (state: AppState) => state.pattern;
