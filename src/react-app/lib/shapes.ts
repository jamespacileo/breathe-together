/**
 * Shape definitions for particle formation animations
 * Each shape is defined as a function that returns normalized [x, y] coordinates
 * for a given particle index out of total count.
 */

export type ShapeFunction = (
	index: number,
	total: number,
) => { x: number; y: number };

export interface ShapeDefinition {
	name: string;
	displayName: string;
	generate: ShapeFunction;
}

/**
 * Generate points along a parametric heart curve
 * Using the classic heart curve: x = 16sin³(t), y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
 */
function heartShape(index: number, total: number): { x: number; y: number } {
	const t = (index / total) * Math.PI * 2;
	// Heart parametric equations (scaled to ~1 unit radius)
	const x = 16 * Math.sin(t) ** 3;
	const y =
		13 * Math.cos(t) -
		5 * Math.cos(2 * t) -
		2 * Math.cos(3 * t) -
		Math.cos(4 * t);
	// Normalize to roughly unit circle scale and flip y to orient upward
	return { x: x / 17, y: -y / 17 + 0.1 };
}

/**
 * Generate points along a star shape
 * Alternates between inner and outer radius points
 */
function starShape(
	index: number,
	total: number,
	points = 5,
): { x: number; y: number } {
	const innerRadius = 0.4;
	const outerRadius = 1.0;

	// Distribute particles along the star outline
	const pointsOnStar = points * 2; // Inner and outer vertices
	const segmentIndex = Math.floor((index / total) * pointsOnStar);
	const segmentProgress = ((index / total) * pointsOnStar) % 1;

	const isOuter = segmentIndex % 2 === 0;
	const startRadius = isOuter ? outerRadius : innerRadius;
	const endRadius = isOuter ? innerRadius : outerRadius;

	const currentAngle =
		(segmentIndex / pointsOnStar) * Math.PI * 2 - Math.PI / 2;
	const nextAngle =
		((segmentIndex + 1) / pointsOnStar) * Math.PI * 2 - Math.PI / 2;

	// Interpolate along the edge
	const r = startRadius + (endRadius - startRadius) * segmentProgress;
	const a = currentAngle + (nextAngle - currentAngle) * segmentProgress;

	return { x: Math.cos(a) * r, y: Math.sin(a) * r };
}

/**
 * Infinity symbol (lemniscate of Bernoulli)
 */
function infinityShape(index: number, total: number): { x: number; y: number } {
	const t = (index / total) * Math.PI * 2;
	const scale = 0.7;
	const a = scale;
	// Lemniscate parametric: x = a*cos(t)/(1+sin²(t)), y = a*sin(t)*cos(t)/(1+sin²(t))
	const denom = 1 + Math.sin(t) ** 2;
	const x = (a * Math.cos(t)) / denom;
	const y = (a * Math.sin(t) * Math.cos(t)) / denom;
	return { x: x * 1.5, y };
}

/**
 * Diamond/rhombus shape
 */
function diamondShape(index: number, total: number): { x: number; y: number } {
	const progress = index / total;
	const segment = Math.floor(progress * 4);
	const segProgress = (progress * 4) % 1;

	const points = [
		{ x: 0, y: 1 }, // Top
		{ x: 0.8, y: 0 }, // Right
		{ x: 0, y: -1 }, // Bottom
		{ x: -0.8, y: 0 }, // Left
	];

	const start = points[segment];
	const end = points[(segment + 1) % 4];

	return {
		x: start.x + (end.x - start.x) * segProgress,
		y: start.y + (end.y - start.y) * segProgress,
	};
}

/**
 * Lotus flower shape (multi-petal)
 */
function lotusShape(
	index: number,
	total: number,
	petals = 6,
): { x: number; y: number } {
	const t = (index / total) * Math.PI * 2;
	// Rose curve: r = cos(k*theta), k = petals/2 for petals number of petals
	const k = petals / 2;
	const r = Math.abs(Math.cos(k * t)) * 0.6 + 0.4;
	return { x: Math.cos(t) * r, y: Math.sin(t) * r };
}

/**
 * Spiral shape (Archimedean spiral)
 */
function spiralShape(index: number, total: number): { x: number; y: number } {
	const maxTurns = 2;
	const t = (index / total) * Math.PI * 2 * maxTurns;
	const r = (index / total) * 0.9 + 0.1;
	return { x: Math.cos(t) * r, y: Math.sin(t) * r };
}

/**
 * Triangle shape
 */
function triangleShape(index: number, total: number): { x: number; y: number } {
	const progress = index / total;
	const segment = Math.floor(progress * 3);
	const segProgress = (progress * 3) % 1;

	const points = [
		{ x: 0, y: 1 }, // Top
		{ x: 0.866, y: -0.5 }, // Bottom right
		{ x: -0.866, y: -0.5 }, // Bottom left
	];

	const start = points[segment];
	const end = points[(segment + 1) % 3];

	return {
		x: start.x + (end.x - start.x) * segProgress,
		y: start.y + (end.y - start.y) * segProgress,
	};
}

/**
 * Wave/sine shape (horizontal wave)
 */
function waveShape(index: number, total: number): { x: number; y: number } {
	const x = (index / total) * 2 - 1; // -1 to 1
	const y = Math.sin(x * Math.PI * 2) * 0.4;
	return { x, y };
}

/**
 * Circle (default/relaxed state)
 */
function circleShape(index: number, total: number): { x: number; y: number } {
	const angle = (index / total) * Math.PI * 2;
	return { x: Math.cos(angle), y: Math.sin(angle) };
}

/**
 * Crescent moon shape
 */
function crescentShape(index: number, total: number): { x: number; y: number } {
	const t = (index / total) * Math.PI * 2;
	// Outer circle coordinates
	const outerX = Math.cos(t);
	const outerY = Math.sin(t);
	// Create crescent by blending toward inner offset on one side
	const blend = Math.max(0, Math.cos(t));
	return {
		x: outerX - blend * 0.4,
		y: outerY,
	};
}

/**
 * Butterfly shape
 */
function butterflyShape(
	index: number,
	total: number,
): { x: number; y: number } {
	const t = (index / total) * Math.PI * 2;
	// Butterfly curve
	const exp = Math.exp(Math.cos(t));
	const cos2t = Math.cos(2 * t);
	const sin5 = Math.sin(t / 12) ** 5;
	const r = exp - 2 * cos2t + sin5;
	const x = Math.sin(t) * r * 0.25;
	const y = Math.cos(t) * r * 0.25;
	return { x, y };
}

/**
 * Available shapes registry
 */
export const SHAPES: Record<string, ShapeDefinition> = {
	circle: {
		name: 'circle',
		displayName: 'Circle',
		generate: circleShape,
	},
	heart: {
		name: 'heart',
		displayName: 'Heart',
		generate: heartShape,
	},
	star: {
		name: 'star',
		displayName: 'Star',
		generate: (i, t) => starShape(i, t, 5),
	},
	star6: {
		name: 'star6',
		displayName: 'Hexagram',
		generate: (i, t) => starShape(i, t, 6),
	},
	infinity: {
		name: 'infinity',
		displayName: 'Infinity',
		generate: infinityShape,
	},
	diamond: {
		name: 'diamond',
		displayName: 'Diamond',
		generate: diamondShape,
	},
	lotus: {
		name: 'lotus',
		displayName: 'Lotus',
		generate: (i, t) => lotusShape(i, t, 6),
	},
	lotus8: {
		name: 'lotus8',
		displayName: 'Lotus (8 petals)',
		generate: (i, t) => lotusShape(i, t, 8),
	},
	spiral: {
		name: 'spiral',
		displayName: 'Spiral',
		generate: spiralShape,
	},
	triangle: {
		name: 'triangle',
		displayName: 'Triangle',
		generate: triangleShape,
	},
	wave: {
		name: 'wave',
		displayName: 'Wave',
		generate: waveShape,
	},
	crescent: {
		name: 'crescent',
		displayName: 'Crescent',
		generate: crescentShape,
	},
	butterfly: {
		name: 'butterfly',
		displayName: 'Butterfly',
		generate: butterflyShape,
	},
};

/**
 * Get shape names for UI dropdowns
 */
export function getShapeOptions(): Array<{ value: string; label: string }> {
	return Object.values(SHAPES).map((shape) => ({
		value: shape.name,
		label: shape.displayName,
	}));
}

/**
 * Get a shape generator by name, defaults to circle
 */
export function getShapeGenerator(name: string): ShapeFunction {
	return SHAPES[name]?.generate ?? SHAPES.circle.generate;
}

/**
 * Generate all shape positions for a given particle count
 * Pre-calculates positions for performance
 */
export function generateShapePositions(
	shapeName: string,
	count: number,
): Float32Array {
	const generator = getShapeGenerator(shapeName);
	const positions = new Float32Array(count * 2);

	for (let i = 0; i < count; i++) {
		const { x, y } = generator(i, count);
		positions[i * 2] = x;
		positions[i * 2 + 1] = y;
	}

	return positions;
}
