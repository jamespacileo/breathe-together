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

	// Particles
	particleDensity: z
		.number()
		.min(32)
		.max(80)
		.describe('Particle grid resolution (FBO size, affects performance)'),
	peripheralParticleCount: z
		.number()
		.min(20)
		.max(120)
		.describe('Number of sparse outer particles'),

	// Rendering
	canvasBackground: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.describe('Canvas background color (hex)'),
	vignetteIntensity: z
		.number()
		.min(0)
		.max(1)
		.describe('Vignette darkness intensity'),
	noiseOpacity: z.number().min(0).max(0.3).describe('Film grain noise opacity'),

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
	sphereContractedRadius: 0.7,
	sphereExpandedRadius: 2.2,

	// Particles
	particleDensity: 56,
	peripheralParticleCount: 60,

	// Rendering
	canvasBackground: '#0a0a12',
	vignetteIntensity: 0.4,
	noiseOpacity: 0.08,

	// Colors
	primaryColor: '#7EB5C1',
	backgroundColor: '#0f1723',
	backgroundColorMid: '#1a2634',
};
