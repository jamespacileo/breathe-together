import { z } from 'zod';
import {
	AVATAR_IDS,
	type AvatarId,
	MOOD_IDS,
	type MoodId,
} from '../../shared/constants';

// Re-export for backward compatibility
export { AVATAR_IDS, type AvatarId, MOOD_IDS, type MoodId };

/**
 * Mood distribution schema - weights for each mood type
 * Weights are normalized to sum to 1.0 when used
 */
const MoodDistributionSchema = z.object({
	moment: z.number().min(0).max(1),
	anxious: z.number().min(0).max(1),
	processing: z.number().min(0).max(1),
	preparing: z.number().min(0).max(1),
	grateful: z.number().min(0).max(1),
	celebrating: z.number().min(0).max(1),
	here: z.number().min(0).max(1),
});

export type MoodDistribution = z.infer<typeof MoodDistributionSchema>;

/**
 * Simulation configuration schema
 */
export const SimulationConfigSchema = z.object({
	/** Whether simulation is active */
	enabled: z.boolean(),

	/** Target equilibrium user count */
	targetPopulation: z.number().min(1).max(500),

	/** Average session length in milliseconds */
	meanStayDuration: z.number().min(10000).max(600000), // 10s - 10min

	/** How often to tick simulation in milliseconds */
	updateInterval: z.number().min(100).max(5000),

	/** Mood distribution weights (will be normalized) */
	moodDistribution: MoodDistributionSchema,

	/** Time scale factor for testing (1 = real time, 10 = 10x faster) */
	timeScale: z.number().min(0.1).max(100),
});

export type SimulationConfig = z.infer<typeof SimulationConfigSchema>;

/**
 * Default mood distribution - roughly balanced with realistic proportions
 */
export const DEFAULT_MOOD_DISTRIBUTION: MoodDistribution = {
	moment: 0.25, // 25% taking a moment
	anxious: 0.12, // 12% anxious
	processing: 0.15, // 15% processing
	preparing: 0.1, // 10% preparing
	grateful: 0.18, // 18% grateful
	celebrating: 0.05, // 5% celebrating
	here: 0.15, // 15% just here
};

/**
 * Default simulation configuration
 */
export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
	enabled: true,
	targetPopulation: 50,
	meanStayDuration: 180000, // 3 minutes
	updateInterval: 1000, // 1 second ticks
	moodDistribution: DEFAULT_MOOD_DISTRIBUTION,
	timeScale: 1,
};

/**
 * Normalize mood distribution weights to sum to 1.0
 */
export function normalizeMoodDistribution(
	dist: MoodDistribution,
): MoodDistribution {
	const total = Object.values(dist).reduce((sum, v) => sum + v, 0);
	if (total === 0) return DEFAULT_MOOD_DISTRIBUTION;

	return {
		moment: dist.moment / total,
		anxious: dist.anxious / total,
		processing: dist.processing / total,
		preparing: dist.preparing / total,
		grateful: dist.grateful / total,
		celebrating: dist.celebrating / total,
		here: dist.here / total,
	};
}

/**
 * Select a mood based on weighted distribution
 */
export function selectMoodByDistribution(dist: MoodDistribution): MoodId {
	const normalized = normalizeMoodDistribution(dist);
	const rand = Math.random();
	let cumulative = 0;

	for (const moodId of MOOD_IDS) {
		cumulative += normalized[moodId];
		if (rand < cumulative) {
			return moodId;
		}
	}

	return 'here'; // Fallback
}

/**
 * Select a random avatar
 */
export function selectRandomAvatar(): AvatarId {
	return AVATAR_IDS[Math.floor(Math.random() * AVATAR_IDS.length)];
}

/**
 * Parse and validate simulation config
 */
export function parseSimulationConfig(input: unknown): SimulationConfig {
	const result = SimulationConfigSchema.safeParse(input);
	if (result.success) return result.data;
	return DEFAULT_SIMULATION_CONFIG;
}
