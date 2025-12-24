/**
 * Breath-specific easing functions matched to physiology
 *
 * These curves are designed to match natural breathing mechanics:
 * - Inhale: Slow start (diaphragm engaging), accelerates, slows at capacity
 * - Exhale: Quick initial release, then gradual controlled release
 * - Hold: Very subtle settling oscillation
 */

export type PhaseType = 'in' | 'hold-in' | 'out' | 'hold-out';

/**
 * Easing function for inhale phase
 * Matches natural diaphragmatic breathing: slow start, peak mid-breath, slow at lung capacity
 */
function easeInhale(t: number): number {
	// Custom curve: slow start, faster middle, slow end (like filling a balloon)
	// Uses a combination of ease-in-out with slight bias toward slow start
	const t2 = t * t;
	const t3 = t2 * t;
	return 3 * t2 - 2 * t3 + t * 0.1 * Math.sin(t * Math.PI);
}

/**
 * Easing function for exhale phase
 * Quick initial release (natural relaxation), then controlled slow release
 * This matches 4-7-8 breathing's emphasis on long, controlled exhale
 */
function easeExhale(t: number): number {
	// Ease-out quad with slight overshoot at start for that "release" feeling
	const release = 1 - (1 - t) * (1 - t);
	// Add subtle "controlled" feel in the latter half
	const control = t < 0.3 ? t * 1.1 : 0.33 + (t - 0.3) * 0.957;
	return release * 0.7 + control * 0.3;
}

/**
 * Easing for hold phases - creates subtle "settling" feel
 * Very minor oscillation that diminishes, like a pendulum coming to rest
 */
function easeHold(t: number): number {
	// Damped oscillation - settling into stillness
	const damping = 1 - t * 0.5;
	const oscillation = Math.sin(t * Math.PI * 2) * 0.008 * damping;
	return t + oscillation;
}

/**
 * Apply physiological easing to raw progress based on phase type
 */
export function applyBreathEasing(
	progress: number,
	phaseType: PhaseType,
): number {
	const clamped = Math.max(0, Math.min(1, progress));

	switch (phaseType) {
		case 'in':
			return easeInhale(clamped);
		case 'out':
			return easeExhale(clamped);
		case 'hold-in':
		case 'hold-out':
			return easeHold(clamped);
		default:
			return clamped;
	}
}

/**
 * Calculate anticipation factor (peaks in final 5-8% of phase)
 * Used to prepare particles for upcoming transition
 */
export function getAnticipationFactor(progress: number): number {
	if (progress < 0.92) return 0;
	// Smooth ramp up in final 8%
	const t = (progress - 0.92) / 0.08;
	return t * t * (3 - 2 * t); // Smooth step
}

/**
 * Calculate overshoot factor (peaks in first 5-8% of phase)
 * Creates natural "settling" after transition
 */
export function getOvershootFactor(progress: number): number {
	if (progress > 0.15) return 0;
	// Quick peak then decay
	const t = progress / 0.15;
	return Math.sin(t * Math.PI) * 0.3;
}

/**
 * Get vertical drift direction for diaphragmatic breathing cue
 * Inhale: downward drift (diaphragm descends)
 * Exhale: upward drift (diaphragm ascends)
 */
export function getDiaphragmDirection(phaseType: PhaseType): number {
	switch (phaseType) {
		case 'in':
			return -1; // Down
		case 'out':
			return 1; // Up
		default:
			return 0; // Holds: no drift
	}
}

/**
 * Get color temperature shift for phase
 * Returns a value from -1 (cool) to 1 (warm)
 */
export function getColorTemperature(
	phaseType: PhaseType,
	progress: number,
): number {
	switch (phaseType) {
		case 'in':
			// Cool during inhale, cooling as we go
			return -0.3 - progress * 0.2;
		case 'hold-in':
			// Neutral, very slight warmth
			return 0.1;
		case 'out':
			// Warm during exhale, warming as we release
			return 0.3 + progress * 0.3;
		case 'hold-out':
			// Deep, still - slight cool
			return -0.1;
		default:
			return 0;
	}
}

/**
 * Get crystallization factor for hold phases
 * Returns 0-1 where 1 is maximum crystallization (stillness)
 */
export function getCrystallizationFactor(
	phaseType: PhaseType,
	progress: number,
): number {
	if (phaseType !== 'hold-in' && phaseType !== 'hold-out') {
		return 0;
	}
	// Ramp up crystallization over the hold
	// Quick initial settling, then stable
	return Math.min(1, progress * 2);
}

/**
 * Get breath wave intensity for sound-like visualization
 * Peaks at phase transitions
 */
export function getBreathWaveIntensity(
	progress: number,
	phaseType: PhaseType,
): number {
	// Wave at start of inhale (the "gasp")
	if (phaseType === 'in' && progress < 0.15) {
		return Math.sin((progress / 0.15) * Math.PI) * 0.8;
	}
	// Gradual wave during exhale (the "whoosh")
	if (phaseType === 'out') {
		return Math.sin(progress * Math.PI) * 0.5;
	}
	// Occasional heartbeat pulse during holds
	if (phaseType === 'hold-in' || phaseType === 'hold-out') {
		// Pulse every ~1.5 seconds worth of progress
		const pulsePhase = (progress * 4) % 1;
		if (pulsePhase < 0.1) {
			return Math.sin((pulsePhase / 0.1) * Math.PI) * 0.2;
		}
	}
	return 0;
}
