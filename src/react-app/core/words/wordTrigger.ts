/**
 * Word trigger logic
 * Determines when to display words based on session progress
 */

import { WORD_CONFIG } from '../constants';

/**
 * Determine if a word should be triggered this inhale
 */
export function shouldTriggerWord(
	inhaleCount: number,
	lastWordInhale: number,
	sessionDuration: number, // in seconds
): boolean {
	// Enforce minimum gap between words
	if (inhaleCount - lastWordInhale < WORD_CONFIG.minGapInhales) {
		return false;
	}

	// Calculate probability based on session duration
	// Ramps from baseProbability to maxProbability over first 2 minutes
	const ramp = Math.min(sessionDuration / WORD_CONFIG.rampDuration, 1);
	const probability =
		WORD_CONFIG.baseProbability +
		(WORD_CONFIG.maxProbability - WORD_CONFIG.baseProbability) * ramp;

	return Math.random() < probability;
}

/**
 * Word formation state tracker
 */
export interface WordTriggerState {
	sessionStartTime: number;
	lastWordInhale: number;
	inhaleCount: number;
	currentWord: string | null;
	wordStartTime: number;
	isAnimating: boolean;
}

/**
 * Create initial word trigger state
 */
export function createWordTriggerState(): WordTriggerState {
	return {
		sessionStartTime: Date.now(),
		lastWordInhale: -WORD_CONFIG.minGapInhales, // Allow word on first eligible inhale
		inhaleCount: 0,
		currentWord: null,
		wordStartTime: 0,
		isAnimating: false,
	};
}

/**
 * Update state on new inhale
 */
export function updateOnInhale(
	state: WordTriggerState,
	triggerWord: () => string,
): WordTriggerState {
	const newInhaleCount = state.inhaleCount + 1;
	const sessionDuration = (Date.now() - state.sessionStartTime) / 1000;

	// Check if we should trigger a word
	const shouldTrigger = shouldTriggerWord(
		newInhaleCount,
		state.lastWordInhale,
		sessionDuration,
	);

	if (shouldTrigger && !state.isAnimating) {
		const word = triggerWord();
		return {
			...state,
			inhaleCount: newInhaleCount,
			lastWordInhale: newInhaleCount,
			currentWord: word,
			wordStartTime: Date.now(),
			isAnimating: true,
		};
	}

	return {
		...state,
		inhaleCount: newInhaleCount,
	};
}

/**
 * Get animation progress for current word (0-1)
 */
export function getWordProgress(state: WordTriggerState): number {
	if (!state.isAnimating || state.wordStartTime === 0) {
		return 0;
	}

	const elapsed = Date.now() - state.wordStartTime;
	const duration = 4000; // 4 seconds for full word animation

	return Math.min(elapsed / duration, 1);
}

/**
 * Mark word animation as complete
 */
export function completeWordAnimation(
	state: WordTriggerState,
): WordTriggerState {
	return {
		...state,
		currentWord: null,
		wordStartTime: 0,
		isAnimating: false,
	};
}
