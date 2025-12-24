/**
 * Text to Particle Position Utility
 *
 * Converts text into 3D particle positions by:
 * 1. Rendering text to an offscreen canvas
 * 2. Sampling the filled pixels
 * 3. Converting to 3D positions on a plane facing the camera
 */

import * as THREE from 'three';

export interface TextParticleData {
	// 3D positions for each particle in the text
	positions: THREE.Vector3[];
	// Which letter each position belongs to (for staggered animation)
	letterIndices: number[];
	// Total width of the text for centering
	textWidth: number;
	// Number of letters (for animation timing)
	letterCount: number;
}

// Cache for the offscreen canvas
let cachedCanvas: HTMLCanvasElement | null = null;
let cachedCtx: CanvasRenderingContext2D | null = null;

function getCanvas(): {
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
} {
	if (cachedCanvas && cachedCtx) {
		return { canvas: cachedCanvas, ctx: cachedCtx };
	}
	cachedCanvas = document.createElement('canvas');
	cachedCanvas.width = 512;
	cachedCanvas.height = 128;
	const ctx = cachedCanvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) {
		throw new Error('Failed to get 2D canvas context');
	}
	cachedCtx = ctx;
	return { canvas: cachedCanvas, ctx: cachedCtx };
}

/**
 * Render text to canvas and extract particle positions
 */
export function textToParticlePositions(
	text: string,
	options: {
		// Target number of particles
		targetCount?: number;
		// Z distance from camera (positive = toward viewer)
		zOffset?: number;
		// Scale factor for the text
		scale?: number;
	} = {},
): TextParticleData {
	const { targetCount = 200, zOffset = 20, scale = 1.0 } = options;

	const { canvas, ctx } = getCanvas();

	// Clear canvas
	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Draw text
	const fontSize = 48;
	ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillStyle = '#fff';
	ctx.fillText(text, canvas.width / 2, canvas.height / 2);

	// Get pixel data
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const pixels = imageData.data;

	// Collect all filled pixel coordinates
	const filledPixels: { x: number; y: number; letterIndex: number }[] = [];

	// Track letter boundaries for letter index assignment
	const letterBoundaries = getLetterBoundaries(text, ctx, canvas);

	for (let y = 0; y < canvas.height; y++) {
		for (let x = 0; x < canvas.width; x++) {
			const i = (y * canvas.width + x) * 4;
			// Check if pixel is filled (alpha > 128 or RGB > 128)
			if (pixels[i] > 128 || pixels[i + 3] > 128) {
				// Determine which letter this pixel belongs to
				const letterIndex = getLetterIndex(x, letterBoundaries);
				filledPixels.push({ x, y, letterIndex });
			}
		}
	}

	// Sample pixels to get target count
	const sampledPixels = samplePixels(filledPixels, targetCount);

	// Convert to 3D positions
	// Center the text and scale appropriately
	const positions: THREE.Vector3[] = [];
	const letterIndices: number[] = [];

	// Calculate the text bounds for centering
	const textMetrics = ctx.measureText(text);
	const textWidth = textMetrics.width;

	// Scale factor to convert canvas coords to world coords
	// We want the text to be roughly 15-20 units wide in world space
	const worldScale = (18 / textWidth) * scale;

	for (const pixel of sampledPixels) {
		// Convert from canvas space (0-512, 0-128) to centered world space
		const worldX = (pixel.x - canvas.width / 2) * worldScale;
		const worldY = -(pixel.y - canvas.height / 2) * worldScale; // Flip Y
		const worldZ = zOffset;

		// Add slight random offset for organic feel
		const jitter = 0.1;
		positions.push(
			new THREE.Vector3(
				worldX + (Math.random() - 0.5) * jitter,
				worldY + (Math.random() - 0.5) * jitter,
				worldZ + (Math.random() - 0.5) * jitter * 0.5,
			),
		);
		letterIndices.push(pixel.letterIndex);
	}

	return {
		positions,
		letterIndices,
		textWidth: textWidth * worldScale,
		letterCount: text.replace(/\s/g, '').length,
	};
}

/**
 * Calculate approximate letter boundaries on the canvas
 */
function getLetterBoundaries(
	text: string,
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
): number[] {
	const boundaries: number[] = [];
	const fullWidth = ctx.measureText(text).width;
	const startX = (canvas.width - fullWidth) / 2;

	let currentX = startX;
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		const charWidth = ctx.measureText(char).width;
		boundaries.push(currentX + charWidth);
		currentX += charWidth;
	}

	return boundaries;
}

/**
 * Determine which letter a pixel belongs to
 */
function getLetterIndex(x: number, boundaries: number[]): number {
	for (let i = 0; i < boundaries.length; i++) {
		if (x < boundaries[i]) {
			return i;
		}
	}
	return boundaries.length - 1;
}

/**
 * Sample pixels to get approximately the target count
 * Uses a grid-based approach to maintain even distribution
 */
function samplePixels<T>(pixels: T[], targetCount: number): T[] {
	if (pixels.length <= targetCount) {
		return pixels;
	}

	// Simple random sampling
	const shuffled = [...pixels].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, targetCount);
}

/**
 * Find the nearest particles to word positions
 * Returns indices of particles that should form the word
 */
export function findNearestParticles(
	wordPositions: THREE.Vector3[],
	particlePositions: Float32Array,
	particleCount: number,
): number[] {
	const selectedIndices: number[] = [];
	const usedIndices = new Set<number>();

	// For each word position, find the nearest available particle
	for (const wordPos of wordPositions) {
		let nearestIndex = -1;
		let nearestDist = Infinity;

		for (let i = 0; i < particleCount; i++) {
			if (usedIndices.has(i)) continue;

			const i4 = i * 4;
			const px = particlePositions[i4];
			const py = particlePositions[i4 + 1];
			const pz = particlePositions[i4 + 2];

			const dx = px - wordPos.x;
			const dy = py - wordPos.y;
			const dz = pz - wordPos.z;
			const dist = dx * dx + dy * dy + dz * dz;

			if (dist < nearestDist) {
				nearestDist = dist;
				nearestIndex = i;
			}
		}

		if (nearestIndex >= 0) {
			selectedIndices.push(nearestIndex);
			usedIndices.add(nearestIndex);
		}
	}

	return selectedIndices;
}
