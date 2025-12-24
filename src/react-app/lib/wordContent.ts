/**
 * Word Content Pool for Word Formation Feature
 *
 * Curated words and phrases from meditation traditions,
 * designed to feel good on an inhale and kept secular/universal.
 */

export interface WordEntry {
	text: string;
	category: 'simple' | 'affirmation' | 'poetic';
}

// Simple words (70% weight) - single peaceful words
const simpleWords: WordEntry[] = [
	{ text: 'Peace', category: 'simple' },
	{ text: 'Here', category: 'simple' },
	{ text: 'Now', category: 'simple' },
	{ text: 'Calm', category: 'simple' },
	{ text: 'Rest', category: 'simple' },
	{ text: 'Light', category: 'simple' },
	{ text: 'Ease', category: 'simple' },
	{ text: 'Flow', category: 'simple' },
	{ text: 'Soft', category: 'simple' },
	{ text: 'Open', category: 'simple' },
	{ text: 'Free', category: 'simple' },
	{ text: 'Safe', category: 'simple' },
	{ text: 'Home', category: 'simple' },
	{ text: 'Warm', category: 'simple' },
	{ text: 'Deep', category: 'simple' },
	{ text: 'Still', category: 'simple' },
	{ text: 'Whole', category: 'simple' },
	{ text: 'Trust', category: 'simple' },
	{ text: 'Love', category: 'simple' },
	{ text: 'Joy', category: 'simple' },
];

// Short affirmations (20% weight) - brief affirming phrases
const affirmations: WordEntry[] = [
	{ text: 'You are enough', category: 'affirmation' },
	{ text: 'Let go', category: 'affirmation' },
	{ text: 'Be here now', category: 'affirmation' },
	{ text: 'All is well', category: 'affirmation' },
	{ text: 'Just breathe', category: 'affirmation' },
	{ text: 'You belong', category: 'affirmation' },
	{ text: 'Stay gentle', category: 'affirmation' },
	{ text: 'Trust yourself', category: 'affirmation' },
	{ text: 'Be still', category: 'affirmation' },
	{ text: 'Simply be', category: 'affirmation' },
];

// Poetic phrases (10% weight) - evocative, slightly longer
const poeticPhrases: WordEntry[] = [
	{ text: 'Breathe the stars', category: 'poetic' },
	{ text: 'Float in stillness', category: 'poetic' },
	{ text: 'Drift like clouds', category: 'poetic' },
	{ text: 'Soft as moonlight', category: 'poetic' },
	{ text: 'Ocean within', category: 'poetic' },
	{ text: 'Infinite calm', category: 'poetic' },
	{ text: 'Held by silence', category: 'poetic' },
	{ text: 'Light unfolds', category: 'poetic' },
];

// Build weighted pool: 70% simple, 20% affirmations, 10% poetic
export const wordPool: WordEntry[] = [
	// Add simple words 7 times each for 70% weight
	...simpleWords,
	...simpleWords,
	...simpleWords,
	...simpleWords,
	...simpleWords,
	...simpleWords,
	...simpleWords,
	// Add affirmations 2 times each for 20% weight
	...affirmations,
	...affirmations,
	// Add poetic phrases 1 time each for 10% weight
	...poeticPhrases,
];

/**
 * Get a random word from the pool, avoiding recent words
 */
export function getRandomWord(recentWords: string[] = []): WordEntry {
	// Filter out recently shown words
	const available = wordPool.filter((w) => !recentWords.includes(w.text));

	// If all filtered out, just use the full pool
	const pool = available.length > 0 ? available : wordPool;

	const index = Math.floor(Math.random() * pool.length);
	return pool[index];
}

/**
 * Estimate how many particles are needed for a word
 * Roughly 30-50 particles per character
 */
export function estimateParticleCount(text: string): number {
	const charCount = text.replace(/\s/g, '').length;
	return Math.min(300, Math.max(100, charCount * 35));
}
