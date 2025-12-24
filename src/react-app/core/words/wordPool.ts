/**
 * Curated word pool for meditation moments
 * Words sourced from meditation traditions and mindfulness practices
 */

export const WORD_POOL = {
	simple: [
		'Peace',
		'Here',
		'Now',
		'Calm',
		'Rest',
		'Ease',
		'Light',
		'Soft',
		'Still',
		'Flow',
		'Open',
		'Free',
		'Safe',
		'Held',
		'Home',
		'Whole',
	],
	affirmations: [
		'You are enough',
		'Let go',
		'Be here now',
		'All is well',
		'Trust yourself',
		'You belong',
		'I am peace',
		'Just breathe',
		'This moment',
		'Fully here',
	],
	poetic: [
		'Breathe the stars',
		'Float in stillness',
		'Held by quiet',
		'Soft as dawn',
		'Rivers within',
		'Infinite calm',
		'Gentle waves',
		'Starlight breath',
	],
} as const;

export type WordCategory = keyof typeof WORD_POOL;

/**
 * Select a word using weighted randomization
 * 70% simple, 20% affirmations, 10% poetic
 */
export function selectWord(): string {
	const roll = Math.random();

	let category: WordCategory;
	if (roll < 0.7) {
		category = 'simple';
	} else if (roll < 0.9) {
		category = 'affirmations';
	} else {
		category = 'poetic';
	}

	const words = WORD_POOL[category];
	const index = Math.floor(Math.random() * words.length);
	return words[index];
}

/**
 * Get all words from a specific category
 */
export function getWordsFromCategory(
	category: WordCategory,
): readonly string[] {
	return WORD_POOL[category];
}
