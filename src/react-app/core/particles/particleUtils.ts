/**
 * Particle distribution and initialization utilities
 */
import { COLOR_INDICES, FBO_SIZE, TOTAL_PARTICLES } from './constants';

export interface ParticleData {
	positions: Float32Array; // RGBA: x, y, z, type
	colors: Float32Array; // RGBA: r, g, b, alpha
}

/**
 * Generate Fibonacci spiral distribution on unit sphere
 * Creates evenly distributed points for 50K particles
 */
export function generateFibonacciSphere(count: number): Float32Array {
	const goldenAngle = Math.PI * (3 - Math.sqrt(5));
	const data = new Float32Array(count * 4);

	for (let i = 0; i < count; i++) {
		const y = 1 - (i / (count - 1)) * 2; // -1 to 1
		const radius = Math.sqrt(1 - y * y);
		const theta = goldenAngle * i;

		const x = Math.cos(theta) * radius;
		const z = Math.sin(theta) * radius;

		const idx = i * 4;
		data[idx] = x;
		data[idx + 1] = y;
		data[idx + 2] = z;
		data[idx + 3] = COLOR_INDICES.scaffold; // All start as scaffold
	}

	return data;
}

/**
 * Initialize particle textures for GPU computation
 */
export function initializeParticleTextures(): ParticleData {
	const textureSize = FBO_SIZE * FBO_SIZE;

	// Position + Type texture (RGBA float)
	const positions = new Float32Array(textureSize * 4);

	// Generate Fibonacci sphere for active particles
	const sphereData = generateFibonacciSphere(TOTAL_PARTICLES);

	// Copy sphere data to texture, rest stays at origin
	for (let i = 0; i < TOTAL_PARTICLES; i++) {
		const srcIdx = i * 4;
		const dstIdx = i * 4;
		positions[dstIdx] = sphereData[srcIdx]; // x
		positions[dstIdx + 1] = sphereData[srcIdx + 1]; // y
		positions[dstIdx + 2] = sphereData[srcIdx + 2]; // z
		positions[dstIdx + 3] = sphereData[srcIdx + 3]; // type (scaffold = 0)
	}

	// Color texture (RGBA float) - scaffold color for all initially
	const colors = new Float32Array(textureSize * 4);
	const scaffoldColor = [0.102, 0.165, 0.29]; // #1a2a4a

	for (let i = 0; i < textureSize; i++) {
		const idx = i * 4;
		colors[idx] = scaffoldColor[0];
		colors[idx + 1] = scaffoldColor[1];
		colors[idx + 2] = scaffoldColor[2];
		colors[idx + 3] = 1.0;
	}

	return { positions, colors };
}

/**
 * Get texture coordinates for a particle index
 */
export function getParticleUV(index: number): { u: number; v: number } {
	const x = index % FBO_SIZE;
	const y = Math.floor(index / FBO_SIZE);
	return {
		u: (x + 0.5) / FBO_SIZE,
		v: (y + 0.5) / FBO_SIZE,
	};
}

/**
 * Find available scaffold particle indices
 */
export function findScaffoldParticles(
	positionData: Float32Array,
	count: number,
): number[] {
	const indices: number[] = [];
	for (let i = 0; i < TOTAL_PARTICLES && indices.length < count; i++) {
		const type = positionData[i * 4 + 3];
		if (type === COLOR_INDICES.scaffold) {
			indices.push(i);
		}
	}
	return indices;
}

export { TOTAL_PARTICLES, FBO_SIZE };
