import type { MoodId } from './simulation';

/**
 * Mood configuration for user identity
 */
export interface MoodConfig {
	id: MoodId;
	label: string;
	hasDetail: boolean;
	color: string;
}

/**
 * Available moods with their display properties
 */
export const MOODS: MoodConfig[] = [
	{
		id: 'moment',
		label: 'Taking a moment',
		hasDetail: false,
		color: '#7EB5C1',
	},
	{
		id: 'anxious',
		label: 'Anxious about...',
		hasDetail: true,
		color: '#9B7E9F',
	},
	{
		id: 'processing',
		label: 'Processing...',
		hasDetail: true,
		color: '#7E8E9F',
	},
	{
		id: 'preparing',
		label: 'Preparing for...',
		hasDetail: true,
		color: '#8E9B7E',
	},
	{
		id: 'grateful',
		label: 'Grateful for...',
		hasDetail: true,
		color: '#9FC17E',
	},
	{
		id: 'celebrating',
		label: 'Celebrating...',
		hasDetail: true,
		color: '#C1A87E',
	},
	{ id: 'here', label: 'Just here', hasDetail: false, color: '#8EAAB4' },
];

/**
 * Avatar configuration
 */
export interface AvatarConfig {
	id: string;
	colors: [string, string]; // Gradient from/to
}

/**
 * Available avatars with gradient colors
 */
export const AVATARS: AvatarConfig[] = [
	{ id: 'teal', colors: ['#7EB5C1', '#5A9BAA'] },
	{ id: 'lavender', colors: ['#C17EB5', '#AA5A9B'] },
	{ id: 'amber', colors: ['#C1A87E', '#AA8A5A'] },
	{ id: 'sage', colors: ['#7EC17E', '#5AAA5A'] },
	{ id: 'coral', colors: ['#C17E7E', '#AA5A5A'] },
	{ id: 'indigo', colors: ['#7E7EC1', '#5A5AAA'] },
];

/**
 * Base color palette
 */
export const BASE_COLORS = {
	primary: '#7EB5C1',
	background: '#0f1723',
	backgroundMid: '#1a2634',
};

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
