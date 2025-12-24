import {
	type AvatarId,
	type MoodDistribution,
	type MoodId,
	selectMoodByDistribution,
	selectRandomAvatar,
} from './simulationConfig';

/**
 * Simulated user identity
 */
export interface SimulatedUser {
	id: string;
	name: string;
	avatar: AvatarId;
	mood: MoodId;
	moodDetail?: string;
	joinedAt: number;
	departureTime: number;
}

/**
 * Pool of anonymous but warm names
 * Gender-neutral and diverse
 */
const NAME_POOL: string[] = [
	// Nature-inspired
	'River',
	'Sage',
	'Sky',
	'Ocean',
	'Rain',
	'Storm',
	'Leaf',
	'Brook',
	'Meadow',
	'Dawn',
	// Classic unisex
	'Alex',
	'Sam',
	'Jordan',
	'Taylor',
	'Casey',
	'Morgan',
	'Riley',
	'Quinn',
	'Avery',
	'Cameron',
	// Modern
	'Kai',
	'Nova',
	'Luna',
	'Aria',
	'Rowan',
	'Eden',
	'Phoenix',
	'Ember',
	'Willow',
	'Ash',
	// Traditional
	'Jamie',
	'Drew',
	'Blake',
	'Reese',
	'Charlie',
	'Finley',
	'Hayden',
	'Emery',
	'Jules',
	'Kit',
	// Short & warm
	'Max',
	'Leo',
	'Ava',
	'Mia',
	'Eli',
	'Ivy',
	'Zoe',
	'Lux',
	'Ren',
	'Sol',
];

/**
 * Mood detail templates for moods that support details
 * Each mood has several possible completions
 */
const MOOD_DETAIL_TEMPLATES: Partial<Record<MoodId, string[]>> = {
	anxious: [
		'a deadline',
		'tomorrow',
		'the unknown',
		'a conversation',
		'change',
		'a decision',
		'the future',
		'a meeting',
		'health',
		'finances',
	],
	processing: [
		'a loss',
		'change',
		'emotions',
		'the day',
		'a conversation',
		'memories',
		'feelings',
		'news',
		'a transition',
		'growth',
	],
	preparing: [
		'a meeting',
		'a journey',
		'something new',
		'the week ahead',
		'a challenge',
		'a conversation',
		'a big day',
		'tomorrow',
		'an event',
		'a change',
	],
	grateful: [
		'small things',
		'this moment',
		'connection',
		'peace',
		'progress',
		'support',
		'clarity',
		'today',
		'growth',
		'presence',
	],
	celebrating: [
		'progress',
		'a win',
		'being here',
		'life',
		'a milestone',
		'good news',
		'accomplishment',
		'moving forward',
		'peace',
		'joy',
	],
};

/**
 * Generate a unique session ID
 */
function generateId(): string {
	return `sim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Select a random name from the pool
 */
function selectRandomName(): string {
	return NAME_POOL[Math.floor(Math.random() * NAME_POOL.length)];
}

/**
 * Generate a mood detail for moods that support it
 */
function generateMoodDetail(mood: MoodId): string | undefined {
	const templates = MOOD_DETAIL_TEMPLATES[mood];
	if (!templates || templates.length === 0) {
		return undefined;
	}

	// 70% chance to have a detail for moods that support it
	if (Math.random() > 0.7) {
		return undefined;
	}

	return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Sample from exponential distribution
 * Used for departure times in M/M/∞ queue model
 */
function sampleExponential(mean: number): number {
	return -mean * Math.log(Math.random());
}

/**
 * Generate a complete simulated user
 */
export function generateUser(
	moodDistribution: MoodDistribution,
	meanStayDuration: number,
	timeScale: number = 1,
): SimulatedUser {
	const mood = selectMoodByDistribution(moodDistribution);
	const now = Date.now();

	// Scale the stay duration by timeScale for faster testing
	const scaledStayDuration = meanStayDuration / timeScale;
	const stayDuration = sampleExponential(scaledStayDuration);

	return {
		id: generateId(),
		name: selectRandomName(),
		avatar: selectRandomAvatar(),
		mood,
		moodDetail: generateMoodDetail(mood),
		joinedAt: now,
		departureTime: now + stayDuration,
	};
}

/**
 * Check if user should have departed
 */
export function shouldDepart(user: SimulatedUser): boolean {
	return Date.now() >= user.departureTime;
}
