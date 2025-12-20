import { useSpring, useMotionValue, MotionValue } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { BreathState } from './useBreathSync';
import { VisualizationConfig } from '../lib/config';

export interface BreathingSpringConfig {
  stiffness: number;  // Maps to tension
  damping: number;    // Maps to friction
  restDelta?: number; // Threshold for "at rest"
}

/**
 * Calculate target scale based on breath phase and progress
 */
export function calculateTargetScale(
  breathState: BreathState,
  config: VisualizationConfig
): number {
  const { phase, progress } = breathState;
  const { breatheInScale, breatheOutScale, holdOscillation, holdOscillationSpeed } = config;

  if (phase === 'in') {
    // Breathing in: scale from breatheInScale to breatheOutScale
    return breatheInScale + (breatheOutScale - breatheInScale) * progress;
  } else if (phase === 'out') {
    // Breathing out: scale from breatheOutScale to breatheInScale
    return breatheOutScale - (breatheOutScale - breatheInScale) * progress;
  } else if (phase === 'hold-in') {
    // Holding after inhale: subtle oscillation around breatheOutScale
    const oscillation = Math.sin(Date.now() * holdOscillationSpeed) * holdOscillation;
    return breatheOutScale + oscillation;
  } else {
    // Holding after exhale: subtle oscillation around breatheInScale
    const oscillation = Math.sin(Date.now() * holdOscillationSpeed) * holdOscillation;
    return breatheInScale + oscillation;
  }
}

/**
 * Hook that provides a Framer Motion spring-animated scale value
 * that follows the breathing state
 */
export function useBreathingSpring(
  breathState: BreathState,
  config: VisualizationConfig
): MotionValue<number> {
  const targetValue = useMotionValue(1);

  // Configure spring with app's physics parameters
  const scale = useSpring(targetValue, {
    stiffness: config.mainSpringTension,
    damping: config.mainSpringFriction,
    restDelta: 0.001,
  });

  // Update target when breath state changes
  useEffect(() => {
    const targetScale = calculateTargetScale(breathState, config);
    targetValue.set(targetScale);
  }, [breathState.phase, breathState.progress, config, targetValue]);

  return scale;
}

/**
 * Hook that provides multiple spring values for particle animations
 * with variance for organic movement
 */
export function useParticleSpring(
  breathState: BreathState,
  config: VisualizationConfig,
  _particleId: number
): MotionValue<number> {
  // Create unique spring parameters for this particle
  const stiffnessRef = useRef(
    config.springTension + Math.random() * config.springTensionVariance
  );
  const dampingRef = useRef(
    config.springFriction + Math.random() * config.springFrictionVariance
  );

  const targetValue = useMotionValue(1);

  const scale = useSpring(targetValue, {
    stiffness: stiffnessRef.current,
    damping: dampingRef.current,
    restDelta: 0.001,
  });

  useEffect(() => {
    const targetScale = calculateTargetScale(breathState, config);
    targetValue.set(targetScale);
  }, [breathState.phase, breathState.progress, config, targetValue]);

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
  friction: number
): BreathingSpringConfig {
  return {
    stiffness: tension,
    damping: friction,
    restDelta: 0.001,
  };
}
