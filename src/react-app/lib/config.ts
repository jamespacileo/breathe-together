import { z } from 'zod';

/**
 * Simplified visualization configuration
 * Only includes settings that directly impact the breathing animation
 */
export const VisualizationConfigSchema = z.object({
	// Particle Sphere - the main visual element
	sphereContractedRadius: z
		.number()
		.min(0.3)
		.max(2)
		.describe('Sphere radius when fully contracted (inhaled)'),
	sphereExpandedRadius: z
		.number()
		.min(1)
		.max(5)
		.describe('Sphere radius when fully expanded (exhaled)'),

	// Particle appearance
	particleBrightness: z
		.number()
		.min(0.1)
		.max(1.5)
		.describe('Base particle brightness'),
	particleSize: z
		.number()
		.min(0.3)
		.max(3)
		.describe('Base particle size multiplier'),

	// Animation feel
	noiseStrength: z
		.number()
		.min(0)
		.max(1)
		.describe('Fluid noise displacement strength'),
	rotationSpeed: z.number().min(0).max(0.01).describe('Sphere rotation speed'),

	// Colors
	primaryColor: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.describe('Primary accent color (hex)'),
	backgroundColor: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.describe('Background color (hex)'),
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
	// Particle Sphere
	sphereContractedRadius: 0.6,
	sphereExpandedRadius: 2.0,

	// Particle appearance - reduced brightness for softer glow
	particleBrightness: 0.6,
	particleSize: 1.0,

	// Animation feel
	noiseStrength: 0.5,
	rotationSpeed: 0.002,

	// Colors
	primaryColor: '#7EB5C1',
	backgroundColor: '#0a0a12',
};
