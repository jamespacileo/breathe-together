import type { MoodId } from './simulationConfig';

/**
 * Color palettes and mood configurations
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
		color: '#7EC8D4', // Soft Cyan - present, grounded
	},
	{
		id: 'anxious',
		label: 'Anxious about...',
		hasDetail: true,
		color: '#9B8EC8', // Lavender - releasing tension
	},
	{
		id: 'processing',
		label: 'Processing...',
		hasDetail: true,
		color: '#6BB8C0', // Soft Teal - working through
	},
	{
		id: 'preparing',
		label: 'Preparing for...',
		hasDetail: true,
		color: '#8AB4D6', // Sky Blue - getting ready
	},
	{
		id: 'grateful',
		label: 'Grateful for...',
		hasDetail: true,
		color: '#C8B87E', // Soft Gold - appreciation
	},
	{
		id: 'celebrating',
		label: 'Celebrating...',
		hasDetail: true,
		color: '#C8B87E', // Soft Gold - alias to grateful
	},
	{ id: 'here', label: 'Just here', hasDetail: false, color: '#7EC8D4' }, // Soft Cyan - alias to moment
];

export interface MoodColorConfig {
	id: string;
	label: string;
	colors: [string, string];
}

export const MOOD_COLORS: MoodColorConfig[] = [
	{ id: 'grounding', label: 'Grounding', colors: ['#7EB5C1', '#5A9BAA'] },
	{ id: 'releasing', label: 'Releasing', colors: ['#C17EB5', '#AA5A9B'] },
	{ id: 'energizing', label: 'Energizing', colors: ['#C17E7E', '#AA5A5A'] },
	{ id: 'growing', label: 'Growing', colors: ['#7EC17E', '#5AAA5A'] },
	{ id: 'celebrating', label: 'Celebrating', colors: ['#C1A87E', '#AA8A5A'] },
	{ id: 'reflecting', label: 'Reflecting', colors: ['#7E7EC1', '#5A5AAA'] },
];

export function getMoodGradient(moodId: string): string {
	const mood = MOOD_COLORS.find((m) => m.id === moodId);
	if (!mood)
		return `linear-gradient(135deg, ${MOOD_COLORS[0].colors[0]}, ${MOOD_COLORS[0].colors[1]})`;
	return `linear-gradient(135deg, ${mood.colors[0]}, ${mood.colors[1]})`;
}

export const BASE_COLORS = {
	primary: '#7EC8D4', // Soft Cyan (matches 'moment' mood)
	background: '#0f1723',
	backgroundMid: '#1a2634',
};

/**
 * Sphere phase colors for breathing visualization
 * Used by sphere.frag.ts and glow.frag.ts shaders
 */
export const SPHERE_PHASE_COLORS = {
	inhale: { r: 0.42, g: 0.72, b: 0.82 }, // Soft cyan (#6BB8D0)
	holdIn: { r: 0.5, g: 0.78, b: 0.83 }, // Light teal
	exhale: { r: 0.54, g: 0.7, b: 0.84 }, // Soft sky blue
	holdOut: { r: 0.48, g: 0.68, b: 0.78 }, // Muted steel blue
} as const;

/**
 * Particle color palette for GPGPU particle system
 * Soft blue/cyan tones for meditative, calming effect
 */
export const PARTICLE_COLORS = [
	0x7ec8d4, // Soft cyan
	0x6bb8d0, // Light teal
	0x8ab4d6, // Soft sky blue
	0x9dc4e0, // Pale blue
	0x7ac0cc, // Muted cyan
	0xa0cce0, // Light steel blue
	0x88b8d4, // Soft azure
	0x7eb5c1, // Primary soft teal
] as const;

/**
 * Get mood color by mood ID
 */
export function getMoodColor(moodId: MoodId | '' | undefined): string {
	if (!moodId) return BASE_COLORS.primary;
	const mood = MOODS.find((m) => m.id === moodId);
	return mood?.color ?? BASE_COLORS.primary;
}

/**
 * Convert mood counts to color counts for particle rendering
 * @param moodCounts - Record of mood IDs to user counts
 * @returns Record of hex colors to user counts
 */
export function getMoodColorCounts(
	moodCounts: Record<MoodId, number>,
): Record<string, number> {
	const colorCounts: Record<string, number> = {};

	for (const [moodId, count] of Object.entries(moodCounts)) {
		if (count > 0) {
			const color = getMoodColor(moodId as MoodId);
			colorCounts[color] = (colorCounts[color] || 0) + count;
		}
	}

	return colorCounts;
}
