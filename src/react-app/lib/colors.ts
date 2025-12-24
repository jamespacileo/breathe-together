import chroma from 'chroma-js';

/**
 * Color utility functions using Chroma.js
 * For identity-related colors (moods, avatars), see identity.ts
 */

// Re-export identity items for backwards compatibility
export {
	AVATARS,
	type AvatarConfig,
	BASE_COLORS,
	getAvatarGradient,
	getMoodColor,
	MOODS,
	type MoodConfig,
} from './identity';

/**
 * Convert hex to RGB values (0-1 range for WebGL)
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
	try {
		const [r, g, b] = chroma(hex).gl();
		return { r, g, b };
	} catch {
		return { r: 0.5, g: 0.7, b: 0.76 };
	}
}

/**
 * Convert hex to RGBA string with alpha
 */
export function hexToRgba(hex: string, alpha: number): string {
	try {
		return chroma(hex).alpha(alpha).css();
	} catch {
		return `rgba(128, 179, 194, ${alpha})`;
	}
}

/**
 * Interpolate between two colors (useful for breathing transitions)
 */
export function lerpColor(color1: string, color2: string, t: number): string {
	return chroma.mix(color1, color2, t, 'lab').hex();
}

/**
 * Create a color scale for gradients
 */
export function createColorScale(
	colors: string[],
	steps: number = 10,
): string[] {
	return chroma.scale(colors).mode('lab').colors(steps);
}

/**
 * Lighten a color by a percentage (0-1)
 */
export function lighten(color: string, amount: number): string {
	return chroma(color)
		.brighten(amount * 3)
		.hex();
}

/**
 * Darken a color by a percentage (0-1)
 */
export function darken(color: string, amount: number): string {
	return chroma(color)
		.darken(amount * 3)
		.hex();
}

/**
 * Check if a color has sufficient contrast against another
 */
export function hasContrast(
	foreground: string,
	background: string,
	minRatio = 4.5,
): boolean {
	return chroma.contrast(foreground, background) >= minRatio;
}

/**
 * Get a contrasting text color (white or black) for a background
 */
export function getContrastingText(background: string): string {
	return chroma(background).luminance() > 0.5 ? '#000000' : '#ffffff';
}
