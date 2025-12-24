/**
 * Word Formation System
 * Handles word triggering, particle recruitment, and animation timeline
 */

import { getWordPoints, type WordPoint } from './glyphs';

// === CONFIGURATION ===
export const WORD_CONFIG = {
	// Word duration in milliseconds
	WORD_DURATION: 4000,

	// Particles per letter for word formation
	PARTICLES_PER_LETTER: 25,

	// Minimum number of inhales between words
	MIN_GAP: 2,

	// Base probability of word trigger at session start
	BASE_PROBABILITY: 0.1,

	// Maximum probability after 2 minutes
	MAX_PROBABILITY: 0.25,

	// Time to reach max probability (seconds)
	RAMP_DURATION: 120,

	// Word scale factor
	WORD_SCALE: 3.5,

	// Formation phase (0 to this value)
	FORMATION_END: 0.7,

	// Dissolve phase (FORMATION_END to 1.0)
	DISSOLVE_START: 0.7,

	// Letter reveal duration overlap
	LETTER_OVERLAP: 0.4,
} as const;

// === WORD LIST ===
// Meditation and breathing-related words
export const WORD_LIST = [
	'CALM',
	'PEACE',
	'REST',
	'EASE',
	'FLOW',
	'SOFT',
	'WARM',
	'SAFE',
	'HERE',
	'NOW',
	'LOVE',
	'HOPE',
	'JOY',
	'BE',
	'BREATHE',
	'RELAX',
	'STILL',
	'QUIET',
	'GENTLE',
	'KIND',
	'TRUST',
	'FREE',
	'OPEN',
	'LET GO',
	'RELEASE',
	'ACCEPT',
	'ALLOW',
	'PRESENT',
	'AWARE',
	'LIGHT',
	'FLOAT',
	'DRIFT',
] as const;

// === STATE TYPES ===
export type WordState = 'idle' | 'forming';

export interface WordFormationState {
	state: WordState;
	word: string | null;
	startTime: number;
	progress: number; // 0-1 animation progress
	targetPositions: WordPoint[];
	recruitedIndices: number[];
}

export interface RecruitedParticle {
	particleIndex: number;
	targetPosition: WordPoint;
	letterIndex: number;
}

// === WORD SYSTEM CLASS ===
export class WordSystem {
	private state: WordFormationState;
	private inhaleCount: number = 0;
	private lastWordInhale: number = 0;
	private sessionStartTime: number;
	private lastPhaseType: number = -1;
	private usedWords: Set<string> = new Set();

	constructor() {
		this.sessionStartTime = Date.now();
		this.state = {
			state: 'idle',
			word: null,
			startTime: 0,
			progress: 0,
			targetPositions: [],
			recruitedIndices: [],
		};
	}

	/**
	 * Get current word formation state
	 */
	getState(): WordFormationState {
		return this.state;
	}

	/**
	 * Check if currently forming a word
	 */
	isForming(): boolean {
		return this.state.state === 'forming';
	}

	/**
	 * Update the word system each frame
	 * Returns true if word formation state changed
	 */
	update(
		currentTime: number,
		phaseType: number,
		positions: Float32Array,
		particleCount: number,
	): boolean {
		// Detect new inhale phase start
		if (phaseType === 0 && this.lastPhaseType !== 0) {
			this.inhaleCount++;
			this.onInhaleStart(currentTime, positions, particleCount);
		}
		this.lastPhaseType = phaseType;

		// Update word animation progress
		if (this.state.state === 'forming') {
			const elapsed = currentTime - this.state.startTime;
			this.state.progress = Math.min(1, elapsed / WORD_CONFIG.WORD_DURATION);

			// Check if word animation is complete
			if (this.state.progress >= 1) {
				this.endWordFormation();
				return true;
			}
		}

		return false;
	}

	/**
	 * Called at the start of each inhale phase
	 */
	private onInhaleStart(
		currentTime: number,
		positions: Float32Array,
		particleCount: number,
	): void {
		// Don't trigger if already forming
		if (this.state.state === 'forming') return;

		// Check if we should trigger a word
		if (this.shouldTriggerWord()) {
			this.triggerWord(currentTime, positions, particleCount);
		}
	}

	/**
	 * Determine if a word should be triggered
	 */
	private shouldTriggerWord(): boolean {
		// Minimum gap between words
		if (this.inhaleCount - this.lastWordInhale < WORD_CONFIG.MIN_GAP) {
			return false;
		}

		// Calculate probability based on session duration
		const sessionDuration = (Date.now() - this.sessionStartTime) / 1000;
		const ramp = Math.min(sessionDuration / WORD_CONFIG.RAMP_DURATION, 1);
		const probability =
			WORD_CONFIG.BASE_PROBABILITY +
			(WORD_CONFIG.MAX_PROBABILITY - WORD_CONFIG.BASE_PROBABILITY) * ramp;

		return Math.random() < probability;
	}

	/**
	 * Select a random word, avoiding recently used ones
	 */
	private selectWord(): string {
		// Filter out recently used words
		const availableWords = WORD_LIST.filter((w) => !this.usedWords.has(w));

		// If all words used, reset
		if (availableWords.length === 0) {
			this.usedWords.clear();
			return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
		}

		const word =
			availableWords[Math.floor(Math.random() * availableWords.length)];
		this.usedWords.add(word);

		// Keep used words set manageable
		if (this.usedWords.size > WORD_LIST.length / 2) {
			// Remove oldest entries
			const entries = Array.from(this.usedWords);
			for (let i = 0; i < entries.length / 2; i++) {
				this.usedWords.delete(entries[i]);
			}
		}

		return word;
	}

	/**
	 * Trigger word formation
	 */
	private triggerWord(
		currentTime: number,
		positions: Float32Array,
		particleCount: number,
	): void {
		const word = this.selectWord();
		const targetPositions = getWordPoints(
			word,
			WORD_CONFIG.PARTICLES_PER_LETTER,
			WORD_CONFIG.WORD_SCALE,
		);

		// Recruit particles using nearest-neighbor algorithm
		const recruitedIndices = this.recruitParticles(
			targetPositions,
			positions,
			particleCount,
		);

		this.state = {
			state: 'forming',
			word,
			startTime: currentTime,
			progress: 0,
			targetPositions,
			recruitedIndices,
		};

		this.lastWordInhale = this.inhaleCount;
	}

	/**
	 * Recruit particles for word formation using nearest-neighbor algorithm
	 */
	private recruitParticles(
		targetPositions: WordPoint[],
		positions: Float32Array,
		particleCount: number,
	): number[] {
		const usedIndices = new Set<number>();
		const recruited: number[] = [];

		for (const target of targetPositions) {
			let nearestIdx = -1;
			let nearestDist = Infinity;

			// Search all particles
			for (let i = 0; i < particleCount; i++) {
				if (usedIndices.has(i)) continue;

				const px = positions[i * 3];
				const py = positions[i * 3 + 1];
				const pz = positions[i * 3 + 2];

				// Distance to target position
				const dx = px - target.x;
				const dy = py - target.y;
				const dz = pz - target.z;
				const dist = dx * dx + dy * dy + dz * dz;

				if (dist < nearestDist) {
					nearestDist = dist;
					nearestIdx = i;
				}
			}

			if (nearestIdx >= 0) {
				usedIndices.add(nearestIdx);
				recruited.push(nearestIdx);
			}
		}

		return recruited;
	}

	/**
	 * End word formation and release particles
	 */
	private endWordFormation(): void {
		this.state = {
			state: 'idle',
			word: null,
			startTime: 0,
			progress: 0,
			targetPositions: [],
			recruitedIndices: [],
		};
	}

	/**
	 * Force end word formation (for cleanup)
	 */
	forceEnd(): void {
		this.endWordFormation();
	}

	/**
	 * Calculate interpolation factor for a particle at a given letter index
	 * Returns 0-1 where 0 = at sphere position, 1 = at letter position
	 */
	getLetterProgress(letterIndex: number, totalLetters: number): number {
		const { progress } = this.state;

		// Formation phase: letters reveal sequentially
		if (progress < WORD_CONFIG.FORMATION_END) {
			const formProgress = progress / WORD_CONFIG.FORMATION_END;
			const letterRevealPoint = letterIndex / Math.max(1, totalLetters);

			// Each letter starts revealing at its proportional point
			const letterProgress = Math.max(
				0,
				Math.min(
					1,
					(formProgress * 1.5 - letterRevealPoint) / WORD_CONFIG.LETTER_OVERLAP,
				),
			);

			// Smooth easing (smoothstep)
			return letterProgress * letterProgress * (3 - 2 * letterProgress);
		}

		// Dissolve phase: all letters fade out together
		const dissolveProgress =
			(progress - WORD_CONFIG.DISSOLVE_START) /
			(1.0 - WORD_CONFIG.DISSOLVE_START);
		const dissolve = Math.max(0, Math.min(1, dissolveProgress));

		// Ease out the dissolve
		const formFactor = 1 - dissolve * dissolve;
		return formFactor;
	}

	/**
	 * Reset session (for testing or when user returns after inactivity)
	 */
	resetSession(): void {
		this.sessionStartTime = Date.now();
		this.inhaleCount = 0;
		this.lastWordInhale = 0;
		this.usedWords.clear();
		this.endWordFormation();
	}
}

// === UTILITY FUNCTIONS ===

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

/**
 * Smooth step function
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
	const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
	return t * t * (3 - 2 * t);
}
