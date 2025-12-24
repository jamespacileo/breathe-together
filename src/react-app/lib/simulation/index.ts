// Configuration and types
export {
	AVATAR_IDS,
	type AvatarId,
	DEFAULT_MOOD_DISTRIBUTION,
	DEFAULT_SIMULATION_CONFIG,
	MOOD_IDS,
	type MoodDistribution,
	type MoodId,
	normalizeMoodDistribution,
	parseSimulationConfig,
	type SimulationConfig,
	SimulationConfigSchema,
	selectMoodByDistribution,
	selectRandomAvatar,
} from './config';
// Simulation engine
export {
	getSimulationEngine,
	resetSimulationEngine,
	SimulationEngine,
} from './engine';
// Types
export type {
	PopulationSnapshot,
	PopulationUpdateCallback,
	SimulatedUser,
} from './types';
// User generation
export {
	formatUserDisplay,
	generateUser,
	getTimeRemaining,
	sampleExponential,
	shouldDepart,
} from './users';
