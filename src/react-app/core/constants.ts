/**
 * Core constants for the 50K particle breathing visualization
 */

// Particle counts
export const TOTAL_PARTICLES = 50000;
export const TEXTURE_SIZE = 256; // 256x256 = 65,536 capacity (enough for 50K)

// Particle types
export const PARTICLE_TYPE = {
	SCAFFOLD: 0,
	USER_SAPPHIRE: 1,
	USER_EMERALD: 2,
	USER_RUBY: 3,
	USER_AMETHYST: 4,
	USER_TOPAZ: 5,
	WORD_RECRUITED: 6,
} as const;

export type ParticleType = (typeof PARTICLE_TYPE)[keyof typeof PARTICLE_TYPE];

// Color palette - jewel tones for users, faint blue for scaffold
export const PALETTE = {
	scaffold: '#1a2a4a',
	sapphire: '#2D5A9B',
	emerald: '#1B8F6A',
	ruby: '#C41E3A',
	amethyst: '#7B3F9E',
	topaz: '#D4A017',
} as const;

// Convert hex to RGB array (0-1 range)
export function hexToRGB(hex: string): [number, number, number] {
	const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
	const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
	const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
	return [r, g, b];
}

// Palette as RGB arrays for shader uniforms
export const PALETTE_RGB = {
	scaffold: hexToRGB(PALETTE.scaffold),
	sapphire: hexToRGB(PALETTE.sapphire),
	emerald: hexToRGB(PALETTE.emerald),
	ruby: hexToRGB(PALETTE.ruby),
	amethyst: hexToRGB(PALETTE.amethyst),
	topaz: hexToRGB(PALETTE.topaz),
} as const;

// Sphere parameters
export const SPHERE = {
	BASE_RADIUS: 1.0,
	BREATH_DEPTH: 0.3, // How much the sphere contracts/expands
	CAMERA_DISTANCE: 4,
	FOV: 50,
} as const;

// Timing
export const TIMING = {
	SPARK_DECAY_RATE: 3.0, // How fast spark effect fades
	WORD_DURATION: 4000, // How long words display (ms)
	WORD_FADE_IN: 800, // Word fade in duration (ms)
	WORD_FADE_OUT: 600, // Word fade out duration (ms)
} as const;

// Word system
export const WORD_SYSTEM = {
	MIN_GAP_INHALES: 2, // Minimum inhales between words
	BASE_PROBABILITY: 0.1, // 10% at session start
	MAX_PROBABILITY: 0.25, // 25% after settling
	RAMP_DURATION: 120, // Seconds to reach max probability
} as const;
