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
 * Extended breath data including time and view offset
 */
export interface TheatreBreathData extends BreathCycleProps {
	time: number;
	delta: number;
	viewOffset: { x: number; y: number };
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
		viewOffset: { x: 0, y: 0 },
	};
}

const TheatreBreathContext =
	createContext<React.MutableRefObject<TheatreBreathData> | null>(null);

const PARALLAX_STRENGTH = 0.02;

interface TheatreBreathProviderProps {
	children: ReactNode;
}

/**
 * Provider component that wraps the 3D scene and provides breath values
 */
export const TheatreBreathProvider = memo(
	({ children }: TheatreBreathProviderProps) => {
		const dataRef = useRef<TheatreBreathData>(createInitialData());
		const viewOffsetRef = useRef({ x: 0, y: 0 });

		// Start breathing animation sequence
		useEffect(() => {
			// Play the sequence in a loop
			// Note: The sequence duration is defined by keyframes in Studio.
			// Until keyframes are designed, this plays the default 10s loop.
			// After adding keyframes at 16s in Studio, the full breath cycle will play.
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

		// Track mouse/touch for parallax effect
		useEffect(() => {
			const onMouse = (e: MouseEvent) => {
				viewOffsetRef.current.x =
					(e.clientX / window.innerWidth - 0.5) * 2 * PARALLAX_STRENGTH;
				viewOffsetRef.current.y =
					(e.clientY / window.innerHeight - 0.5) * 2 * PARALLAX_STRENGTH;
			};

			const onOrientation = (e: DeviceOrientationEvent) => {
				if (e.gamma !== null && e.beta !== null) {
					viewOffsetRef.current.x = (e.gamma / 90) * PARALLAX_STRENGTH;
					viewOffsetRef.current.y = (e.beta / 90) * PARALLAX_STRENGTH;
				}
			};

			window.addEventListener('mousemove', onMouse);
			window.addEventListener('deviceorientation', onOrientation);

			return () => {
				window.removeEventListener('mousemove', onMouse);
				window.removeEventListener('deviceorientation', onOrientation);
			};
		}, []);

		// Update time values each frame
		useFrame((state, delta) => {
			dataRef.current.time = state.clock.elapsedTime;
			dataRef.current.delta = delta;
			dataRef.current.viewOffset = viewOffsetRef.current;
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
