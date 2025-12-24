/**
 * Glyph Data for Word Formation
 * Each letter is defined as a series of [x, y] points (0-1 normalized space)
 * Points are positioned to create readable letter shapes when particles gather
 */

export type GlyphPoint = [number, number];
export type GlyphPath = GlyphPoint[];

/**
 * Glyph definitions for uppercase letters
 * Each glyph is a series of points that trace the letter shape
 * Points are in 0-1 normalized space, centered at (0.5, 0.5)
 */
export const GLYPH_DATA: Record<string, GlyphPath> = {
	A: [
		// Left leg
		[0.1, 0],
		[0.15, 0.2],
		[0.2, 0.4],
		[0.25, 0.6],
		[0.3, 0.8],
		[0.35, 0.9],
		[0.4, 0.95],
		[0.45, 1],
		[0.5, 1],
		[0.55, 1],
		// Right leg
		[0.6, 0.95],
		[0.65, 0.9],
		[0.7, 0.8],
		[0.75, 0.6],
		[0.8, 0.4],
		[0.85, 0.2],
		[0.9, 0],
		// Crossbar
		[0.25, 0.35],
		[0.35, 0.35],
		[0.45, 0.35],
		[0.55, 0.35],
		[0.65, 0.35],
		[0.75, 0.35],
	],

	B: [
		// Vertical stem
		[0.2, 0],
		[0.2, 0.15],
		[0.2, 0.3],
		[0.2, 0.45],
		[0.2, 0.5],
		[0.2, 0.6],
		[0.2, 0.75],
		[0.2, 0.9],
		[0.2, 1],
		// Top bump
		[0.3, 1],
		[0.45, 1],
		[0.6, 0.95],
		[0.7, 0.85],
		[0.7, 0.7],
		[0.6, 0.55],
		[0.45, 0.5],
		[0.3, 0.5],
		// Bottom bump
		[0.3, 0.5],
		[0.5, 0.5],
		[0.65, 0.45],
		[0.75, 0.35],
		[0.75, 0.2],
		[0.65, 0.08],
		[0.5, 0],
		[0.3, 0],
	],

	C: [
		[0.8, 0.2],
		[0.7, 0.08],
		[0.55, 0],
		[0.4, 0],
		[0.25, 0.08],
		[0.15, 0.2],
		[0.1, 0.35],
		[0.1, 0.5],
		[0.1, 0.65],
		[0.15, 0.8],
		[0.25, 0.92],
		[0.4, 1],
		[0.55, 1],
		[0.7, 0.92],
		[0.8, 0.8],
	],

	D: [
		// Vertical stem
		[0.2, 0],
		[0.2, 0.15],
		[0.2, 0.3],
		[0.2, 0.5],
		[0.2, 0.7],
		[0.2, 0.85],
		[0.2, 1],
		// Curve
		[0.35, 1],
		[0.5, 1],
		[0.65, 0.95],
		[0.75, 0.85],
		[0.8, 0.7],
		[0.8, 0.5],
		[0.8, 0.3],
		[0.75, 0.15],
		[0.65, 0.05],
		[0.5, 0],
		[0.35, 0],
	],

	E: [
		// Vertical stem
		[0.2, 0],
		[0.2, 0.2],
		[0.2, 0.4],
		[0.2, 0.5],
		[0.2, 0.6],
		[0.2, 0.8],
		[0.2, 1],
		// Top bar
		[0.35, 1],
		[0.5, 1],
		[0.65, 1],
		[0.8, 1],
		// Middle bar
		[0.35, 0.5],
		[0.5, 0.5],
		[0.65, 0.5],
		// Bottom bar
		[0.35, 0],
		[0.5, 0],
		[0.65, 0],
		[0.8, 0],
	],

	F: [
		// Vertical stem
		[0.2, 0],
		[0.2, 0.2],
		[0.2, 0.4],
		[0.2, 0.5],
		[0.2, 0.6],
		[0.2, 0.8],
		[0.2, 1],
		// Top bar
		[0.35, 1],
		[0.5, 1],
		[0.65, 1],
		[0.8, 1],
		// Middle bar
		[0.35, 0.5],
		[0.5, 0.5],
		[0.65, 0.5],
	],

	G: [
		[0.8, 0.8],
		[0.7, 0.92],
		[0.55, 1],
		[0.4, 1],
		[0.25, 0.92],
		[0.15, 0.8],
		[0.1, 0.65],
		[0.1, 0.5],
		[0.1, 0.35],
		[0.15, 0.2],
		[0.25, 0.08],
		[0.4, 0],
		[0.55, 0],
		[0.7, 0.08],
		[0.8, 0.2],
		[0.8, 0.35],
		[0.8, 0.45],
		// Crossbar
		[0.65, 0.45],
		[0.5, 0.45],
	],

	H: [
		// Left stem
		[0.2, 0],
		[0.2, 0.2],
		[0.2, 0.4],
		[0.2, 0.5],
		[0.2, 0.6],
		[0.2, 0.8],
		[0.2, 1],
		// Right stem
		[0.8, 0],
		[0.8, 0.2],
		[0.8, 0.4],
		[0.8, 0.5],
		[0.8, 0.6],
		[0.8, 0.8],
		[0.8, 1],
		// Crossbar
		[0.35, 0.5],
		[0.5, 0.5],
		[0.65, 0.5],
	],

	I: [
		// Vertical stem
		[0.5, 0],
		[0.5, 0.15],
		[0.5, 0.3],
		[0.5, 0.45],
		[0.5, 0.6],
		[0.5, 0.75],
		[0.5, 0.9],
		[0.5, 1],
		// Top bar
		[0.3, 1],
		[0.4, 1],
		[0.6, 1],
		[0.7, 1],
		// Bottom bar
		[0.3, 0],
		[0.4, 0],
		[0.6, 0],
		[0.7, 0],
	],

	J: [
		// Curved bottom
		[0.2, 0.15],
		[0.3, 0.05],
		[0.45, 0],
		[0.55, 0.05],
		[0.6, 0.15],
		// Vertical stem
		[0.6, 0.3],
		[0.6, 0.45],
		[0.6, 0.6],
		[0.6, 0.75],
		[0.6, 0.9],
		[0.6, 1],
		// Top bar
		[0.4, 1],
		[0.5, 1],
		[0.7, 1],
		[0.8, 1],
	],

	K: [
		// Vertical stem
		[0.2, 0],
		[0.2, 0.2],
		[0.2, 0.4],
		[0.2, 0.5],
		[0.2, 0.6],
		[0.2, 0.8],
		[0.2, 1],
		// Upper diagonal
		[0.3, 0.5],
		[0.4, 0.6],
		[0.5, 0.7],
		[0.6, 0.8],
		[0.7, 0.9],
		[0.8, 1],
		// Lower diagonal
		[0.3, 0.5],
		[0.4, 0.4],
		[0.5, 0.3],
		[0.6, 0.2],
		[0.7, 0.1],
		[0.8, 0],
	],

	L: [
		// Vertical stem
		[0.2, 0],
		[0.2, 0.2],
		[0.2, 0.4],
		[0.2, 0.6],
		[0.2, 0.8],
		[0.2, 1],
		// Bottom bar
		[0.35, 0],
		[0.5, 0],
		[0.65, 0],
		[0.8, 0],
	],

	M: [
		// Left stem
		[0.1, 0],
		[0.1, 0.2],
		[0.1, 0.4],
		[0.1, 0.6],
		[0.1, 0.8],
		[0.1, 1],
		// Left diagonal
		[0.2, 0.85],
		[0.3, 0.65],
		[0.4, 0.45],
		[0.5, 0.3],
		// Right diagonal
		[0.5, 0.3],
		[0.6, 0.45],
		[0.7, 0.65],
		[0.8, 0.85],
		// Right stem
		[0.9, 1],
		[0.9, 0.8],
		[0.9, 0.6],
		[0.9, 0.4],
		[0.9, 0.2],
		[0.9, 0],
	],

	N: [
		// Left stem
		[0.2, 0],
		[0.2, 0.2],
		[0.2, 0.4],
		[0.2, 0.6],
		[0.2, 0.8],
		[0.2, 1],
		// Diagonal
		[0.3, 0.85],
		[0.4, 0.65],
		[0.5, 0.45],
		[0.6, 0.25],
		[0.7, 0.1],
		// Right stem
		[0.8, 0],
		[0.8, 0.2],
		[0.8, 0.4],
		[0.8, 0.6],
		[0.8, 0.8],
		[0.8, 1],
	],

	O: [
		[0.5, 0],
		[0.35, 0.05],
		[0.22, 0.15],
		[0.12, 0.3],
		[0.1, 0.5],
		[0.12, 0.7],
		[0.22, 0.85],
		[0.35, 0.95],
		[0.5, 1],
		[0.65, 0.95],
		[0.78, 0.85],
		[0.88, 0.7],
		[0.9, 0.5],
		[0.88, 0.3],
		[0.78, 0.15],
		[0.65, 0.05],
	],

	P: [
		// Vertical stem
		[0.2, 0],
		[0.2, 0.2],
		[0.2, 0.4],
		[0.2, 0.5],
		[0.2, 0.6],
		[0.2, 0.8],
		[0.2, 1],
		// Bump
		[0.35, 1],
		[0.5, 1],
		[0.65, 0.95],
		[0.75, 0.85],
		[0.8, 0.72],
		[0.75, 0.58],
		[0.65, 0.5],
		[0.5, 0.5],
		[0.35, 0.5],
	],

	Q: [
		// O shape
		[0.5, 0.05],
		[0.35, 0.1],
		[0.22, 0.2],
		[0.12, 0.35],
		[0.1, 0.5],
		[0.12, 0.65],
		[0.22, 0.8],
		[0.35, 0.9],
		[0.5, 0.95],
		[0.65, 0.9],
		[0.78, 0.8],
		[0.88, 0.65],
		[0.9, 0.5],
		[0.88, 0.35],
		[0.78, 0.2],
		[0.65, 0.1],
		// Tail
		[0.6, 0.2],
		[0.7, 0.1],
		[0.8, 0],
		[0.9, 0],
	],

	R: [
		// Vertical stem
		[0.2, 0],
		[0.2, 0.2],
		[0.2, 0.4],
		[0.2, 0.5],
		[0.2, 0.6],
		[0.2, 0.8],
		[0.2, 1],
		// Bump
		[0.35, 1],
		[0.5, 1],
		[0.65, 0.95],
		[0.75, 0.85],
		[0.8, 0.72],
		[0.75, 0.58],
		[0.65, 0.5],
		[0.5, 0.5],
		[0.35, 0.5],
		// Leg
		[0.4, 0.45],
		[0.5, 0.35],
		[0.6, 0.25],
		[0.7, 0.12],
		[0.8, 0],
	],

	S: [
		[0.75, 0.85],
		[0.65, 0.95],
		[0.5, 1],
		[0.35, 0.95],
		[0.22, 0.85],
		[0.18, 0.72],
		[0.22, 0.6],
		[0.35, 0.52],
		[0.5, 0.5],
		[0.65, 0.48],
		[0.78, 0.4],
		[0.82, 0.28],
		[0.78, 0.15],
		[0.65, 0.05],
		[0.5, 0],
		[0.35, 0.05],
		[0.25, 0.15],
	],

	T: [
		// Vertical stem
		[0.5, 0],
		[0.5, 0.15],
		[0.5, 0.3],
		[0.5, 0.45],
		[0.5, 0.6],
		[0.5, 0.75],
		[0.5, 0.9],
		[0.5, 1],
		// Top bar
		[0.15, 1],
		[0.25, 1],
		[0.35, 1],
		[0.65, 1],
		[0.75, 1],
		[0.85, 1],
	],

	U: [
		// Left stem going down
		[0.2, 1],
		[0.2, 0.8],
		[0.2, 0.6],
		[0.2, 0.4],
		[0.2, 0.25],
		// Curve
		[0.25, 0.12],
		[0.35, 0.03],
		[0.5, 0],
		[0.65, 0.03],
		[0.75, 0.12],
		// Right stem going up
		[0.8, 0.25],
		[0.8, 0.4],
		[0.8, 0.6],
		[0.8, 0.8],
		[0.8, 1],
	],

	V: [
		// Left arm
		[0.1, 1],
		[0.2, 0.8],
		[0.3, 0.6],
		[0.4, 0.4],
		[0.5, 0.15],
		[0.5, 0],
		// Right arm
		[0.5, 0.15],
		[0.6, 0.4],
		[0.7, 0.6],
		[0.8, 0.8],
		[0.9, 1],
	],

	W: [
		// First stroke
		[0.05, 1],
		[0.1, 0.8],
		[0.15, 0.5],
		[0.2, 0.25],
		[0.25, 0],
		// Second stroke
		[0.3, 0.25],
		[0.35, 0.5],
		[0.4, 0.7],
		[0.5, 0.8],
		// Third stroke
		[0.55, 0.7],
		[0.6, 0.5],
		[0.7, 0.25],
		[0.75, 0],
		// Fourth stroke
		[0.8, 0.25],
		[0.85, 0.5],
		[0.9, 0.8],
		[0.95, 1],
	],

	X: [
		// Diagonal 1
		[0.15, 1],
		[0.25, 0.85],
		[0.35, 0.7],
		[0.5, 0.5],
		[0.65, 0.3],
		[0.75, 0.15],
		[0.85, 0],
		// Diagonal 2
		[0.85, 1],
		[0.75, 0.85],
		[0.65, 0.7],
		[0.5, 0.5],
		[0.35, 0.3],
		[0.25, 0.15],
		[0.15, 0],
	],

	Y: [
		// Left arm
		[0.15, 1],
		[0.25, 0.85],
		[0.35, 0.7],
		[0.5, 0.5],
		// Right arm
		[0.85, 1],
		[0.75, 0.85],
		[0.65, 0.7],
		[0.5, 0.5],
		// Stem
		[0.5, 0.4],
		[0.5, 0.3],
		[0.5, 0.2],
		[0.5, 0.1],
		[0.5, 0],
	],

	Z: [
		// Top bar
		[0.2, 1],
		[0.35, 1],
		[0.5, 1],
		[0.65, 1],
		[0.8, 1],
		// Diagonal
		[0.75, 0.85],
		[0.65, 0.7],
		[0.55, 0.55],
		[0.45, 0.4],
		[0.35, 0.25],
		[0.25, 0.1],
		// Bottom bar
		[0.2, 0],
		[0.35, 0],
		[0.5, 0],
		[0.65, 0],
		[0.8, 0],
	],

	' ': [],
};

/**
 * Get the total number of points needed for a word
 */
export function getGlyphPointCount(word: string): number {
	let count = 0;
	for (const char of word.toUpperCase()) {
		const glyph = GLYPH_DATA[char];
		if (glyph) {
			count += glyph.length;
		}
	}
	return count;
}

/**
 * Get all points for a word, positioned and scaled
 */
export interface WordPoint {
	x: number;
	y: number;
	z: number;
	letterIndex: number;
	pointIndex: number;
}

export function getWordPoints(
	word: string,
	particlesPerLetter: number = 25,
	scale: number = 3.0,
): WordPoint[] {
	const points: WordPoint[] = [];
	const letterWidth = 1.2 * scale;
	const letterHeight = 1.5 * scale;
	const totalWidth = word.length * letterWidth;
	const startX = -totalWidth / 2 + letterWidth / 2;

	for (let letterIndex = 0; letterIndex < word.length; letterIndex++) {
		const char = word[letterIndex].toUpperCase();
		const glyph = GLYPH_DATA[char];

		if (!glyph || glyph.length === 0) continue;

		const offsetX = startX + letterIndex * letterWidth;

		// Calculate how many particles to use for this letter
		const pointsToGenerate = Math.min(particlesPerLetter, glyph.length * 2);

		for (let j = 0; j < pointsToGenerate; j++) {
			// Distribute particles along glyph path
			const t = j / pointsToGenerate;
			const glyphIndex = Math.floor(t * glyph.length);
			const nextIndex = Math.min(glyphIndex + 1, glyph.length - 1);
			const localT = (t * glyph.length) % 1;

			// Interpolate between glyph points
			const p1 = glyph[glyphIndex];
			const p2 = glyph[nextIndex];

			const x = (p1[0] + (p2[0] - p1[0]) * localT - 0.5) * scale + offsetX;
			const y = (p1[1] + (p2[1] - p1[1]) * localT - 0.5) * letterHeight;

			points.push({
				x,
				y,
				z: 0, // Words form on the z=0 plane (facing camera)
				letterIndex,
				pointIndex: j,
			});
		}
	}

	return points;
}

/**
 * Densify glyph points by interpolating additional points along the path
 */
export function densifyGlyph(glyph: GlyphPath, targetCount: number): GlyphPath {
	if (glyph.length === 0) return [];
	if (glyph.length >= targetCount) return glyph.slice(0, targetCount);

	const result: GlyphPath = [];
	const totalSegments = glyph.length - 1;

	for (let i = 0; i < targetCount; i++) {
		const t = i / (targetCount - 1);
		const segmentFloat = t * totalSegments;
		const segmentIndex = Math.min(Math.floor(segmentFloat), totalSegments - 1);
		const localT = segmentFloat - segmentIndex;

		const p1 = glyph[segmentIndex];
		const p2 = glyph[Math.min(segmentIndex + 1, glyph.length - 1)];

		result.push([
			p1[0] + (p2[0] - p1[0]) * localT,
			p1[1] + (p2[1] - p1[1]) * localT,
		]);
	}

	return result;
}
