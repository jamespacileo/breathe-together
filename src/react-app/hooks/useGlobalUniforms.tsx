import { useFrame } from '@react-three/fiber';
import {
	type ReactNode,
	createContext,
	useContext,
	useEffect,
	useMemo,
	useRef,
} from 'react';
import { getBreathState } from '../lib/breathUtils';
import { getEnhancedBreathData } from './useEnhancedBreathData';
import type { ViewOffset } from './useViewOffset';

/**
 * Global uniforms data structure
 * Contains all breath-related values computed once per frame
 */
export interface GlobalUniformsData {
	// Time
	time: number;
	delta: number;

	// Core breath values
	breathPhase: number;
	phaseType: number;
	rawProgress: number;
	easedProgress: number;

	// Subtle effects
	anticipation: number;
	overshoot: number;
	diaphragmDirection: number;
	colorTemperature: number;
	crystallization: number;
	breathWave: number;
	phaseTransitionBlend: number;

	// View offset for parallax
	viewOffset: ViewOffset;
}

/**
 * Initial values for global uniforms
 */
function createInitialData(): GlobalUniformsData {
	return {
		time: 0,
		delta: 0.016,
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
		viewOffset: { x: 0, y: 0 },
	};
}

const GlobalUniformsContext =
	createContext<React.MutableRefObject<GlobalUniformsData> | null>(null);

const PARALLAX_STRENGTH = 0.02;

interface GlobalUniformsProviderProps {
	children: ReactNode;
}

/**
 * GlobalUniformsProvider
 *
 * Provides centralized breath state computation for the entire 3D scene.
 * Computes getEnhancedBreathData() ONCE per frame instead of 6+ times.
 *
 * Usage:
 * 1. Wrap your Canvas content with this provider
 * 2. Use useGlobalUniforms() in any child component to access values
 * 3. Read values directly from the ref (no re-renders)
 */
export function GlobalUniformsProvider({
	children,
}: GlobalUniformsProviderProps) {
	const uniformsRef = useRef<GlobalUniformsData>(createInitialData());
	const viewOffsetRef = useRef<ViewOffset>({ x: 0, y: 0 });

	// Track mouse/touch position for parallax effect
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

	// Single computation point for entire scene
	useFrame((state, delta) => {
		const breathState = getBreathState();
		const breathData = getEnhancedBreathData(
			breathState,
			viewOffsetRef.current,
		);

		// Update ref values (no re-renders triggered)
		const u = uniformsRef.current;
		u.time = state.clock.elapsedTime;
		u.delta = delta;
		u.breathPhase = breathData.breathPhase;
		u.phaseType = breathData.phaseType;
		u.rawProgress = breathData.rawProgress;
		u.easedProgress = breathData.easedProgress;
		u.anticipation = breathData.anticipation;
		u.overshoot = breathData.overshoot;
		u.diaphragmDirection = breathData.diaphragmDirection;
		u.colorTemperature = breathData.colorTemperature;
		u.crystallization = breathData.crystallization;
		u.breathWave = breathData.breathWave;
		u.phaseTransitionBlend = breathData.phaseTransitionBlend;
		u.viewOffset = breathData.viewOffset;
	});

	// Stable context value (the ref itself never changes)
	const contextValue = useMemo(() => uniformsRef, []);

	return (
		<GlobalUniformsContext.Provider value={contextValue}>
			{children}
		</GlobalUniformsContext.Provider>
	);
}

/**
 * Hook to access global uniforms from any component in the 3D scene
 *
 * Returns a ref to avoid re-renders - read values in useFrame loops.
 *
 * @example
 * ```tsx
 * const uniforms = useGlobalUniforms();
 *
 * useFrame(() => {
 *   const { breathPhase, phaseType, crystallization } = uniforms.current;
 *   // Use values for animation...
 * });
 * ```
 */
export function useGlobalUniforms(): React.MutableRefObject<GlobalUniformsData> {
	const ctx = useContext(GlobalUniformsContext);
	if (!ctx) {
		throw new Error(
			'useGlobalUniforms must be used inside GlobalUniformsProvider',
		);
	}
	return ctx;
}
