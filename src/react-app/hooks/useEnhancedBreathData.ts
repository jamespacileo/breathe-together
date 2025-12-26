import { useMemo } from 'react';
import {
	applyBreathEasing,
	getAnticipationFactor,
	getBreathWaveIntensity,
	getColorTemperature,
	getCrystallizationFactor,
	getDiaphragmDirection,
	getOvershootFactor,
	getPhaseTransitionBlend,
} from '../lib/breathEasing';
import { PHASE_TYPE_MAP } from '../lib/patterns';
import type { BreathState } from './useBreathSync';
import { useViewOffset, type ViewOffset } from './useViewOffset';

/**
 * Enhanced breath data with all subtle effects for visualization
 */
export interface EnhancedBreathData {
	/** 0-1 where 1 = fully inhaled/contracted */
	breathPhase: number;
	/** 0=inhale, 1=hold-in, 2=exhale, 3=hold-out */
	phaseType: number;
	/** 0-1 raw progress within current phase */
	rawProgress: number;
	/** Progress with physiological easing applied */
	easedProgress: number;
	/** 0-1 peaks in final 6% of phase (pre-transition) */
	anticipation: number;
	/** 0-1 peaks in first 12% of phase (settling after transition) */
	overshoot: number;
	/** -1=down (inhale), 0=hold, 1=up (exhale) */
	diaphragmDirection: number;
	/** -1 (cool) to 1 (warm) based on phase */
	colorTemperature: number;
	/** 0-1 stillness intensity during holds */
	crystallization: number;
	/** Wave-like intensity at transitions */
	breathWave: number;
	/** 0-1 smooth blend at phase boundaries */
	phaseTransitionBlend: number;
	/** Micro-saccade parallax offset */
	viewOffset: ViewOffset;
}

/**
 * Calculate enhanced breath data from raw breath state
 */
export function getEnhancedBreathData(
	state: BreathState,
	viewOffset: ViewOffset,
): EnhancedBreathData {
	const { phase, progress } = state;

	// Apply physiological easing
	const easedProgress = applyBreathEasing(progress, phase);

	// Get anticipation (peaks at end of phase)
	const anticipation = getAnticipationFactor(progress);

	// Get overshoot (peaks at start of phase)
	const overshoot = getOvershootFactor(progress);

	// Diaphragmatic direction
	const diaphragmDirection = getDiaphragmDirection(phase);

	// Color temperature
	const colorTemperature = getColorTemperature(phase, progress);

	// Crystallization for holds
	const crystallization = getCrystallizationFactor(phase, progress);

	// Breath wave visualization
	const breathWave = getBreathWaveIntensity(progress, phase);

	// Phase transition blend
	const phaseTransitionBlend = getPhaseTransitionBlend(progress);

	// Calculate breathPhase (0-1 where 1 = fully inhaled/contracted)
	let breathPhase: number;
	const phaseType = PHASE_TYPE_MAP[phase] ?? 0;

	switch (phase) {
		case 'in':
			breathPhase = easedProgress;
			break;
		case 'hold-in':
			breathPhase = 1;
			break;
		case 'out':
			breathPhase = 1 - easedProgress;
			break;
		case 'hold-out':
			breathPhase = 0;
			break;
		default:
			breathPhase = 0;
	}

	return {
		breathPhase,
		phaseType,
		rawProgress: progress,
		easedProgress,
		anticipation,
		overshoot,
		diaphragmDirection,
		colorTemperature,
		crystallization,
		breathWave,
		phaseTransitionBlend,
		viewOffset,
	};
}

/**
 * Hook that provides enhanced breath data with all visualization effects
 * Combines raw breath state with view offset and physiological easing
 */
export function useEnhancedBreathData(
	breathState: BreathState,
): EnhancedBreathData {
	const viewOffsetRef = useViewOffset();

	// Note: viewOffset is accessed via ref to avoid re-renders per R3F best practices
	return useMemo(
		() => getEnhancedBreathData(breathState, viewOffsetRef.current),
		[breathState, viewOffsetRef.current],
	);
}
