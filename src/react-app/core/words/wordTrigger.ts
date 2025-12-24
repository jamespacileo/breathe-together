/**
 * Word Trigger System
 * Determines when to show inspirational words based on breathing cycles
 */

import { WORD_SYSTEM } from '../constants';

interface WordTriggerState {
	inhaleCount: number;
	lastWordInhale: number;
	sessionStart: number;
}

/**
 * Check if a word should be triggered
 */
export function shouldTriggerWord(state: WordTriggerState): boolean {
	const { inhaleCount, lastWordInhale, sessionStart } = state;

	// Enforce minimum gap between words
	if (inhaleCount - lastWordInhale < WORD_SYSTEM.MIN_GAP_INHALES) {
		return false;
	}

	// Calculate session duration in seconds
	const sessionDuration = (Date.now() - sessionStart) / 1000;

	// Ramp probability over first 2 minutes
	const ramp = Math.min(sessionDuration / WORD_SYSTEM.RAMP_DURATION, 1);
	const probability =
		WORD_SYSTEM.BASE_PROBABILITY +
		(WORD_SYSTEM.MAX_PROBABILITY - WORD_SYSTEM.BASE_PROBABILITY) * ramp;

	return Math.random() < probability;
}

/**
 * Create initial word trigger state
 */
export function createWordTriggerState(): WordTriggerState {
	return {
		inhaleCount: 0,
		lastWordInhale: -WORD_SYSTEM.MIN_GAP_INHALES, // Allow first word immediately
		sessionStart: Date.now(),
	};
}

/**
 * Update state when inhale completes
 */
export function onInhaleComplete(
	state: WordTriggerState,
	triggered: boolean,
): WordTriggerState {
	return {
		...state,
		inhaleCount: state.inhaleCount + 1,
		lastWordInhale: triggered ? state.inhaleCount + 1 : state.lastWordInhale,
	};
}
