/**
 * TheatreBreathProvider
 *
 * Provides Theatre.js breath values to the 3D scene.
 * Replaces GlobalUniformsProvider with Theatre.js timeline-driven values.
 *
 * This component:
 * 1. Starts the breathing animation sequence on mount
 * 2. Provides a ref-based context for breath values (no re-renders)
 * 3. Updates values each frame from Theatre.js subscriptions
 */

import { useFrame } from '@react-three/fiber';
import {
	createContext,
	memo,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useRef,
} from 'react';
import { breathCycleObj, sequence } from '../../lib/theatre';
import type { BreathCycleProps } from '../../lib/theatre/types';

/**
 * Extended breath data including time
 *
 * Breath Phase Convention:
 * - breathPhase: 0 = fully exhaled (orb expanded, particles spread)
 *                1 = fully inhaled (orb contracted, particles settled)
 *
 * Visual interpretation across components:
 * - Scale: maxScale at breathPhase=0, minScale at breathPhase=1
 * - Radius: spreadRadius at breathPhase=0, settledRadius at breathPhase=1
 * - Crystallization: 0 during breathing phases, peaks during holds
 */
export interface TheatreBreathData extends BreathCycleProps {
	time: number;
	delta: number;
}

/**
 * Initial values for breath data
 */
function createInitialData(): TheatreBreathData {
	return {
		breathPhase: 0,
		phaseType: 0,
		rawProgress: 0,
		easedProgress: 0,
		anticipation: 0,
		overshoot: 0,
		diaphragmDirection: 0,
		colorTemperature: 0,
		crystallization: 0,
		breathWave: 0,
		phaseTransitionBlend: 0,
		time: 0,
		delta: 0.016,
	};
}

const TheatreBreathContext =
	createContext<React.MutableRefObject<TheatreBreathData> | null>(null);

interface TheatreBreathProviderProps {
	children: ReactNode;
}

/**
 * Provider component that wraps the 3D scene and provides breath values
 */
export const TheatreBreathProvider = memo(
	({ children }: TheatreBreathProviderProps) => {
		const dataRef = useRef<TheatreBreathData>(createInitialData());

		// Start breathing animation sequence
		useEffect(() => {
			// Play the sequence in a loop
			sequence.play({
				iterationCount: Number.POSITIVE_INFINITY,
				rate: 1,
			});

			return () => {
				sequence.pause();
			};
		}, []);

		// Subscribe to Theatre.js breath cycle object
		useEffect(() => {
			const unsubscribe = breathCycleObj.onValuesChange((values) => {
				// Update breath values from Theatre.js
				Object.assign(dataRef.current, values);
			});

			return unsubscribe;
		}, []);

		// Update time each frame
		useFrame((state, delta) => {
			dataRef.current.time = state.clock.elapsedTime;
			dataRef.current.delta = delta;
		});

		// Stable context value
		const contextValue = useMemo(() => dataRef, []);

		return (
			<TheatreBreathContext.Provider value={contextValue}>
				{children}
			</TheatreBreathContext.Provider>
		);
	},
);

/**
 * Hook to access Theatre.js breath values
 *
 * Returns a ref to avoid re-renders - read values in useFrame loops.
 *
 * @example
 * ```tsx
 * const breath = useTheatreBreath();
 *
 * useFrame(() => {
 *   const { breathPhase, crystallization } = breath.current;
 *   // Animate based on breath values...
 * });
 * ```
 */
export function useTheatreBreath(): React.MutableRefObject<TheatreBreathData> {
	const ctx = useContext(TheatreBreathContext);
	if (!ctx) {
		throw new Error(
			'useTheatreBreath must be used inside TheatreBreathProvider',
		);
	}
	return ctx;
}
