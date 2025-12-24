/**
 * Pre-generated glyph data for word formation
 * Based on simplified Hershey font strokes
 * Each letter has normalized points (0-1 range) and width
 */

export interface GlyphData {
	points: Array<[number, number]>; // [x, y] normalized coordinates
	width: number;
}

export type GlyphMap = Record<string, GlyphData>;

/**
 * Simplified glyph definitions
 * Points form the visual shape of each letter
 * Coordinates are normalized to 0-1 range, origin at bottom-left
 */
export const GLYPH_DATA: GlyphMap = {
	A: {
		points: [
			[0, 0],
			[0.5, 1],
			[1, 0],
			[0.2, 0.4],
			[0.8, 0.4],
		],
		width: 1.0,
	},
	B: {
		points: [
			[0, 0],
			[0, 1],
			[0.7, 1],
			[0.9, 0.85],
			[0.7, 0.5],
			[0, 0.5],
			[0.7, 0.5],
			[0.9, 0.25],
			[0.7, 0],
			[0, 0],
		],
		width: 0.9,
	},
	C: {
		points: [
			[0.9, 0.85],
			[0.5, 1],
			[0.1, 0.75],
			[0, 0.5],
			[0.1, 0.25],
			[0.5, 0],
			[0.9, 0.15],
		],
		width: 0.9,
	},
	D: {
		points: [
			[0, 0],
			[0, 1],
			[0.5, 1],
			[0.9, 0.75],
			[0.9, 0.25],
			[0.5, 0],
			[0, 0],
		],
		width: 0.9,
	},
	E: {
		points: [
			[0.8, 1],
			[0, 1],
			[0, 0.5],
			[0.6, 0.5],
			[0, 0.5],
			[0, 0],
			[0.8, 0],
		],
		width: 0.8,
	},
	F: {
		points: [
			[0.8, 1],
			[0, 1],
			[0, 0.5],
			[0.6, 0.5],
			[0, 0.5],
			[0, 0],
		],
		width: 0.8,
	},
	G: {
		points: [
			[0.9, 0.85],
			[0.5, 1],
			[0.1, 0.75],
			[0, 0.5],
			[0.1, 0.25],
			[0.5, 0],
			[0.9, 0.15],
			[0.9, 0.5],
			[0.5, 0.5],
		],
		width: 0.9,
	},
	H: {
		points: [
			[0, 0],
			[0, 1],
			[0, 0.5],
			[0.8, 0.5],
			[0.8, 1],
			[0.8, 0],
		],
		width: 0.8,
	},
	I: {
		points: [
			[0.3, 1],
			[0.7, 1],
			[0.5, 1],
			[0.5, 0],
			[0.3, 0],
			[0.7, 0],
		],
		width: 0.7,
	},
	J: {
		points: [
			[0.8, 1],
			[0.8, 0.2],
			[0.6, 0],
			[0.2, 0],
			[0, 0.2],
		],
		width: 0.8,
	},
	K: {
		points: [
			[0, 0],
			[0, 1],
			[0, 0.5],
			[0.8, 1],
			[0, 0.5],
			[0.8, 0],
		],
		width: 0.8,
	},
	L: {
		points: [
			[0, 1],
			[0, 0],
			[0.8, 0],
		],
		width: 0.8,
	},
	M: {
		points: [
			[0, 0],
			[0, 1],
			[0.5, 0.5],
			[1, 1],
			[1, 0],
		],
		width: 1.0,
	},
	N: {
		points: [
			[0, 0],
			[0, 1],
			[0.8, 0],
			[0.8, 1],
		],
		width: 0.8,
	},
	O: {
		points: [
			[0.5, 1],
			[0.1, 0.8],
			[0, 0.5],
			[0.1, 0.2],
			[0.5, 0],
			[0.9, 0.2],
			[1, 0.5],
			[0.9, 0.8],
			[0.5, 1],
		],
		width: 1.0,
	},
	P: {
		points: [
			[0, 0],
			[0, 1],
			[0.7, 1],
			[0.9, 0.85],
			[0.9, 0.65],
			[0.7, 0.5],
			[0, 0.5],
		],
		width: 0.9,
	},
	Q: {
		points: [
			[0.5, 1],
			[0.1, 0.8],
			[0, 0.5],
			[0.1, 0.2],
			[0.5, 0],
			[0.9, 0.2],
			[1, 0.5],
			[0.9, 0.8],
			[0.5, 1],
			[0.6, 0.3],
			[1, 0],
		],
		width: 1.0,
	},
	R: {
		points: [
			[0, 0],
			[0, 1],
			[0.7, 1],
			[0.9, 0.85],
			[0.9, 0.65],
			[0.7, 0.5],
			[0, 0.5],
			[0.8, 0],
		],
		width: 0.9,
	},
	S: {
		points: [
			[0.9, 0.85],
			[0.5, 1],
			[0.1, 0.85],
			[0, 0.7],
			[0.1, 0.55],
			[0.5, 0.5],
			[0.9, 0.45],
			[1, 0.3],
			[0.9, 0.15],
			[0.5, 0],
			[0.1, 0.15],
		],
		width: 1.0,
	},
	T: {
		points: [
			[0, 1],
			[1, 1],
			[0.5, 1],
			[0.5, 0],
		],
		width: 1.0,
	},
	U: {
		points: [
			[0, 1],
			[0, 0.2],
			[0.2, 0],
			[0.6, 0],
			[0.8, 0.2],
			[0.8, 1],
		],
		width: 0.8,
	},
	V: {
		points: [
			[0, 1],
			[0.5, 0],
			[1, 1],
		],
		width: 1.0,
	},
	W: {
		points: [
			[0, 1],
			[0.25, 0],
			[0.5, 0.6],
			[0.75, 0],
			[1, 1],
		],
		width: 1.0,
	},
	X: {
		points: [
			[0, 1],
			[1, 0],
			[0.5, 0.5],
			[0, 0],
			[1, 1],
		],
		width: 1.0,
	},
	Y: {
		points: [
			[0, 1],
			[0.5, 0.5],
			[1, 1],
			[0.5, 0.5],
			[0.5, 0],
		],
		width: 1.0,
	},
	Z: {
		points: [
			[0, 1],
			[1, 1],
			[0, 0],
			[1, 0],
		],
		width: 1.0,
	},
	' ': {
		points: [],
		width: 0.4,
	},
};

/**
 * Get glyph data for a character (case-insensitive)
 */
export function getGlyph(char: string): GlyphData | undefined {
	return GLYPH_DATA[char.toUpperCase()];
}

/**
 * Calculate total width of a word
 */
export function getWordWidth(word: string, letterSpacing = 0.15): number {
	let width = 0;
	for (const char of word) {
		const glyph = getGlyph(char);
		if (glyph) {
			width += glyph.width + letterSpacing;
		}
	}
	return width - letterSpacing; // Remove trailing spacing
}
