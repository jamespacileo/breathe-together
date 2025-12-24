/**
 * Curated word pool for meditation visualization
 * Words sourced from meditation traditions
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
		'Whole',
		'Safe',
		'Home',
		'Grace',
	],
	affirmations: [
		'You are enough',
		'Let go',
		'Be here now',
		'All is well',
		'Trust yourself',
		'You belong',
		'Just breathe',
		'I am present',
		'This moment',
	],
	poetic: [
		'Breathe the stars',
		'Float in stillness',
		'Held by quiet',
		'Soft as dawn',
		'Rivers within',
		'Ocean of calm',
		'Dancing light',
	],
} as const;

export type WordCategory = keyof typeof WORD_POOL;

/**
 * Select a random word with weighted category selection
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
 * Get a random word from a specific category
 */
export function selectWordFromCategory(category: WordCategory): string {
	const words = WORD_POOL[category];
	const index = Math.floor(Math.random() * words.length);
	return words[index];
}

/**
 * Get all words as a flat array
 */
export function getAllWords(): string[] {
	return [...WORD_POOL.simple, ...WORD_POOL.affirmations, ...WORD_POOL.poetic];
}
