import { z } from 'zod';

/**
 * Zod schema for breathing visualization configuration
 * Provides runtime validation with min/max ranges
 */
export const VisualizationConfigSchema = z.object({
	// Particle System
	particleCount: z.number().min(10).max(500).describe('Number of particles'),
	particleMinSize: z
		.number()
		.min(0.5)
		.max(10)
		.describe('Minimum particle size in pixels'),
	particleMaxSize: z
		.number()
		.min(1)
		.max(15)
		.describe('Maximum particle size in pixels'),
	particleMinOpacity: z
		.number()
		.min(0.05)
		.max(1)
		.describe('Minimum particle opacity'),
	particleMaxOpacity: z
		.number()
		.min(0.1)
		.max(1)
		.describe('Maximum particle opacity'),

	// Spring Physics (per particle)
	springTension: z.number().min(20).max(300).describe('Spring tension'),
	springTensionVariance: z
		.number()
		.min(0)
		.max(150)
		.describe('Spring tension variance'),
	springFriction: z.number().min(5).max(50).describe('Spring friction'),
	springFrictionVariance: z
		.number()
		.min(0)
		.max(25)
		.describe('Spring friction variance'),

	// Breathing Animation
	baseRadius: z
		.number()
		.min(0.1)
		.max(0.5)
		.describe('Base radius as fraction of viewport'),
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

	// Main Spring (global breathing)
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

	// Visual Effects
	glowIntensity: z.number().min(0).max(1).describe('Glow intensity'),
	glowRadius: z.number().min(1).max(3).describe('Glow radius multiplier'),
	trailFade: z
		.number()
		.min(0)
		.max(1)
		.describe('Trail fade (0=trail, 1=instant clear)'),
	coreRadius: z.number().min(5).max(50).describe('Core radius in pixels'),
	coreOpacity: z.number().min(0).max(1).describe('Core opacity'),

	// Particle Movement
	wobbleAmount: z.number().min(0).max(0.2).describe('Wobble amount'),
	wobbleSpeed: z.number().min(0).max(0.005).describe('Wobble speed'),
	radiusVarianceMin: z
		.number()
		.min(0.5)
		.max(1)
		.describe('Minimum radius variance'),
	radiusVarianceMax: z
		.number()
		.min(1)
		.max(1.5)
		.describe('Maximum radius variance'),
	angleOffsetRange: z.number().min(0).max(1).describe('Angle offset range'),

	// Shape Formation (particles form shapes on inhale)
	shapeEnabled: z.boolean().describe('Enable shape formation on inhale'),
	shapeName: z
		.string()
		.describe('Shape to form: heart, star, infinity, diamond, lotus, etc.'),
	shapeFormationStrength: z
		.number()
		.min(0)
		.max(1)
		.describe('How tightly particles conform to shape (0-1)'),
	shapeSpringTension: z
		.number()
		.min(50)
		.max(300)
		.describe('Spring tension for shape transitions'),
	shapeSpringFriction: z
		.number()
		.min(5)
		.max(40)
		.describe('Spring friction for shape transitions'),
	shapeHoldWobble: z
		.number()
		.min(0)
		.max(0.1)
		.describe('Subtle wobble when holding shape'),

	// Presence Particles
	presenceCount: z.number().min(0).max(200).describe('Presence particle count'),
	presenceRadius: z.number().min(1).max(2).describe('Presence orbit radius'),
	presenceSize: z.number().min(1).max(10).describe('Presence particle size'),
	presenceOpacity: z
		.number()
		.min(0)
		.max(0.5)
		.describe('Presence particle opacity'),
	presenceOrbitSpeed: z
		.number()
		.min(0)
		.max(0.001)
		.describe('Presence orbit speed'),

	// Aurora Ribbons (density visualization)
	ribbonEnabled: z.boolean().describe('Enable aurora ribbon rendering'),
	ribbonBaseWidth: z
		.number()
		.min(1)
		.max(30)
		.describe('Base ribbon width in pixels'),
	ribbonScaleFactor: z
		.number()
		.min(0.5)
		.max(5)
		.describe('Logarithmic scale factor for user count'),
	ribbonSegments: z
		.number()
		.min(8)
		.max(64)
		.describe('Ribbon smoothness (vertex count)'),
	ribbonPulseAmount: z
		.number()
		.min(0)
		.max(0.1)
		.describe('Ribbon breathing pulse amplitude'),
	ribbonBlendWidth: z
		.number()
		.min(0)
		.max(0.2)
		.describe('Color blend width at segment boundaries'),

	// Firefly Particles (sampled individuals)
	fireflyCount: z
		.number()
		.min(0)
		.max(200)
		.describe('Max visible firefly particles'),
	fireflySize: z.number().min(1).max(8).describe('Firefly particle size'),
	fireflyPulseSpeed: z
		.number()
		.min(0.001)
		.max(0.01)
		.describe('Firefly pulse animation speed'),
	fireflyFadeIn: z
		.number()
		.min(500)
		.max(5000)
		.describe('Arrival fade-in duration (ms)'),
	fireflyFadeOut: z
		.number()
		.min(500)
		.max(5000)
		.describe('Departure fade-out duration (ms)'),
	fireflyResampleInterval: z
		.number()
		.min(5000)
		.max(30000)
		.describe('Resample interval (ms)'),

	// You Are Here (current user marker)
	youAreHereSizeMultiplier: z
		.number()
		.min(1)
		.max(3)
		.describe('Your particle size multiplier'),
	youAreHereGlowRadius: z
		.number()
		.min(0)
		.max(20)
		.describe('Your particle glow radius'),
	youAreHereGlowOpacity: z
		.number()
		.min(0)
		.max(1)
		.describe('Your particle glow opacity'),

	// Slice Hover Interaction
	sliceHoverEnabled: z.boolean().describe('Enable slice hover interaction'),
	sliceHoverDelay: z
		.number()
		.min(0)
		.max(500)
		.describe('Hover debounce delay (ms)'),
	sliceHighlightOpacity: z
		.number()
		.min(0)
		.max(0.5)
		.describe('Slice highlight opacity'),

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
	// Particle System
	particleCount: 200,
	particleMinSize: 1.5,
	particleMaxSize: 4,
	particleMinOpacity: 0.2,
	particleMaxOpacity: 0.5,

	// Spring Physics
	springTension: 120,
	springTensionVariance: 60,
	springFriction: 18,
	springFrictionVariance: 12,

	// Breathing Animation
	baseRadius: 0.28,
	breatheInScale: 0.7,
	breatheOutScale: 1.2,
	holdOscillation: 0.02,
	holdOscillationSpeed: 0.003,

	// Main Spring
	mainSpringTension: 100,
	mainSpringFriction: 20,

	// Visual Effects
	glowIntensity: 0.1,
	glowRadius: 1.5,
	trailFade: 0.12,
	coreRadius: 10,
	coreOpacity: 0.25,

	// Particle Movement
	wobbleAmount: 0.05,
	wobbleSpeed: 0.0007,
	radiusVarianceMin: 0.8,
	radiusVarianceMax: 1.2,
	angleOffsetRange: 0.3,

	// Shape Formation
	shapeEnabled: true,
	shapeName: 'heart',
	shapeFormationStrength: 0.85,
	shapeSpringTension: 120,
	shapeSpringFriction: 18,
	shapeHoldWobble: 0.02,

	// Presence Particles
	presenceCount: 50,
	presenceRadius: 1.3,
	presenceSize: 3,
	presenceOpacity: 0.1,
	presenceOrbitSpeed: 0.0001,

	// Aurora Ribbons
	ribbonEnabled: true,
	ribbonBaseWidth: 6,
	ribbonScaleFactor: 2,
	ribbonSegments: 32,
	ribbonPulseAmount: 0.02,
	ribbonBlendWidth: 0.1,

	// Firefly Particles
	fireflyCount: 80,
	fireflySize: 3,
	fireflyPulseSpeed: 0.003,
	fireflyFadeIn: 2000,
	fireflyFadeOut: 2000,
	fireflyResampleInterval: 10000,

	// You Are Here
	youAreHereSizeMultiplier: 1.5,
	youAreHereGlowRadius: 10,
	youAreHereGlowOpacity: 0.4,

	// Slice Hover
	sliceHoverEnabled: true,
	sliceHoverDelay: 200,
	sliceHighlightOpacity: 0.15,

	// Colors
	primaryColor: '#7EB5C1',
	backgroundColor: '#0f1723',
	backgroundColorMid: '#1a2634',
};
