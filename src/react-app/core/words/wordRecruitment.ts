/**
 * Word recruitment system
 * Selects scaffold particles to form words using nearest-neighbour matching
 */

import { PARTICLE_TYPES, WORD_CONFIG } from '../constants';
import type { Vec3 } from '../types';
import { GLYPH_DATA, getWordWidth, interpolateLetterPoints } from './glyphData';

/**
 * Layout word in 3D space
 * Returns target positions for each particle in the word
 */
export function layoutWord(
	word: string,
	scale: number = 0.3,
	zOffset: number = 0.5, // Position word in front of sphere
): Vec3[] {
	const letterSpacing = 0.15;
	const wordWidth = getWordWidth(word, letterSpacing);

	// Center the word
	let currentX = (-wordWidth * scale) / 2;
	const targets: Vec3[] = [];

	for (const char of word) {
		const letter = char.toUpperCase();
		const glyph = GLYPH_DATA[letter] || GLYPH_DATA[char];

		if (!glyph) {
			// Skip unknown characters but add spacing
			currentX += 0.3 * scale;
			continue;
		}

		if (glyph.points.length === 0) {
			// Space character
			currentX += glyph.width * scale;
			continue;
		}

		// Get interpolated points for smoother particle distribution
		const points = interpolateLetterPoints(letter, 4);

		// Add each point as a target position
		for (const [px, py] of points) {
			targets.push({
				x: currentX + px * glyph.width * scale,
				y: (py - 0.5) * scale, // Center vertically
				z: zOffset,
			});
		}

		currentX += (glyph.width + letterSpacing) * scale;
	}

	return targets;
}

/**
 * Layout word with letter indices for staggered reveal
 * Returns targets with letter index for animation timing
 */
export interface TargetWithLetter extends Vec3 {
	letterIndex: number;
}

export function layoutWordWithLetterIndices(
	word: string,
	scale: number = 0.3,
	zOffset: number = 0.5,
): TargetWithLetter[] {
	const letterSpacing = 0.15;
	const wordWidth = getWordWidth(word, letterSpacing);

	let currentX = (-wordWidth * scale) / 2;
	const targets: TargetWithLetter[] = [];
	let letterIndex = 0;

	for (const char of word) {
		const letter = char.toUpperCase();
		const glyph = GLYPH_DATA[letter] || GLYPH_DATA[char];

		if (!glyph) {
			currentX += 0.3 * scale;
			letterIndex++;
			continue;
		}

		if (glyph.points.length === 0) {
			currentX += glyph.width * scale;
			letterIndex++;
			continue;
		}

		const points = interpolateLetterPoints(letter, 4);

		for (const [px, py] of points) {
			targets.push({
				x: currentX + px * glyph.width * scale,
				y: (py - 0.5) * scale,
				z: zOffset,
				letterIndex,
			});
		}

		currentX += (glyph.width + letterSpacing) * scale;
		letterIndex++;
	}

	return targets;
}

/**
 * Recruit scaffold particles for word formation
 * Uses nearest-neighbour selection for smooth transitions
 */
export function recruitParticles(
	word: string,
	scaffoldPositions: Float32Array,
	activeParticleCount: number,
	scale: number = 0.3,
): Map<number, TargetWithLetter> {
	const targets = layoutWordWithLetterIndices(word, scale);

	// Limit to max particles per word
	const limitedTargets = targets.slice(0, WORD_CONFIG.maxParticlesPerWord);

	const recruited = new Map<number, TargetWithLetter>();
	const usedIndices = new Set<number>();

	// For each target position, find the nearest available scaffold particle
	for (const target of limitedTargets) {
		let nearestIndex = -1;
		let nearestDist = Infinity;

		for (let i = 0; i < activeParticleCount; i++) {
			if (usedIndices.has(i)) continue;

			const i4 = i * 4;
			const type = scaffoldPositions[i4 + 3];

			// Only use scaffold particles
			if (type !== PARTICLE_TYPES.SCAFFOLD) continue;

			const dx = scaffoldPositions[i4] - target.x;
			const dy = scaffoldPositions[i4 + 1] - target.y;
			const dz = scaffoldPositions[i4 + 2] - target.z;
			const dist = dx * dx + dy * dy + dz * dz;

			if (dist < nearestDist) {
				nearestDist = dist;
				nearestIndex = i;
			}
		}

		if (nearestIndex >= 0) {
			recruited.set(nearestIndex, target);
			usedIndices.add(nearestIndex);
		}
	}

	return recruited;
}

/**
 * Create recruitment data texture
 * Stores target positions and letter indices for GPU
 */
export function createRecruitmentTexture(
	fboSize: number,
	recruitedParticles: Map<number, TargetWithLetter>,
): Float32Array {
	const capacity = fboSize * fboSize;
	const data = new Float32Array(capacity * 4);

	// Initialize all to zero (no recruitment)
	for (let i = 0; i < capacity; i++) {
		const i4 = i * 4;
		data[i4] = 0; // Target X
		data[i4 + 1] = 0; // Target Y
		data[i4 + 2] = 0; // Target Z
		data[i4 + 3] = -1; // Letter index (-1 = not recruited)
	}

	// Set recruited particle targets
	for (const [particleIndex, target] of recruitedParticles) {
		const i4 = particleIndex * 4;
		data[i4] = target.x;
		data[i4 + 1] = target.y;
		data[i4 + 2] = target.z;
		data[i4 + 3] = target.letterIndex;
	}

	return data;
}

/**
 * Get letter reveal progress for staggered animation
 */
export function getLetterRevealProgress(
	letterIndex: number,
	letterCount: number,
	overallProgress: number,
): number {
	const revealPoint = letterIndex / letterCount;
	// Each letter reveals over a portion of the animation
	const revealDuration = 0.3;

	if (overallProgress < revealPoint) {
		return 0;
	}

	const letterProgress = (overallProgress - revealPoint) / revealDuration;
	return Math.min(1, Math.max(0, letterProgress));
}
