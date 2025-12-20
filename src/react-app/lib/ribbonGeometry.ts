import { getMoodColor } from './colors';
import type { VisualizationConfig } from './config';
import { MOOD_IDS, type MoodId } from './simulationConfig';

/**
 * Ribbon vertex data for a single mood segment
 */
export interface RibbonSegment {
	moodId: MoodId;
	vertices: Float32Array; // [x1, y1, x2, y2, ...] pairs for triangle strip
	colors: Float32Array; // [r, g, b, a, ...] per vertex
	startAngle: number;
	endAngle: number;
	userCount: number;
}

/**
 * Complete ribbon geometry for all mood segments
 */
export interface RibbonGeometry {
	segments: RibbonSegment[];
	totalVertices: number;
	timestamp: number;
}

/**
 * Parse hex color to RGB values (0-1 range)
 */
function hexToRgb(hex: string): [number, number, number] {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!result) return [1, 1, 1];
	return [
		parseInt(result[1], 16) / 255,
		parseInt(result[2], 16) / 255,
		parseInt(result[3], 16) / 255,
	];
}

/**
 * Calculate ribbon width based on user count
 * Uses logarithmic scaling so 1 user and 1000 users don't differ by 1000x
 */
export function calculateRibbonWidth(
	userCount: number,
	baseWidth: number,
	scaleFactor: number,
): number {
	if (userCount <= 0) return 0;
	// log(1) = 0, log(10) ≈ 2.3, log(100) ≈ 4.6, log(1000) ≈ 6.9
	return baseWidth + Math.log(userCount + 1) * scaleFactor;
}

/**
 * Generate ribbon geometry for a single mood segment
 */
export function generateMoodRibbon(
	moodId: MoodId,
	startAngle: number,
	arcSize: number,
	userCount: number,
	baseRadius: number,
	config: VisualizationConfig,
	time: number,
	breathProgress: number,
): RibbonSegment {
	const segments = config.ribbonSegments;
	const ribbonWidth = calculateRibbonWidth(
		userCount,
		config.ribbonBaseWidth,
		config.ribbonScaleFactor,
	);

	// Get mood color
	const colorHex = getMoodColor(moodId);
	const [r, g, b] = hexToRgb(colorHex);

	// Vertices: 2 vertices per segment point (inner and outer edge)
	// Triangle strip needs (segments + 1) * 2 vertices
	const vertexCount = (segments + 1) * 2;
	const vertices = new Float32Array(vertexCount * 2); // x, y pairs
	const colors = new Float32Array(vertexCount * 4); // r, g, b, a

	for (let i = 0; i <= segments; i++) {
		const t = i / segments;
		const angle = startAngle + t * arcSize;

		// Breathing pulse: subtle undulation along the ribbon
		const breathPulse =
			Math.sin(breathProgress * Math.PI * 2 + t * Math.PI) *
			config.ribbonPulseAmount;

		// Organic wave: adds life to the ribbon
		const wave = Math.sin(time * 0.001 + angle * 3) * 0.005;

		const halfWidth = ribbonWidth / 2 / (baseRadius * 100); // Normalize to radius units
		const innerRadius =
			baseRadius * config.presenceRadius - halfWidth + breathPulse + wave;
		const outerRadius =
			baseRadius * config.presenceRadius + halfWidth + breathPulse + wave;

		// Inner vertex
		const innerIdx = i * 4; // 2 vertices per i, 2 floats per vertex
		vertices[innerIdx] = Math.cos(angle) * innerRadius;
		vertices[innerIdx + 1] = Math.sin(angle) * innerRadius;

		// Outer vertex
		vertices[innerIdx + 2] = Math.cos(angle) * outerRadius;
		vertices[innerIdx + 3] = Math.sin(angle) * outerRadius;

		// Calculate opacity with edge fade
		const edgeFade = Math.min(t, 1 - t) / config.ribbonBlendWidth;
		const baseOpacity = Math.min(1, edgeFade) * config.presenceOpacity;

		// Breathing intensity pulse
		const intensityPulse = 0.7 + 0.3 * Math.sin(breathProgress * Math.PI * 2);
		const finalOpacity = baseOpacity * intensityPulse;

		// Inner vertex color (slightly darker)
		const colorIdx = i * 8;
		colors[colorIdx] = r * 0.8;
		colors[colorIdx + 1] = g * 0.8;
		colors[colorIdx + 2] = b * 0.8;
		colors[colorIdx + 3] = finalOpacity * 0.7;

		// Outer vertex color (brighter, aurora glow effect)
		colors[colorIdx + 4] = r;
		colors[colorIdx + 5] = g;
		colors[colorIdx + 6] = b;
		colors[colorIdx + 7] = finalOpacity;
	}

	return {
		moodId,
		vertices,
		colors,
		startAngle,
		endAngle: startAngle + arcSize,
		userCount,
	};
}

/**
 * Calculate angular positions for each mood segment
 * Distributes moods around the circle proportional to their user counts
 */
export function calculateMoodAngles(
	moodCounts: Record<MoodId, number>,
	gapSize: number = 0.05, // Gap between segments in radians
): Map<MoodId, { startAngle: number; arcSize: number }> {
	const result = new Map<MoodId, { startAngle: number; arcSize: number }>();

	// Get moods with users
	const activeMoods = MOOD_IDS.filter((id) => moodCounts[id] > 0);
	if (activeMoods.length === 0) return result;

	const totalUsers = activeMoods.reduce((sum, id) => sum + moodCounts[id], 0);
	const totalGaps = activeMoods.length * gapSize;
	const availableArc = Math.PI * 2 - totalGaps;

	let currentAngle = -Math.PI / 2; // Start at top

	for (const moodId of activeMoods) {
		const proportion = moodCounts[moodId] / totalUsers;
		const arcSize = proportion * availableArc;

		result.set(moodId, {
			startAngle: currentAngle,
			arcSize,
		});

		currentAngle += arcSize + gapSize;
	}

	return result;
}

/**
 * Generate complete ribbon geometry for all moods
 */
export function generateRibbonGeometry(
	moodCounts: Record<MoodId, number>,
	baseRadius: number,
	config: VisualizationConfig,
	time: number,
	breathProgress: number,
): RibbonGeometry {
	const moodAngles = calculateMoodAngles(moodCounts);
	const segments: RibbonSegment[] = [];
	let totalVertices = 0;

	for (const [moodId, { startAngle, arcSize }] of moodAngles) {
		const userCount = moodCounts[moodId];
		if (userCount <= 0) continue;

		const segment = generateMoodRibbon(
			moodId,
			startAngle,
			arcSize,
			userCount,
			baseRadius,
			config,
			time,
			breathProgress,
		);

		segments.push(segment);
		totalVertices += segment.vertices.length / 2;
	}

	return {
		segments,
		totalVertices,
		timestamp: time,
	};
}

/**
 * Get the mood at a specific angle (for hover detection)
 */
export function getMoodAtAngle(
	angle: number,
	moodCounts: Record<MoodId, number>,
): MoodId | null {
	const moodAngles = calculateMoodAngles(moodCounts);

	// Normalize angle to [0, 2π)
	let normalizedAngle = angle;
	while (normalizedAngle < 0) normalizedAngle += Math.PI * 2;
	while (normalizedAngle >= Math.PI * 2) normalizedAngle -= Math.PI * 2;

	for (const [moodId, { startAngle, arcSize }] of moodAngles) {
		// Normalize start angle
		let normStart = startAngle;
		while (normStart < 0) normStart += Math.PI * 2;

		const endAngle = normStart + arcSize;

		if (normalizedAngle >= normStart && normalizedAngle <= endAngle) {
			return moodId;
		}

		// Handle wrap-around case
		if (endAngle > Math.PI * 2) {
			if (normalizedAngle <= endAngle - Math.PI * 2) {
				return moodId;
			}
		}
	}

	return null;
}

/**
 * Check if a point is within the ribbon ring zone
 */
export function isInRibbonZone(
	x: number,
	y: number,
	centerX: number,
	centerY: number,
	baseRadius: number,
	config: VisualizationConfig,
): boolean {
	const dx = x - centerX;
	const dy = y - centerY;
	const distance = Math.sqrt(dx * dx + dy * dy);

	const ribbonRadius = baseRadius * config.presenceRadius;
	const maxWidth =
		config.ribbonBaseWidth + Math.log(1001) * config.ribbonScaleFactor; // Max possible width
	const tolerance = maxWidth / 2 / (baseRadius * 100) + 0.05;

	return Math.abs(distance - ribbonRadius) < tolerance;
}
