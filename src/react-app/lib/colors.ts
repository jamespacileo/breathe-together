import chroma from 'chroma-js';
import type { MoodId } from './simulationConfig';

/**
 * Color palettes and mood configurations
 * PlayStation + Apple inspired design system
 */

export interface MoodConfig {
	id: MoodId;
	label: string;
	hasDetail: boolean;
	color: string;
}

export const MOODS: MoodConfig[] = [
	{
		id: 'moment',
		label: 'Taking a moment',
		hasDetail: false,
		color: '#00D4FF',
	},
	{
		id: 'anxious',
		label: 'Anxious about...',
		hasDetail: true,
		color: '#B088C0',
	},
	{
		id: 'processing',
		label: 'Processing...',
		hasDetail: true,
		color: '#88A0B8',
	},
	{
		id: 'preparing',
		label: 'Preparing for...',
		hasDetail: true,
		color: '#88B088',
	},
	{
		id: 'grateful',
		label: 'Grateful for...',
		hasDetail: true,
		color: '#A0C888',
	},
	{
		id: 'celebrating',
		label: 'Celebrating...',
		hasDetail: true,
		color: '#D4B888',
	},
	{ id: 'here', label: 'Just here', hasDetail: false, color: '#88B8C8' },
];

export interface AvatarConfig {
	id: string;
	colors: [string, string]; // Gradient from/to
}

export const AVATARS: AvatarConfig[] = [
	{ id: 'teal', colors: ['#00D4FF', '#0099CC'] },
	{ id: 'lavender', colors: ['#C088D4', '#9966AA'] },
	{ id: 'amber', colors: ['#FFB866', '#CC8833'] },
	{ id: 'sage', colors: ['#88CC88', '#66AA66'] },
	{ id: 'coral', colors: ['#FF8888', '#CC6666'] },
	{ id: 'indigo', colors: ['#8888FF', '#6666CC'] },
];

export const BASE_COLORS = {
	primary: '#00D4FF',
	primarySoft: '#7EB5C1',
	background: '#060a10',
	backgroundMid: '#0d1219',
};

/**
 * Convert hex to RGB values (0-1 range for WebGL)
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
	try {
		const [r, g, b] = chroma(hex).gl();
		return { r, g, b };
	} catch {
		return { r: 0, g: 0.83, b: 1 };
	}
}

/**
 * Convert hex to RGBA string with alpha
 */
export function hexToRgba(hex: string, alpha: number): string {
	try {
		return chroma(hex).alpha(alpha).css();
	} catch {
		return `rgba(0, 212, 255, ${alpha})`;
	}
}

/**
 * Get avatar gradient CSS
 */
export function getAvatarGradient(avatarId: string): string {
	const avatar = AVATARS.find((a) => a.id === avatarId);
	if (!avatar)
		return `linear-gradient(135deg, ${AVATARS[0].colors[0]}, ${AVATARS[0].colors[1]})`;
	return `linear-gradient(135deg, ${avatar.colors[0]}, ${avatar.colors[1]})`;
}

/**
 * Get mood color by mood ID
 */
export function getMoodColor(moodId: MoodId | '' | undefined): string {
	if (!moodId) return BASE_COLORS.primary;
	const mood = MOODS.find((m) => m.id === moodId);
	return mood?.color ?? BASE_COLORS.primary;
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
