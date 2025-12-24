import { type MotionValue, useMotionValue, useSpring } from 'framer-motion';
import { useEffect } from 'react';
import type { VisualizationConfig } from '../lib/config';
import type { BreathState } from './useBreathSync';

export interface BreathingSpringConfig {
	stiffness: number; // Maps to tension
	damping: number; // Maps to friction
	restDelta?: number; // Threshold for "at rest"
}

/**
 * Calculate target scale based on breath phase and progress
 */
export function calculateTargetScale(
	breathState: BreathState,
	config: VisualizationConfig,
): number {
	const { phase, progress } = breathState;
	const {
		breatheInScale,
		breatheOutScale,
		holdOscillation,
		holdOscillationSpeed,
	} = config;

	if (phase === 'in') {
		// REVERSED: Breathing in contracts (expanded → contracted)
		// Like taking a controlled breath, visualization pulls inward
		return breatheOutScale - (breatheOutScale - breatheInScale) * progress;
	} else if (phase === 'out') {
		// REVERSED: Breathing out expands (contracted → expanded)
		// Like relaxing a muscle, visualization spreads outward
		return breatheInScale + (breatheOutScale - breatheInScale) * progress;
	} else if (phase === 'hold-in') {
		// Holding after inhale: subtle oscillation around contracted state
		const oscillation =
			Math.sin(Date.now() * holdOscillationSpeed) * holdOscillation;
		return breatheInScale + oscillation;
	} else {
		// Holding after exhale: subtle oscillation around expanded state
		const oscillation =
			Math.sin(Date.now() * holdOscillationSpeed) * holdOscillation;
		return breatheOutScale + oscillation;
	}
}

/**
 * Hook that provides a Framer Motion spring-animated scale value
 * that follows the breathing state
 */
export function useBreathingSpring(
	breathState: BreathState,
	config: VisualizationConfig,
): MotionValue<number> {
	const targetValue = useMotionValue(1);

	// Configure spring with app's physics parameters
	const scale = useSpring(targetValue, {
		stiffness: config.mainSpringTension,
		damping: config.mainSpringFriction,
		restDelta: 0.001,
	});

	// Update target when breath state changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: targetValue is stable (MotionValue), and we intentionally depend on specific config properties only
	useEffect(() => {
		const targetScale = calculateTargetScale(breathState, config);
		targetValue.set(targetScale);
	}, [breathState, config]);

	return scale;
}

/**
 * Convert our Spring class parameters to Framer Motion spring config
 *
 * Our Spring class:
 * - tension: spring stiffness (higher = faster)
 * - friction: damping (higher = less bouncy)
 *
 * Framer Motion:
 * - stiffness: spring constant (same as tension)
 * - damping: resistance (same as friction)
 */
export function toFramerSpringConfig(
	tension: number,
	friction: number,
): BreathingSpringConfig {
	return {
		stiffness: tension,
		damping: friction,
		restDelta: 0.001,
	};
}
