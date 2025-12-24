/**
 * Hook for word formation system
 * Triggers and manages inspirational word display
 */

import { useEffect, useRef, useState } from 'react';
import { FBO_SIZE } from '../core/constants';
import type { GPUParticleSystem } from '../core/particles/GPUParticleSystem';
import type { BreathState, WordFormationState } from '../core/types';
import { selectWord } from '../core/words/wordPool';
import {
	completeWordAnimation,
	createWordTriggerState,
	getWordProgress,
	updateOnInhale,
	type WordTriggerState,
} from '../core/words/wordTrigger';

export interface UseWordFormationResult {
	wordState: WordFormationState | null;
	triggerState: WordTriggerState;
}

/**
 * Manage word formation based on breath cycles
 */
export function useWordFormation(
	breathState: BreathState,
	particleSystem: GPUParticleSystem | null,
): UseWordFormationResult {
	const [triggerState, setTriggerState] = useState<WordTriggerState>(
		createWordTriggerState,
	);
	const [wordState, setWordState] = useState<WordFormationState | null>(null);
	const prevPhaseRef = useRef<string | null>(null);

	// Track phase transitions
	useEffect(() => {
		const prevPhase = prevPhaseRef.current;
		const currentPhase = breathState.phase;

		// Detect inhale start
		if (prevPhase !== 'inhale' && currentPhase === 'inhale') {
			// Update trigger state and possibly start a word
			setTriggerState((prev) => {
				const next = updateOnInhale(prev, selectWord);

				if (next.isAnimating && next.currentWord) {
					// Start word formation
					setWordState({
						isActive: true,
						word: next.currentWord,
						progress: 0,
						recruitedParticles: new Map(),
						startTime: Date.now(),
					});
				}

				return next;
			});
		}

		prevPhaseRef.current = currentPhase;
	}, [breathState.phase]);

	// Update word progress
	useEffect(() => {
		if (!(triggerState.isAnimating && wordState?.isActive)) return;

		const interval = setInterval(() => {
			const progress = getWordProgress(triggerState);

			if (progress >= 1) {
				// Animation complete
				setTriggerState(completeWordAnimation);
				setWordState(null);
				clearInterval(interval);
			} else {
				setWordState((prev) => (prev ? { ...prev, progress } : null));
			}
		}, 16); // ~60fps

		return () => clearInterval(interval);
	}, [triggerState, wordState?.isActive]);

	// Update recruitment texture when word changes
	useEffect(() => {
		if (!(particleSystem && wordState?.isActive && wordState.word)) return;

		// This would require reading back GPU data - simplified for demo
		// In production, you'd pre-compute recruitment on CPU during load
		const recruitmentData = new Float32Array(FBO_SIZE * FBO_SIZE * 4);
		for (let i = 0; i < FBO_SIZE * FBO_SIZE; i++) {
			recruitmentData[i * 4 + 3] = -1; // Not recruited
		}

		particleSystem.updateRecruitmentTexture(recruitmentData);
	}, [particleSystem, wordState?.isActive, wordState?.word]);

	return {
		wordState,
		triggerState,
	};
}
