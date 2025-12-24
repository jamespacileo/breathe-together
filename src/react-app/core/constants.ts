/**
 * Core constants for the 50K particle breathing visualization
 */

// Particle counts
export const TOTAL_PARTICLES = 50000;
export const FBO_SIZE = 256; // 256×256 = 65,536 capacity (enough for 50K)
export const FBO_CAPACITY = FBO_SIZE * FBO_SIZE;

// Particle types stored in texture alpha channel
export const PARTICLE_TYPES = {
	SCAFFOLD: 0,
	USER_SAPPHIRE: 1,
	USER_EMERALD: 2,
	USER_RUBY: 3,
	USER_AMETHYST: 4,
	USER_TOPAZ: 5,
	WORD_RECRUITED: 6,
} as const;

export type ParticleType = (typeof PARTICLE_TYPES)[keyof typeof PARTICLE_TYPES];

// Color palette - jewel tones per spec
export const PALETTE = {
	scaffold: '#1a2a4a', // Faint desaturated blue
	sapphire: '#2D5A9B',
	emerald: '#1B8F6A',
	ruby: '#C41E3A',
	amethyst: '#7B3F9E',
	topaz: '#D4A017',
} as const;

// Palette as array for uniform (index matches PARTICLE_TYPES)
export const PALETTE_ARRAY = [
	PALETTE.scaffold,
	PALETTE.sapphire,
	PALETTE.emerald,
	PALETTE.ruby,
	PALETTE.amethyst,
	PALETTE.topaz,
];

// Sphere configuration
export const SPHERE_CONFIG = {
	baseRadius: 1.0,
	breathDepth: 0.3, // How much sphere contracts/expands
} as const;

// Breathing pattern timing (in seconds)
export const BREATH_PRESETS = {
	box: {
		inhale: 4,
		holdFull: 4,
		exhale: 4,
		holdEmpty: 4,
		total: 16,
	},
	diaphragmatic: {
		inhale: 4,
		holdFull: 0,
		exhale: 6,
		holdEmpty: 0,
		total: 10,
	},
	relaxing: {
		inhale: 4,
		holdFull: 7,
		exhale: 8,
		holdEmpty: 0,
		total: 19,
	},
} as const;

export type BreathPresetId = keyof typeof BREATH_PRESETS;

// Word formation
export const WORD_CONFIG = {
	minGapInhales: 2, // Minimum inhales between words
	baseProbability: 0.1, // 10% at session start
	maxProbability: 0.25, // 25% after settling
	rampDuration: 120, // Seconds to reach max probability
	particlesPerWord: 100, // Approximate particles for word formation
	maxParticlesPerWord: 300,
} as const;

// Performance targets
export const PERFORMANCE = {
	targetFps: 60,
	initialLoadMs: 500,
	drawCalls: 1, // Single Points mesh
} as const;
