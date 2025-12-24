/**
 * Particle system constants and color palette
 */

// Particle counts
export const TOTAL_PARTICLES = 50000;
export const FBO_SIZE = 256; // 256×256 = 65536 capacity (enough for 50K)

// Timing
export const WORD_MIN_GAP = 2; // Minimum inhales between words
export const WORD_BASE_PROBABILITY = 0.1; // 10% at session start
export const WORD_MAX_PROBABILITY = 0.25; // 25% after settling

// Sphere dimensions
export const BASE_SPHERE_RADIUS = 1.0;
export const BREATH_DEPTH = 0.3; // How much sphere contracts/expands

// Jewel tone color palette
export const PALETTE = {
	scaffold: '#1a2a4a', // Faint desaturated blue
	sapphire: '#2D5A9B', // User color 1
	emerald: '#1B8F6A', // User color 2
	ruby: '#C41E3A', // User color 3
	amethyst: '#7B3F9E', // User color 4
	topaz: '#D4A017', // User color 5
} as const;

export type PaletteColor = keyof typeof PALETTE;
export type UserColor = Exclude<PaletteColor, 'scaffold'>;

// Color indices for shader uniforms
// 0 = scaffold, 1-5 = user colors
export const COLOR_INDICES = {
	scaffold: 0,
	sapphire: 1,
	emerald: 2,
	ruby: 3,
	amethyst: 4,
	topaz: 5,
} as const;

// Convert hex color to RGB vector [0-1]
export function hexToVec3(hex: string): [number, number, number] {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!result) return [0, 0, 0];
	return [
		Number.parseInt(result[1], 16) / 255,
		Number.parseInt(result[2], 16) / 255,
		Number.parseInt(result[3], 16) / 255,
	];
}

// Uniform array for shader (index 0 = scaffold, 1-5 = user colors)
export function getPaletteUniform(): number[] {
	const colors = [
		hexToVec3(PALETTE.scaffold),
		hexToVec3(PALETTE.sapphire),
		hexToVec3(PALETTE.emerald),
		hexToVec3(PALETTE.ruby),
		hexToVec3(PALETTE.amethyst),
		hexToVec3(PALETTE.topaz),
	];
	return colors.flat();
}
