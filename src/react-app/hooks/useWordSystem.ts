/**
 * React Hook for Word Formation System
 * Manages word triggering and animation state
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { type WordFormationState, WordSystem } from '../lib/wordSystem';

export interface UseWordSystemResult {
	wordState: WordFormationState;
	isForming: boolean;
	update: (
		currentTime: number,
		phaseType: number,
		positions: Float32Array,
		particleCount: number,
	) => boolean;
	forceEnd: () => void;
	resetSession: () => void;
}

/**
 * Hook that provides word formation system functionality
 */
export function useWordSystem(): UseWordSystemResult {
	const systemRef = useRef<WordSystem | null>(null);

	// Lazy initialization
	if (!systemRef.current) {
		systemRef.current = new WordSystem();
	}

	const [wordState, setWordState] = useState<WordFormationState>(
		systemRef.current.getState(),
	);

	const update = useCallback(
		(
			currentTime: number,
			phaseType: number,
			positions: Float32Array,
			particleCount: number,
		): boolean => {
			if (!systemRef.current) return false;

			const stateChanged = systemRef.current.update(
				currentTime,
				phaseType,
				positions,
				particleCount,
			);

			// Always update state to get progress changes
			setWordState({ ...systemRef.current.getState() });

			return stateChanged;
		},
		[],
	);

	const forceEnd = useCallback(() => {
		if (systemRef.current) {
			systemRef.current.forceEnd();
			setWordState({ ...systemRef.current.getState() });
		}
	}, []);

	const resetSession = useCallback(() => {
		if (systemRef.current) {
			systemRef.current.resetSession();
			setWordState({ ...systemRef.current.getState() });
		}
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (systemRef.current) {
				systemRef.current.forceEnd();
			}
		};
	}, []);

	return {
		wordState,
		isForming: wordState.state === 'forming',
		update,
		forceEnd,
		resetSession,
	};
}
