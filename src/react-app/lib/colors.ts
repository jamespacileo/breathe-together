import type { MoodId } from './simulationConfig';

/**
 * Color palettes and mood configurations
 */

export interface MoodConfig {
	id: MoodId;
	label: string;
	hasDetail: boolean;
	color: string;
	secondaryColor?: string;
}

/**
 * Single source of truth for mood metadata, combining labels, colors, and UI logic.
 */
export const MOOD_METADATA: Record<MoodId, MoodConfig> = {
	moment: {
		id: 'moment',
		label: 'Taking a moment',
		hasDetail: false,
		color: '#7EC8D4', // Soft Cyan - present, grounded
		secondaryColor: '#5A9BAA',
	},
	anxious: {
		id: 'anxious',
		label: 'Anxious about...',
		hasDetail: true,
		color: '#9B8EC8', // Lavender - releasing tension
		secondaryColor: '#7E7EC1',
	},
	processing: {
		id: 'processing',
		label: 'Processing...',
		hasDetail: true,
		color: '#6BB8C0', // Soft Teal - working through
		secondaryColor: '#5A9BAA',
	},
	preparing: {
		id: 'preparing',
		label: 'Preparing for...',
		hasDetail: true,
		color: '#8AB4D6', // Sky Blue - getting ready
		secondaryColor: '#5A9BAA',
	},
	grateful: {
		id: 'grateful',
		label: 'Grateful for...',
		hasDetail: true,
		color: '#C8B87E', // Soft Gold - appreciation
		secondaryColor: '#AA8A5A',
	},
	celebrating: {
		id: 'celebrating',
		label: 'Celebrating...',
		hasDetail: true,
		color: '#C8B87E', // Soft Gold - alias to grateful
		secondaryColor: '#AA8A5A',
	},
	here: {
		id: 'here',
		label: 'Just here',
		hasDetail: false,
		color: '#7EC8D4',
		secondaryColor: '#5A9BAA',
	},
};

export const MOODS: MoodConfig[] = Object.values(MOOD_METADATA);

export function getMoodGradient(moodId: MoodId): string {
	const mood = MOOD_METADATA[moodId] || MOOD_METADATA.moment;
	return `linear-gradient(135deg, ${mood.color}, ${mood.secondaryColor || mood.color})`;
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
	const mood = MOOD_METADATA[moodId as MoodId];
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
