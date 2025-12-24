/**
 * Word Recruitment System
 * Finds nearest scaffold particles to form words
 */

import type { Vec3 } from '../types';
import { getGlyph, getWordWidth } from './glyphData';

interface LayoutPoint {
	x: number;
	y: number;
	z: number;
	letterIndex: number;
}

/**
 * Layout word in 3D space
 * Centers the word and positions letters with proper spacing
 */
export function layoutWord(
	word: string,
	scale: number = 0.5,
	zOffset: number = 0,
): LayoutPoint[] {
	const points: LayoutPoint[] = [];
	const totalWidth = getWordWidth(word);
	let xOffset = (-totalWidth * scale) / 2; // Center horizontally
	const spacing = 0.15 * scale;

	for (let i = 0; i < word.length; i++) {
		const char = word[i];
		const glyph = getGlyph(char);

		// Add points for this letter
		for (const point of glyph.points) {
			points.push({
				x: xOffset + point.x * scale * glyph.width,
				y: (point.y - 0.5) * scale, // Center vertically
				z: zOffset,
				letterIndex: i,
			});
		}

		xOffset += (((glyph.width + spacing) * scale) / glyph.width) * glyph.width;
		xOffset += spacing;
	}

	return points;
}

/**
 * Find nearest scaffold particles to recruit for word formation
 * Uses greedy nearest-neighbor algorithm
 */
export function recruitParticles(
	word: string,
	scaffoldPositions: Float32Array,
	particleCount: number,
	scale: number = 0.5,
): Map<number, Vec3> {
	const targetPositions = layoutWord(word, scale, 1.5); // Z offset to appear in front
	const recruited = new Map<number, Vec3>();
	const usedIndices = new Set<number>();

	// For each target position, find the nearest available scaffold particle
	for (const target of targetPositions) {
		let nearestIndex = -1;
		let nearestDist = Number.POSITIVE_INFINITY;

		for (let i = 0; i < particleCount; i++) {
			if (usedIndices.has(i)) continue;

			const idx = i * 4;
			const particleType = scaffoldPositions[idx + 3];

			// Only recruit scaffold particles (type 0)
			if (particleType !== 0) continue;

			const dx = scaffoldPositions[idx] - target.x;
			const dy = scaffoldPositions[idx + 1] - target.y;
			const dz = scaffoldPositions[idx + 2] - target.z;
			const dist = dx * dx + dy * dy + dz * dz;

			if (dist < nearestDist) {
				nearestDist = dist;
				nearestIndex = i;
			}
		}

		if (nearestIndex >= 0) {
			recruited.set(nearestIndex, {
				x: target.x,
				y: target.y,
				z: target.z,
			});
			usedIndices.add(nearestIndex);
		}
	}

	return recruited;
}

/**
 * Calculate letter count for a word
 */
export function getLetterCount(word: string): number {
	return word.replace(/\s/g, '').length;
}

/**
 * Get point count needed for a word
 */
export function getPointCount(word: string): number {
	let count = 0;
	for (const char of word) {
		const glyph = getGlyph(char);
		count += glyph.points.length;
	}
	return count;
}
