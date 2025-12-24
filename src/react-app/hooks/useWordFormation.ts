/**
 * Word Formation Hook
 *
 * Manages the timing and triggering of word formation effects:
 * - Triggers at start of inhale (1 in 5 probability)
 * - Minimum 2 breath gap between words
 * - Words appear more frequently as session progresses
 * - Manages animation phases: forming -> holding -> dissolving
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
	type TextParticleData,
	textToParticlePositions,
} from '../lib/textToParticles';
import {
	estimateParticleCount,
	getRandomWord,
	type WordEntry,
} from '../lib/wordContent';
import type { BreathState } from './useBreathSync';

export type WordAnimationPhase = 'idle' | 'forming' | 'holding' | 'dissolving';

export interface WordFormationState {
	// Current animation phase
	phase: WordAnimationPhase;
	// 0-1 progress within current phase
	progress: number;
	// Overall 0-1 progress for the entire animation
	overallProgress: number;
	// Current word being displayed
	currentWord: WordEntry | null;
	// Particle position data for the word
	particleData: TextParticleData | null;
	// Which particle indices are forming the word (populated after selection)
	selectedParticleIndices: number[];
	// Letter-by-letter progress (0-1 for each letter)
	letterProgress: number[];
}

export interface UseWordFormationOptions {
	// Enable/disable the feature
	enabled?: boolean;
	// Session start time (for ramping frequency)
	sessionStartTime?: number;
}

// Animation timing constants (in seconds)
const FORMING_DURATION = 1.5; // Letter-by-letter reveal
const HOLDING_DURATION = 1.2; // Word visible and stable
const DISSOLVING_DURATION = 1.3; // Return to sphere
const TOTAL_DURATION =
	FORMING_DURATION + HOLDING_DURATION + DISSOLVING_DURATION;

// Letter stagger - delay between letters starting to form
const LETTER_STAGGER = 0.12; // seconds per letter

export function useWordFormation(
	breathState: BreathState,
	options: UseWordFormationOptions = {},
): WordFormationState {
	const { enabled = true, sessionStartTime = Date.now() } = options;

	const [state, setState] = useState<WordFormationState>({
		phase: 'idle',
		progress: 0,
		overallProgress: 0,
		currentWord: null,
		particleData: null,
		selectedParticleIndices: [],
		letterProgress: [],
	});

	// Track timing
	const breathsSinceWordRef = useRef<number>(0);
	const animationStartRef = useRef<number>(0);
	const recentWordsRef = useRef<string[]>([]);
	const rafRef = useRef<number>(0);
	const prevPhaseRef = useRef<string>(breathState.phase);

	// Trigger a new word formation
	const triggerWord = useCallback(() => {
		const word = getRandomWord(recentWordsRef.current);

		// Track recent words (keep last 5)
		recentWordsRef.current = [word.text, ...recentWordsRef.current.slice(0, 4)];

		// Generate particle positions for this word
		const particleData = textToParticlePositions(word.text, {
			targetCount: estimateParticleCount(word.text),
			zOffset: 18, // Slightly in front of the sphere
			scale: 1.0,
		});

		// Initialize letter progress array
		const letterProgress = new Array(particleData.letterCount).fill(0);

		animationStartRef.current = performance.now() / 1000;

		setState({
			phase: 'forming',
			progress: 0,
			overallProgress: 0,
			currentWord: word,
			particleData,
			selectedParticleIndices: [], // Will be populated by particle system
			letterProgress,
		});
	}, []);

	// Check if we should trigger a word on inhale start
	const checkTrigger = useCallback(() => {
		if (!enabled) return;

		const sessionDuration = (Date.now() - sessionStartTime) / 1000;
		const breathsSinceWord = breathsSinceWordRef.current;

		// Minimum 2 breath gap
		if (breathsSinceWord < 2) {
			breathsSinceWordRef.current++;
			return;
		}

		// Base probability: 1 in 5 (20%)
		// Increases as session progresses:
		// - First 60s: very rare (5%)
		// - 60-180s: normal (20%)
		// - 180s+: more common (30%)
		let probability = 0.2;
		if (sessionDuration < 60) {
			probability = 0.05;
		} else if (sessionDuration > 180) {
			probability = 0.3;
		}

		// Roll the dice
		if (Math.random() < probability) {
			breathsSinceWordRef.current = 0;
			triggerWord();
		} else {
			breathsSinceWordRef.current++;
		}
	}, [enabled, sessionStartTime, triggerWord]);

	// Detect inhale starts
	useEffect(() => {
		const currentPhase = breathState.phase;
		const prevPhase = prevPhaseRef.current;

		// Check for transition to inhale
		if (currentPhase === 'in' && prevPhase !== 'in') {
			// Only trigger if we're not already showing a word
			if (state.phase === 'idle') {
				checkTrigger();
			}
		}

		prevPhaseRef.current = currentPhase;
	}, [breathState.phase, state.phase, checkTrigger]);

	// Animation loop
	useEffect(() => {
		if (state.phase === 'idle') {
			return;
		}

		const animate = () => {
			const now = performance.now() / 1000;
			const elapsed = now - animationStartRef.current;
			const overallProgress = Math.min(1, elapsed / TOTAL_DURATION);

			let phase: WordAnimationPhase = 'forming';
			let phaseProgress = 0;

			if (elapsed < FORMING_DURATION) {
				phase = 'forming';
				phaseProgress = elapsed / FORMING_DURATION;
			} else if (elapsed < FORMING_DURATION + HOLDING_DURATION) {
				phase = 'holding';
				phaseProgress = (elapsed - FORMING_DURATION) / HOLDING_DURATION;
			} else if (elapsed < TOTAL_DURATION) {
				phase = 'dissolving';
				phaseProgress =
					(elapsed - FORMING_DURATION - HOLDING_DURATION) / DISSOLVING_DURATION;
			} else {
				// Animation complete
				setState({
					phase: 'idle',
					progress: 0,
					overallProgress: 0,
					currentWord: null,
					particleData: null,
					selectedParticleIndices: [],
					letterProgress: [],
				});
				return;
			}

			// Calculate per-letter progress for staggered animation
			const letterProgress: number[] = [];
			if (state.particleData) {
				const letterCount = state.particleData.letterCount;
				for (let i = 0; i < letterCount; i++) {
					const letterDelay = i * LETTER_STAGGER;
					let letterProg = 0;

					if (phase === 'forming') {
						// Each letter starts after its delay
						const letterElapsed = elapsed - letterDelay;
						letterProg = Math.max(
							0,
							Math.min(
								1,
								letterElapsed / (FORMING_DURATION - letterDelay * 0.5),
							),
						);
					} else if (phase === 'holding') {
						letterProg = 1;
					} else if (phase === 'dissolving') {
						// Reverse stagger for dissolving (last letter dissolves first)
						const reverseIndex = letterCount - 1 - i;
						const dissolveDelay = reverseIndex * LETTER_STAGGER * 0.8;
						const dissolveElapsed =
							elapsed - FORMING_DURATION - HOLDING_DURATION - dissolveDelay;
						letterProg =
							1 -
							Math.max(
								0,
								Math.min(
									1,
									dissolveElapsed / (DISSOLVING_DURATION - dissolveDelay * 0.5),
								),
							);
					}

					letterProgress.push(letterProg);
				}
			}

			setState((prev) => ({
				...prev,
				phase,
				progress: phaseProgress,
				overallProgress,
				letterProgress,
			}));

			rafRef.current = requestAnimationFrame(animate);
		};

		rafRef.current = requestAnimationFrame(animate);

		return () => {
			if (rafRef.current) {
				cancelAnimationFrame(rafRef.current);
			}
		};
	}, [state.phase, state.particleData]);

	// Method to update selected particle indices (called by particle system)
	const updateSelectedIndices = useCallback((indices: number[]) => {
		setState((prev) => ({
			...prev,
			selectedParticleIndices: indices,
		}));
	}, []);

	return {
		...state,
		// Expose method for particle system to set selected indices
		// @ts-expect-error - extending return type
		updateSelectedIndices,
	};
}

/**
 * Calculate the word formation blend value for a given letter
 * Used in shaders to interpolate between sphere and word positions
 */
export function getLetterBlend(
	letterIndex: number,
	letterProgress: number[],
	phase: WordAnimationPhase,
): number {
	if (phase === 'idle' || letterProgress.length === 0) {
		return 0;
	}
	return letterProgress[letterIndex] ?? 0;
}

export { TOTAL_DURATION as WORD_ANIMATION_DURATION };
