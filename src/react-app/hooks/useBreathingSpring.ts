import { type MotionValue, useMotionValue, useSpring } from 'framer-motion';
import { useEffect } from 'react';
import type { VisualizationConfig } from '../lib/config';
import type { BreathState } from './useBreathSync';

export interface BreathingSpringConfig {
	stiffness: number;
	damping: number;
	restDelta?: number;
}

// Fixed breathing animation parameters
const BREATH_IN_SCALE = 0.7;
const BREATH_OUT_SCALE = 1.2;
const HOLD_OSCILLATION = 0.02;
const HOLD_OSCILLATION_SPEED = 0.003;
const SPRING_STIFFNESS = 60;
const SPRING_DAMPING = 14;

/**
 * Calculate target scale based on breath phase and progress
 */
export function calculateTargetScale(breathState: BreathState): number {
	const { phase, progress } = breathState;

	if (phase === 'in') {
		return BREATH_OUT_SCALE - (BREATH_OUT_SCALE - BREATH_IN_SCALE) * progress;
	} else if (phase === 'out') {
		return BREATH_IN_SCALE + (BREATH_OUT_SCALE - BREATH_IN_SCALE) * progress;
	} else if (phase === 'hold-in') {
		const oscillation =
			Math.sin(Date.now() * HOLD_OSCILLATION_SPEED) * HOLD_OSCILLATION;
		return BREATH_IN_SCALE + oscillation;
	} else {
		const oscillation =
			Math.sin(Date.now() * HOLD_OSCILLATION_SPEED) * HOLD_OSCILLATION;
		return BREATH_OUT_SCALE + oscillation;
	}
}

/**
 * Hook that provides a Framer Motion spring-animated scale value
 * that follows the breathing state
 */
export function useBreathingSpring(
	breathState: BreathState,
	_config?: VisualizationConfig,
): MotionValue<number> {
	const targetValue = useMotionValue(1);

	const scale = useSpring(targetValue, {
		stiffness: SPRING_STIFFNESS,
		damping: SPRING_DAMPING,
		restDelta: 0.001,
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: targetValue is stable
	useEffect(() => {
		const targetScale = calculateTargetScale(breathState);
		targetValue.set(targetScale);
	}, [breathState]);

	return scale;
}

/**
 * Convert spring parameters to Framer Motion config
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
