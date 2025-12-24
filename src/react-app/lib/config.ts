import { z } from 'zod';

/**
 * Zod schema for breathing visualization configuration
 * Provides runtime validation with min/max ranges
 */
export const VisualizationConfigSchema = z.object({
	// Breathing Animation
	breatheInScale: z.number().min(0.3).max(1).describe('Scale when lungs empty'),
	breatheOutScale: z.number().min(1).max(2).describe('Scale when lungs full'),
	holdOscillation: z
		.number()
		.min(0)
		.max(0.1)
		.describe('Subtle movement during holds'),
	holdOscillationSpeed: z
		.number()
		.min(0.0001)
		.max(0.01)
		.describe('Hold oscillation speed'),

	// Main Spring (global breathing physics)
	mainSpringTension: z
		.number()
		.min(20)
		.max(200)
		.describe('Main spring tension'),
	mainSpringFriction: z
		.number()
		.min(5)
		.max(40)
		.describe('Main spring friction'),

	// 3D Breathing Sphere
	nebulaEnabled: z
		.boolean()
		.describe('Enable 3D breathing sphere visualization'),
	sphereContractedRadius: z
		.number()
		.min(0.3)
		.max(1.5)
		.describe('Sphere radius when fully contracted (inhaled)'),
	sphereExpandedRadius: z
		.number()
		.min(1)
		.max(4)
		.describe('Sphere radius when fully expanded (exhaled)'),
	sphereRotationSpeed: z
		.number()
		.min(0)
		.max(0.1)
		.describe('Sphere rotation speed (radians per second)'),

	// Connection Lines
	connectionEnabled: z
		.boolean()
		.describe('Enable connection lines between particles'),
	connectionDistance: z
		.number()
		.min(0.1)
		.max(1)
		.describe('Max distance for particle connections'),
	connectionOpacity: z
		.number()
		.min(0)
		.max(0.5)
		.describe('Base opacity of connection lines'),

	// Haze Layer
	hazeEnabled: z.boolean().describe('Enable atmospheric haze particles'),
	hazeOpacity: z.number().min(0).max(0.3).describe('Haze particle opacity'),

	// Post-processing Bloom
	bloomEnabled: z.boolean().describe('Enable post-processing bloom'),
	bloomStrength: z.number().min(0).max(3).describe('Bloom intensity'),
	bloomThreshold: z
		.number()
		.min(0)
		.max(1)
		.describe('Luminance threshold for bloom'),
	bloomRadius: z.number().min(0).max(1).describe('Bloom blur radius'),

	// Colors
	primaryColor: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.describe('Primary color (hex)'),
	backgroundColor: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.describe('Background color (hex)'),
	backgroundColorMid: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.describe('Mid background color (hex)'),
});

export type VisualizationConfig = z.infer<typeof VisualizationConfigSchema>;

/**
 * Validate and parse a config, returning defaults for invalid values
 */
export function parseConfig(input: unknown): VisualizationConfig {
	const result = VisualizationConfigSchema.safeParse(input);
	if (result.success) return result.data;
	return DEFAULT_CONFIG;
}

/**
 * Partially update config with validation
 */
export function updateConfig(
	current: VisualizationConfig,
	updates: Partial<VisualizationConfig>,
): VisualizationConfig {
	const merged = { ...current, ...updates };
	return parseConfig(merged);
}

export const DEFAULT_CONFIG: VisualizationConfig = {
	// Breathing Animation
	breatheInScale: 0.7,
	breatheOutScale: 1.2,
	holdOscillation: 0.02,
	holdOscillationSpeed: 0.003,

	// Main Spring (soft, floaty - "suspended in thick air" feel)
	mainSpringTension: 60,
	mainSpringFriction: 14,

	// 3D Breathing Sphere
	nebulaEnabled: true,
	sphereContractedRadius: 0.7,
	sphereExpandedRadius: 2.2,
	sphereRotationSpeed: 0.025,

	// Connection Lines
	connectionEnabled: true,
	connectionDistance: 0.4,
	connectionOpacity: 0.15,

	// Haze Layer
	hazeEnabled: true,
	hazeOpacity: 0.08,

	// Post-processing Bloom
	bloomEnabled: false,
	bloomStrength: 0.3,
	bloomThreshold: 0.6,
	bloomRadius: 0.3,

	// Colors
	primaryColor: '#7EB5C1',
	backgroundColor: '#0f1723',
	backgroundColorMid: '#1a2634',
};
