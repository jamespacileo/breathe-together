/**
 * React hook for word formation system
 * Manages word triggering, recruitment, and animation
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { TIMING, TOTAL_PARTICLES } from '../core/constants';
import type { GPUParticleSystem } from '../core/particles/GPUParticleSystem';
import type { BreathState, WordFormationState } from '../core/types';
import { selectWord } from '../core/words/wordPool';
import {
	getLetterCount,
	recruitParticles,
} from '../core/words/wordRecruitment';
import {
	createWordTriggerState,
	onInhaleComplete,
	shouldTriggerWord,
} from '../core/words/wordTrigger';

export interface UseWordFormationOptions {
	enabled?: boolean;
}

export function useWordFormation(
	breathState: BreathState,
	system: GPUParticleSystem | null,
	options: UseWordFormationOptions = {},
): WordFormationState {
	const { enabled = true } = options;

	const [formationState, setFormationState] = useState<WordFormationState>({
		isActive: false,
		word: '',
		targets: [],
		progress: 0,
		startTime: 0,
	});

	const triggerStateRef = useRef(createWordTriggerState());
	const lastPhaseRef = useRef<string>('');
	const animationRef = useRef<number>(0);

	const triggerWord = useCallback(
		(word: string) => {
			if (!system) return;

			// Get position data from system (would need to expose this)
			// For now, create dummy data - in real impl, read from GPU texture
			const positionData = new Float32Array(TOTAL_PARTICLES * 4);
			// Initialize with Fibonacci sphere positions
			const goldenAngle = Math.PI * (3 - Math.sqrt(5));
			for (let i = 0; i < TOTAL_PARTICLES; i++) {
				const y = 1 - (i / (TOTAL_PARTICLES - 1)) * 2;
				const radius = Math.sqrt(1 - y * y);
				const theta = goldenAngle * i;
				positionData[i * 4] = Math.cos(theta) * radius;
				positionData[i * 4 + 1] = y;
				positionData[i * 4 + 2] = Math.sin(theta) * radius;
				positionData[i * 4 + 3] = 0; // scaffold type
			}

			// Recruit particles for the word
			const targets = recruitParticles(
				word,
				positionData,
				TOTAL_PARTICLES,
				0.4,
			);
			const letterCount = getLetterCount(word);

			// Set targets in particle system
			system.setWordTargets(targets, letterCount);

			const startTime = performance.now();

			setFormationState({
				isActive: true,
				word,
				targets: Array.from(targets.entries()).map(([idx, pos]) => ({
					particleIndex: idx,
					targetPosition: pos,
					letterIndex: 0, // Would need letter index from recruitment
				})),
				progress: 0,
				startTime,
			});

			// Animate word reveal
			const animate = () => {
				const elapsed = performance.now() - startTime;
				const fadeInProgress = Math.min(elapsed / TIMING.WORD_FADE_IN, 1);
				const totalDuration = TIMING.WORD_DURATION + TIMING.WORD_FADE_OUT;

				if (elapsed < TIMING.WORD_DURATION) {
					// Show word
					system.setWordProgress(fadeInProgress);
					setFormationState((prev) => ({ ...prev, progress: fadeInProgress }));
					animationRef.current = requestAnimationFrame(animate);
				} else if (elapsed < totalDuration) {
					// Fade out
					const fadeOutProgress =
						1 - (elapsed - TIMING.WORD_DURATION) / TIMING.WORD_FADE_OUT;
					system.setWordProgress(fadeOutProgress);
					setFormationState((prev) => ({ ...prev, progress: fadeOutProgress }));
					animationRef.current = requestAnimationFrame(animate);
				} else {
					// Complete
					system.clearWordTargets();
					setFormationState({
						isActive: false,
						word: '',
						targets: [],
						progress: 0,
						startTime: 0,
					});
				}
			};

			animationRef.current = requestAnimationFrame(animate);
		},
		[system],
	);

	// Track phase transitions to trigger words
	useEffect(() => {
		if (!(enabled && system)) return;

		const currentPhase = breathState.phase;
		const lastPhase = lastPhaseRef.current;

		// Detect inhale completion (transition from inhale to hold-full)
		if (lastPhase === 'inhale' && currentPhase === 'hold-full') {
			const shouldTrigger = shouldTriggerWord(triggerStateRef.current);

			if (shouldTrigger) {
				// Select and display a word
				const word = selectWord();
				triggerWord(word);
			}

			triggerStateRef.current = onInhaleComplete(
				triggerStateRef.current,
				shouldTrigger,
			);
		}

		lastPhaseRef.current = currentPhase;
	}, [breathState.phase, enabled, system, triggerWord]);

	// Cleanup animation on unmount
	useEffect(() => {
		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, []);

	return formationState;
}
