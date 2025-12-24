/**
 * Particle utility functions
 * Includes Fibonacci sphere distribution for uniform particle placement
 */

import { FBO_SIZE, PARTICLE_TYPES, TOTAL_PARTICLES } from '../constants';
import type { Vec3 } from '../types';

// Golden angle for Fibonacci distribution
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * Generate Fibonacci sphere distribution
 * Creates uniformly distributed points on a unit sphere
 */
export function generateFibonacciSphere(count: number): Vec3[] {
	const positions: Vec3[] = [];

	for (let i = 0; i < count; i++) {
		// y goes from 1 to -1 (top to bottom)
		const y = 1 - (i / (count - 1)) * 2;
		// Radius at this height
		const radius = Math.sqrt(1 - y * y);
		// Angle around the sphere
		const theta = GOLDEN_ANGLE * i;

		positions.push({
			x: Math.cos(theta) * radius,
			y: y,
			z: Math.sin(theta) * radius,
		});
	}

	return positions;
}

/**
 * Create initial position data texture
 * RGBA: xyz = position, w = particle type
 */
export function createPositionData(
	count: number = TOTAL_PARTICLES,
	fboSize: number = FBO_SIZE,
): Float32Array {
	const capacity = fboSize * fboSize;
	const data = new Float32Array(capacity * 4);

	// Generate Fibonacci sphere positions
	const spherePositions = generateFibonacciSphere(count);

	for (let i = 0; i < capacity; i++) {
		const i4 = i * 4;

		if (i < count) {
			// Active particle - place on sphere
			const pos = spherePositions[i];
			data[i4] = pos.x;
			data[i4 + 1] = pos.y;
			data[i4 + 2] = pos.z;
			data[i4 + 3] = PARTICLE_TYPES.SCAFFOLD; // All start as scaffold
		} else {
			// Inactive particle - place at origin with negative type
			data[i4] = 0;
			data[i4 + 1] = 0;
			data[i4 + 2] = 0;
			data[i4 + 3] = -1; // Inactive marker
		}
	}

	return data;
}

/**
 * Create original position data texture (for home positions)
 * RGBA: xyz = home position, w = random phase offset
 */
export function createOriginalPositionData(
	count: number = TOTAL_PARTICLES,
	fboSize: number = FBO_SIZE,
): Float32Array {
	const capacity = fboSize * fboSize;
	const data = new Float32Array(capacity * 4);

	// Generate Fibonacci sphere positions
	const spherePositions = generateFibonacciSphere(count);

	for (let i = 0; i < capacity; i++) {
		const i4 = i * 4;

		if (i < count) {
			const pos = spherePositions[i];
			data[i4] = pos.x;
			data[i4 + 1] = pos.y;
			data[i4 + 2] = pos.z;
			data[i4 + 3] = Math.random() * Math.PI * 2; // Random phase
		} else {
			data[i4] = 0;
			data[i4 + 1] = 0;
			data[i4 + 2] = 0;
			data[i4 + 3] = 0;
		}
	}

	return data;
}

/**
 * Create color data texture
 * RGBA: rgb = color, a = alpha multiplier
 */
export function createColorData(
	count: number = TOTAL_PARTICLES,
	fboSize: number = FBO_SIZE,
	palette: number[][],
): Float32Array {
	const capacity = fboSize * fboSize;
	const data = new Float32Array(capacity * 4);

	for (let i = 0; i < capacity; i++) {
		const i4 = i * 4;

		if (i < count) {
			// All particles start as scaffold (index 0)
			const color = palette[0];
			data[i4] = color[0];
			data[i4 + 1] = color[1];
			data[i4 + 2] = color[2];
			data[i4 + 3] = 1.0; // Full alpha
		} else {
			data[i4] = 0;
			data[i4 + 1] = 0;
			data[i4 + 2] = 0;
			data[i4 + 3] = 0;
		}
	}

	return data;
}

/**
 * Find available scaffold particles for user allocation
 */
export function findAvailableScaffoldIndices(
	positionData: Float32Array,
	count: number,
	activeParticleCount: number,
): number[] {
	const indices: number[] = [];

	for (let i = 0; i < activeParticleCount && indices.length < count; i++) {
		const type = positionData[i * 4 + 3];
		if (type === PARTICLE_TYPES.SCAFFOLD) {
			indices.push(i);
		}
	}

	// Shuffle for random selection
	for (let i = indices.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[indices[i], indices[j]] = [indices[j], indices[i]];
	}

	return indices.slice(0, count);
}

/**
 * Convert hex color to normalized RGB array
 */
export function hexToRgb(hex: string): [number, number, number] {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!result) {
		return [0, 0, 0];
	}
	return [
		parseInt(result[1], 16) / 255,
		parseInt(result[2], 16) / 255,
		parseInt(result[3], 16) / 255,
	];
}

/**
 * Convert palette to normalized RGB arrays
 */
export function paletteToRgbArray(palette: string[]): number[][] {
	return palette.map(hexToRgb);
}
