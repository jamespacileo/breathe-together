/**
 * Word trigger logic with probability ramping
 * Controls when inspirational words appear during breathing
 */

import {
	WORD_BASE_PROBABILITY,
	WORD_MAX_PROBABILITY,
	WORD_MIN_GAP,
} from '../particles/constants';

export interface WordTriggerState {
	inhaleCount: number;
	lastWordInhale: number;
	sessionStart: number;
}

/**
 * Create initial trigger state
 */
export function createWordTriggerState(): WordTriggerState {
	return {
		inhaleCount: 0,
		lastWordInhale: -WORD_MIN_GAP, // Allow first word after minimum gap
		sessionStart: Date.now(),
	};
}

/**
 * Check if a word should be triggered
 * Must be called at the start of each inhale phase
 */
export function shouldTriggerWord(state: WordTriggerState): boolean {
	// Enforce minimum gap between words
	if (state.inhaleCount - state.lastWordInhale < WORD_MIN_GAP) {
		return false;
	}

	// Calculate session duration in seconds
	const sessionDuration = (Date.now() - state.sessionStart) / 1000;

	// Ramp probability over first 2 minutes
	const ramp = Math.min(sessionDuration / 120, 1);
	const probability =
		WORD_BASE_PROBABILITY +
		(WORD_MAX_PROBABILITY - WORD_BASE_PROBABILITY) * ramp;

	return Math.random() < probability;
}

/**
 * Record that an inhale phase started
 */
export function recordInhale(state: WordTriggerState): WordTriggerState {
	return {
		...state,
		inhaleCount: state.inhaleCount + 1,
	};
}

/**
 * Record that a word was displayed
 */
export function recordWordDisplayed(state: WordTriggerState): WordTriggerState {
	return {
		...state,
		lastWordInhale: state.inhaleCount,
	};
}
