/**
 * Word recruitment system
 * Recruits scaffold particles to form letter shapes
 */

import { type GlyphData, getGlyph, getWordWidth } from './glyphData';

export interface Vec3 {
	x: number;
	y: number;
	z: number;
}

export interface WordLayout {
	word: string;
	positions: Vec3[];
	letterIndices: number[]; // Which letter each position belongs to
}

/**
 * Layout word in 3D space centered at origin
 * Returns target positions for particles to form letters
 */
export function layoutWord(
	word: string,
	scale = 0.3,
	letterSpacing = 0.15,
	pointsPerLetter = 15,
): WordLayout {
	const positions: Vec3[] = [];
	const letterIndices: number[] = [];

	const totalWidth = getWordWidth(word, letterSpacing) * scale;
	let currentX = -totalWidth / 2;

	for (let letterIdx = 0; letterIdx < word.length; letterIdx++) {
		const char = word[letterIdx];
		const glyph = getGlyph(char);

		if (!glyph) continue;

		// For space character, just advance X
		if (glyph.points.length === 0) {
			currentX += glyph.width * scale + letterSpacing * scale;
			continue;
		}

		// Interpolate additional points along glyph strokes
		const interpolatedPoints = interpolateGlyphPoints(glyph, pointsPerLetter);

		for (const point of interpolatedPoints) {
			const x = currentX + point[0] * glyph.width * scale;
			const y = (point[1] - 0.5) * scale; // Center vertically
			const z = 0; // On the viewing plane

			positions.push({ x, y, z });
			letterIndices.push(letterIdx);
		}

		currentX += glyph.width * scale + letterSpacing * scale;
	}

	return { word, positions, letterIndices };
}

/**
 * Interpolate points along glyph strokes to get desired point count
 */
function interpolateGlyphPoints(
	glyph: GlyphData,
	targetCount: number,
): Array<[number, number]> {
	const points = glyph.points;
	if (points.length === 0) return [];
	if (points.length === 1) return [points[0]];

	const result: Array<[number, number]> = [];

	// Calculate total path length
	let totalLength = 0;
	for (let i = 1; i < points.length; i++) {
		const dx = points[i][0] - points[i - 1][0];
		const dy = points[i][1] - points[i - 1][1];
		totalLength += Math.sqrt(dx * dx + dy * dy);
	}

	// Distribute points evenly along path
	const step = totalLength / (targetCount - 1);
	let accumulated = 0;
	let segmentStart = 0;
	let segmentLength = 0;

	// Calculate first segment
	if (points.length > 1) {
		const dx = points[1][0] - points[0][0];
		const dy = points[1][1] - points[0][1];
		segmentLength = Math.sqrt(dx * dx + dy * dy);
	}

	for (let i = 0; i < targetCount; i++) {
		const targetDist = i * step;

		// Find which segment this point falls on
		while (
			accumulated + segmentLength < targetDist &&
			segmentStart < points.length - 2
		) {
			accumulated += segmentLength;
			segmentStart++;

			const dx = points[segmentStart + 1][0] - points[segmentStart][0];
			const dy = points[segmentStart + 1][1] - points[segmentStart][1];
			segmentLength = Math.sqrt(dx * dx + dy * dy);
		}

		// Interpolate within segment
		const segmentProgress =
			segmentLength > 0 ? (targetDist - accumulated) / segmentLength : 0;
		const p1 = points[segmentStart];
		const p2 = points[Math.min(segmentStart + 1, points.length - 1)];

		result.push([
			p1[0] + (p2[0] - p1[0]) * Math.min(1, Math.max(0, segmentProgress)),
			p1[1] + (p2[1] - p1[1]) * Math.min(1, Math.max(0, segmentProgress)),
		]);
	}

	return result;
}

/**
 * Find nearest scaffold particles to recruit for word formation
 * Returns map of particle index → target position
 */
export function recruitParticles(
	wordLayout: WordLayout,
	scaffoldPositions: Float32Array,
	particleCount: number,
): Map<number, { target: Vec3; letterIndex: number }> {
	const recruited = new Map<number, { target: Vec3; letterIndex: number }>();
	const usedIndices = new Set<number>();

	// For each target position, find nearest scaffold particle
	for (let i = 0; i < wordLayout.positions.length; i++) {
		const target = wordLayout.positions[i];
		const letterIndex = wordLayout.letterIndices[i];

		let nearestIndex = -1;
		let nearestDist = Infinity;

		for (let j = 0; j < particleCount; j++) {
			if (usedIndices.has(j)) continue;

			const idx = j * 4;
			const type = scaffoldPositions[idx + 3];

			// Only recruit scaffold particles (type 0)
			if (type !== 0) continue;

			const dx = scaffoldPositions[idx] - target.x;
			const dy = scaffoldPositions[idx + 1] - target.y;
			const dz = scaffoldPositions[idx + 2] - target.z;
			const dist = dx * dx + dy * dy + dz * dz;

			if (dist < nearestDist) {
				nearestDist = dist;
				nearestIndex = j;
			}
		}

		if (nearestIndex >= 0) {
			recruited.set(nearestIndex, { target, letterIndex });
			usedIndices.add(nearestIndex);
		}
	}

	return recruited;
}
