/**
 * Word Pool for breathing meditation
 * Curated words from meditation traditions
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
		'Breathe',
		'Be',
		'Love',
		'Joy',
	],
	affirmations: [
		'You are enough',
		'Let go',
		'Be here now',
		'All is well',
		'Trust yourself',
		'You belong',
		'I am peace',
		'I am calm',
	],
	poetic: [
		'Breathe the stars',
		'Float in stillness',
		'Held by quiet',
		'Soft as dawn',
		'Rivers within',
		'Gentle waves',
	],
} as const;

/**
 * Select a word with weighted probability
 * 70% simple, 20% affirmations, 10% poetic
 */
export function selectWord(): string {
	const roll = Math.random();

	if (roll < 0.7) {
		return randomFrom(WORD_POOL.simple);
	}
	if (roll < 0.9) {
		return randomFrom(WORD_POOL.affirmations);
	}
	return randomFrom(WORD_POOL.poetic);
}

function randomFrom<T>(arr: readonly T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Get all available words (for preloading glyph data)
 */
export function getAllWords(): string[] {
	return [...WORD_POOL.simple, ...WORD_POOL.affirmations, ...WORD_POOL.poetic];
}
