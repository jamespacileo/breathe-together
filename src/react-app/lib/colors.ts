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
	primary: '#7EB5C1',
	background: '#0f1723',
	backgroundMid: '#1a2634',
};

/**
 * Get mood color by mood ID
 */
export function getMoodColor(moodId: MoodId | '' | undefined): string {
	if (!moodId) return BASE_COLORS.primary;
	const mood = MOODS.find((m) => m.id === moodId);
	return mood?.color ?? BASE_COLORS.primary;
}
