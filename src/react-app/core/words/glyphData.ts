/**
 * Simplified Hershey-style glyph data
 * Each letter is defined as a set of points that can be rendered with particles
 * Points are normalized to 0-1 range within a unit square
 */

import type { GlyphDatabase } from '../types';

// Glyph data - simplified vector font
// Each glyph has points forming the letter shape
export const GLYPH_DATA: GlyphDatabase = {
	A: {
		points: [
			{ x: 0, y: 0 },
			{ x: 0.15, y: 0.33 },
			{ x: 0.3, y: 0.66 },
			{ x: 0.5, y: 1 },
			{ x: 0.7, y: 0.66 },
			{ x: 0.85, y: 0.33 },
			{ x: 1, y: 0 },
			{ x: 0.25, y: 0.4 },
			{ x: 0.5, y: 0.4 },
			{ x: 0.75, y: 0.4 },
		],
		width: 1,
	},
	B: {
		points: [
			{ x: 0, y: 0 },
			{ x: 0, y: 0.25 },
			{ x: 0, y: 0.5 },
			{ x: 0, y: 0.75 },
			{ x: 0, y: 1 },
			{ x: 0.3, y: 1 },
			{ x: 0.6, y: 0.9 },
			{ x: 0.7, y: 0.75 },
			{ x: 0.6, y: 0.6 },
			{ x: 0.3, y: 0.5 },
			{ x: 0.6, y: 0.4 },
			{ x: 0.7, y: 0.25 },
			{ x: 0.6, y: 0.1 },
			{ x: 0.3, y: 0 },
		],
		width: 0.8,
	},
	C: {
		points: [
			{ x: 0.8, y: 0.2 },
			{ x: 0.6, y: 0.05 },
			{ x: 0.4, y: 0 },
			{ x: 0.2, y: 0.1 },
			{ x: 0, y: 0.3 },
			{ x: 0, y: 0.5 },
			{ x: 0, y: 0.7 },
			{ x: 0.2, y: 0.9 },
			{ x: 0.4, y: 1 },
			{ x: 0.6, y: 0.95 },
			{ x: 0.8, y: 0.8 },
		],
		width: 0.85,
	},
	D: {
		points: [
			{ x: 0, y: 0 },
			{ x: 0, y: 0.25 },
			{ x: 0, y: 0.5 },
			{ x: 0, y: 0.75 },
			{ x: 0, y: 1 },
			{ x: 0.3, y: 1 },
			{ x: 0.6, y: 0.9 },
			{ x: 0.8, y: 0.7 },
			{ x: 0.8, y: 0.5 },
			{ x: 0.8, y: 0.3 },
			{ x: 0.6, y: 0.1 },
			{ x: 0.3, y: 0 },
		],
		width: 0.85,
	},
	E: {
		points: [
			{ x: 0.7, y: 0 },
			{ x: 0.35, y: 0 },
			{ x: 0, y: 0 },
			{ x: 0, y: 0.25 },
			{ x: 0, y: 0.5 },
			{ x: 0.4, y: 0.5 },
			{ x: 0, y: 0.75 },
			{ x: 0, y: 1 },
			{ x: 0.35, y: 1 },
			{ x: 0.7, y: 1 },
		],
		width: 0.75,
	},
	F: {
		points: [
			{ x: 0, y: 0 },
			{ x: 0, y: 0.25 },
			{ x: 0, y: 0.5 },
			{ x: 0.4, y: 0.5 },
			{ x: 0, y: 0.75 },
			{ x: 0, y: 1 },
			{ x: 0.35, y: 1 },
			{ x: 0.7, y: 1 },
		],
		width: 0.75,
	},
	G: {
		points: [
			{ x: 0.8, y: 0.8 },
			{ x: 0.6, y: 0.95 },
			{ x: 0.4, y: 1 },
			{ x: 0.2, y: 0.9 },
			{ x: 0, y: 0.7 },
			{ x: 0, y: 0.5 },
			{ x: 0, y: 0.3 },
			{ x: 0.2, y: 0.1 },
			{ x: 0.4, y: 0 },
			{ x: 0.6, y: 0.05 },
			{ x: 0.8, y: 0.2 },
			{ x: 0.8, y: 0.4 },
			{ x: 0.5, y: 0.4 },
		],
		width: 0.9,
	},
	H: {
		points: [
			{ x: 0, y: 0 },
			{ x: 0, y: 0.25 },
			{ x: 0, y: 0.5 },
			{ x: 0.25, y: 0.5 },
			{ x: 0.5, y: 0.5 },
			{ x: 0.75, y: 0.5 },
			{ x: 0, y: 0.75 },
			{ x: 0, y: 1 },
			{ x: 0.75, y: 0 },
			{ x: 0.75, y: 0.25 },
			{ x: 0.75, y: 0.75 },
			{ x: 0.75, y: 1 },
		],
		width: 0.8,
	},
	I: {
		points: [
			{ x: 0.5, y: 0 },
			{ x: 0.5, y: 0.2 },
			{ x: 0.5, y: 0.4 },
			{ x: 0.5, y: 0.6 },
			{ x: 0.5, y: 0.8 },
			{ x: 0.5, y: 1 },
			{ x: 0.2, y: 0 },
			{ x: 0.8, y: 0 },
			{ x: 0.2, y: 1 },
			{ x: 0.8, y: 1 },
		],
		width: 0.5,
	},
	J: {
		points: [
			{ x: 0.6, y: 1 },
			{ x: 0.6, y: 0.8 },
			{ x: 0.6, y: 0.6 },
			{ x: 0.6, y: 0.4 },
			{ x: 0.6, y: 0.2 },
			{ x: 0.5, y: 0.05 },
			{ x: 0.3, y: 0 },
			{ x: 0.1, y: 0.1 },
		],
		width: 0.7,
	},
	K: {
		points: [
			{ x: 0, y: 0 },
			{ x: 0, y: 0.25 },
			{ x: 0, y: 0.5 },
			{ x: 0, y: 0.75 },
			{ x: 0, y: 1 },
			{ x: 0.2, y: 0.5 },
			{ x: 0.4, y: 0.7 },
			{ x: 0.7, y: 1 },
			{ x: 0.4, y: 0.3 },
			{ x: 0.7, y: 0 },
		],
		width: 0.75,
	},
	L: {
		points: [
			{ x: 0, y: 1 },
			{ x: 0, y: 0.75 },
			{ x: 0, y: 0.5 },
			{ x: 0, y: 0.25 },
			{ x: 0, y: 0 },
			{ x: 0.25, y: 0 },
			{ x: 0.5, y: 0 },
			{ x: 0.7, y: 0 },
		],
		width: 0.7,
	},
	M: {
		points: [
			{ x: 0, y: 0 },
			{ x: 0, y: 0.33 },
			{ x: 0, y: 0.66 },
			{ x: 0, y: 1 },
			{ x: 0.25, y: 0.75 },
			{ x: 0.5, y: 0.5 },
			{ x: 0.75, y: 0.75 },
			{ x: 1, y: 1 },
			{ x: 1, y: 0.66 },
			{ x: 1, y: 0.33 },
			{ x: 1, y: 0 },
		],
		width: 1,
	},
	N: {
		points: [
			{ x: 0, y: 0 },
			{ x: 0, y: 0.33 },
			{ x: 0, y: 0.66 },
			{ x: 0, y: 1 },
			{ x: 0.25, y: 0.75 },
			{ x: 0.5, y: 0.5 },
			{ x: 0.75, y: 0.25 },
			{ x: 0.85, y: 0 },
			{ x: 0.85, y: 0.33 },
			{ x: 0.85, y: 0.66 },
			{ x: 0.85, y: 1 },
		],
		width: 0.9,
	},
	O: {
		points: [
			{ x: 0.5, y: 0 },
			{ x: 0.25, y: 0.05 },
			{ x: 0.1, y: 0.2 },
			{ x: 0, y: 0.4 },
			{ x: 0, y: 0.6 },
			{ x: 0.1, y: 0.8 },
			{ x: 0.25, y: 0.95 },
			{ x: 0.5, y: 1 },
			{ x: 0.75, y: 0.95 },
			{ x: 0.9, y: 0.8 },
			{ x: 1, y: 0.6 },
			{ x: 1, y: 0.4 },
			{ x: 0.9, y: 0.2 },
			{ x: 0.75, y: 0.05 },
		],
		width: 1,
	},
	P: {
		points: [
			{ x: 0, y: 0 },
			{ x: 0, y: 0.25 },
			{ x: 0, y: 0.5 },
			{ x: 0, y: 0.75 },
			{ x: 0, y: 1 },
			{ x: 0.3, y: 1 },
			{ x: 0.6, y: 0.9 },
			{ x: 0.7, y: 0.75 },
			{ x: 0.6, y: 0.55 },
			{ x: 0.3, y: 0.5 },
		],
		width: 0.75,
	},
	Q: {
		points: [
			{ x: 0.5, y: 0 },
			{ x: 0.25, y: 0.05 },
			{ x: 0.1, y: 0.2 },
			{ x: 0, y: 0.4 },
			{ x: 0, y: 0.6 },
			{ x: 0.1, y: 0.8 },
			{ x: 0.25, y: 0.95 },
			{ x: 0.5, y: 1 },
			{ x: 0.75, y: 0.95 },
			{ x: 0.9, y: 0.8 },
			{ x: 1, y: 0.6 },
			{ x: 1, y: 0.4 },
			{ x: 0.9, y: 0.2 },
			{ x: 0.75, y: 0.05 },
			{ x: 0.6, y: 0.15 },
			{ x: 0.9, y: -0.1 },
		],
		width: 1,
	},
	R: {
		points: [
			{ x: 0, y: 0 },
			{ x: 0, y: 0.25 },
			{ x: 0, y: 0.5 },
			{ x: 0, y: 0.75 },
			{ x: 0, y: 1 },
			{ x: 0.3, y: 1 },
			{ x: 0.6, y: 0.9 },
			{ x: 0.7, y: 0.75 },
			{ x: 0.6, y: 0.55 },
			{ x: 0.3, y: 0.5 },
			{ x: 0.5, y: 0.35 },
			{ x: 0.7, y: 0.15 },
			{ x: 0.8, y: 0 },
		],
		width: 0.85,
	},
	S: {
		points: [
			{ x: 0.8, y: 0.85 },
			{ x: 0.6, y: 0.95 },
			{ x: 0.4, y: 1 },
			{ x: 0.2, y: 0.95 },
			{ x: 0.1, y: 0.8 },
			{ x: 0.2, y: 0.65 },
			{ x: 0.4, y: 0.55 },
			{ x: 0.6, y: 0.45 },
			{ x: 0.8, y: 0.35 },
			{ x: 0.9, y: 0.2 },
			{ x: 0.8, y: 0.05 },
			{ x: 0.6, y: 0 },
			{ x: 0.4, y: 0.05 },
			{ x: 0.2, y: 0.15 },
		],
		width: 0.85,
	},
	T: {
		points: [
			{ x: 0.5, y: 0 },
			{ x: 0.5, y: 0.2 },
			{ x: 0.5, y: 0.4 },
			{ x: 0.5, y: 0.6 },
			{ x: 0.5, y: 0.8 },
			{ x: 0.5, y: 1 },
			{ x: 0, y: 1 },
			{ x: 0.25, y: 1 },
			{ x: 0.75, y: 1 },
			{ x: 1, y: 1 },
		],
		width: 1,
	},
	U: {
		points: [
			{ x: 0, y: 1 },
			{ x: 0, y: 0.75 },
			{ x: 0, y: 0.5 },
			{ x: 0, y: 0.25 },
			{ x: 0.15, y: 0.05 },
			{ x: 0.4, y: 0 },
			{ x: 0.6, y: 0 },
			{ x: 0.85, y: 0.05 },
			{ x: 1, y: 0.25 },
			{ x: 1, y: 0.5 },
			{ x: 1, y: 0.75 },
			{ x: 1, y: 1 },
		],
		width: 1,
	},
	V: {
		points: [
			{ x: 0, y: 1 },
			{ x: 0.15, y: 0.75 },
			{ x: 0.3, y: 0.5 },
			{ x: 0.4, y: 0.25 },
			{ x: 0.5, y: 0 },
			{ x: 0.6, y: 0.25 },
			{ x: 0.7, y: 0.5 },
			{ x: 0.85, y: 0.75 },
			{ x: 1, y: 1 },
		],
		width: 1,
	},
	W: {
		points: [
			{ x: 0, y: 1 },
			{ x: 0.1, y: 0.5 },
			{ x: 0.2, y: 0 },
			{ x: 0.35, y: 0.5 },
			{ x: 0.5, y: 0.75 },
			{ x: 0.65, y: 0.5 },
			{ x: 0.8, y: 0 },
			{ x: 0.9, y: 0.5 },
			{ x: 1, y: 1 },
		],
		width: 1,
	},
	X: {
		points: [
			{ x: 0, y: 0 },
			{ x: 0.2, y: 0.25 },
			{ x: 0.4, y: 0.5 },
			{ x: 0.6, y: 0.75 },
			{ x: 0.8, y: 1 },
			{ x: 0.8, y: 0 },
			{ x: 0.6, y: 0.25 },
			{ x: 0.2, y: 0.75 },
			{ x: 0, y: 1 },
		],
		width: 0.85,
	},
	Y: {
		points: [
			{ x: 0, y: 1 },
			{ x: 0.2, y: 0.75 },
			{ x: 0.4, y: 0.5 },
			{ x: 0.4, y: 0.25 },
			{ x: 0.4, y: 0 },
			{ x: 0.6, y: 0.5 },
			{ x: 0.8, y: 0.75 },
			{ x: 1, y: 1 },
		],
		width: 1,
	},
	Z: {
		points: [
			{ x: 0, y: 1 },
			{ x: 0.33, y: 1 },
			{ x: 0.66, y: 1 },
			{ x: 1, y: 1 },
			{ x: 0.75, y: 0.75 },
			{ x: 0.5, y: 0.5 },
			{ x: 0.25, y: 0.25 },
			{ x: 0, y: 0 },
			{ x: 0.33, y: 0 },
			{ x: 0.66, y: 0 },
			{ x: 1, y: 0 },
		],
		width: 1,
	},
	' ': {
		points: [],
		width: 0.4,
	},
};

// Lowercase letters map to uppercase
const LOWERCASE_MAP: Record<string, string> = {};
'abcdefghijklmnopqrstuvwxyz'.split('').forEach((c, i) => {
	LOWERCASE_MAP[c] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i];
});

/**
 * Get glyph data for a character
 */
export function getGlyph(char: string): {
	points: { x: number; y: number }[];
	width: number;
} {
	const upper = LOWERCASE_MAP[char] || char.toUpperCase();
	return GLYPH_DATA[upper] || GLYPH_DATA[' '];
}

/**
 * Get total width of a word
 */
export function getWordWidth(word: string): number {
	let width = 0;
	const spacing = 0.15;

	for (const char of word) {
		const glyph = getGlyph(char);
		width += glyph.width + spacing;
	}

	return width - spacing; // Remove last spacing
}
