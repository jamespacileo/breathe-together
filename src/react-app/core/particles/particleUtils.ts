/**
 * Particle utility functions
 * Fibonacci sphere distribution for even particle placement
 */

import { PARTICLE_TYPE, TEXTURE_SIZE, TOTAL_PARTICLES } from '../constants';

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * Generate Fibonacci spiral positions on a unit sphere
 * Creates evenly distributed points for 50K particles
 */
export function generateFibonacciSphere(count: number): Float32Array {
	// Position texture: RGBA where RGB = position, A = particle type
	const data = new Float32Array(count * 4);

	for (let i = 0; i < count; i++) {
		const y = 1 - (i / (count - 1)) * 2; // Range: 1 to -1
		const radius = Math.sqrt(1 - y * y);
		const theta = GOLDEN_ANGLE * i;

		const x = Math.cos(theta) * radius;
		const z = Math.sin(theta) * radius;

		const idx = i * 4;
		data[idx] = x; // x position
		data[idx + 1] = y; // y position
		data[idx + 2] = z; // z position
		data[idx + 3] = PARTICLE_TYPE.SCAFFOLD; // type = scaffold (0)
	}

	return data;
}

/**
 * Generate initial color data for particles
 * Scaffold particles get faint blue, users get jewel tones
 */
export function generateColorData(
	count: number,
	positionData: Float32Array,
): Float32Array {
	// Color texture: RGBA
	const data = new Float32Array(count * 4);

	// Scaffold color (faint desaturated blue)
	const scaffoldR = 0.102; // #1a2a4a
	const scaffoldG = 0.165;
	const scaffoldB = 0.29;

	for (let i = 0; i < count; i++) {
		const typeIdx = i * 4 + 3;
		const particleType = positionData[typeIdx];

		const idx = i * 4;
		if (particleType === PARTICLE_TYPE.SCAFFOLD) {
			data[idx] = scaffoldR;
			data[idx + 1] = scaffoldG;
			data[idx + 2] = scaffoldB;
			data[idx + 3] = 1.0; // alpha
		} else {
			// User particles - will be set dynamically
			data[idx] = 1.0;
			data[idx + 1] = 1.0;
			data[idx + 2] = 1.0;
			data[idx + 3] = 1.0;
		}
	}

	return data;
}

/**
 * Generate velocity/state data for particles
 * RGBA: velocity.xyz, spawnTime
 */
export function generateVelocityData(count: number): Float32Array {
	const data = new Float32Array(count * 4);
	// Initialize all to zero velocity, no spawn time
	return data;
}

/**
 * Convert 1D particle index to 2D texture coordinates
 */
export function indexToUV(index: number): { u: number; v: number } {
	const u = (index % TEXTURE_SIZE) / TEXTURE_SIZE;
	const v = Math.floor(index / TEXTURE_SIZE) / TEXTURE_SIZE;
	return { u, v };
}

/**
 * Convert 2D texture coordinates to 1D particle index
 */
export function uvToIndex(u: number, v: number): number {
	const x = Math.floor(u * TEXTURE_SIZE);
	const y = Math.floor(v * TEXTURE_SIZE);
	return y * TEXTURE_SIZE + x;
}

/**
 * Find available scaffold particle indices for spawning users
 */
export function findAvailableScaffoldIndices(
	positionData: Float32Array,
	count: number,
): number[] {
	const available: number[] = [];
	for (let i = 0; i < TOTAL_PARTICLES && available.length < count; i++) {
		if (positionData[i * 4 + 3] === PARTICLE_TYPE.SCAFFOLD) {
			available.push(i);
		}
	}
	return available;
}

/**
 * Get random indices from scaffold particles
 */
export function getRandomScaffoldIndices(
	positionData: Float32Array,
	count: number,
): number[] {
	const available = findAvailableScaffoldIndices(positionData, count * 2);

	// Shuffle and take first 'count'
	for (let i = available.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[available[i], available[j]] = [available[j], available[i]];
	}

	return available.slice(0, count);
}
