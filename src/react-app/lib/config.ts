import { z } from 'zod';

/**
 * Zod schema for breathing visualization configuration
 * Provides runtime validation with min/max ranges
 */
export const VisualizationConfigSchema = z.object({
  // Particle System
  particleCount: z.number().min(10).max(500).describe('Number of particles'),
  particleMinSize: z.number().min(0.5).max(10).describe('Minimum particle size in pixels'),
  particleMaxSize: z.number().min(1).max(15).describe('Maximum particle size in pixels'),
  particleMinOpacity: z.number().min(0.05).max(1).describe('Minimum particle opacity'),
  particleMaxOpacity: z.number().min(0.1).max(1).describe('Maximum particle opacity'),

  // Spring Physics (per particle)
  springTension: z.number().min(20).max(300).describe('Spring tension'),
  springTensionVariance: z.number().min(0).max(150).describe('Spring tension variance'),
  springFriction: z.number().min(5).max(50).describe('Spring friction'),
  springFrictionVariance: z.number().min(0).max(25).describe('Spring friction variance'),

  // Breathing Animation
  baseRadius: z.number().min(0.1).max(0.5).describe('Base radius as fraction of viewport'),
  breatheInScale: z.number().min(0.3).max(1).describe('Scale when lungs empty'),
  breatheOutScale: z.number().min(1).max(2).describe('Scale when lungs full'),
  holdOscillation: z.number().min(0).max(0.1).describe('Subtle movement during holds'),
  holdOscillationSpeed: z.number().min(0.0001).max(0.01).describe('Hold oscillation speed'),

  // Main Spring (global breathing)
  mainSpringTension: z.number().min(20).max(200).describe('Main spring tension'),
  mainSpringFriction: z.number().min(5).max(40).describe('Main spring friction'),

  // Visual Effects
  glowIntensity: z.number().min(0).max(1).describe('Glow intensity'),
  glowRadius: z.number().min(1).max(3).describe('Glow radius multiplier'),
  trailFade: z.number().min(0).max(1).describe('Trail fade (0=trail, 1=instant clear)'),
  coreRadius: z.number().min(5).max(50).describe('Core radius in pixels'),
  coreOpacity: z.number().min(0).max(1).describe('Core opacity'),

  // Particle Movement
  wobbleAmount: z.number().min(0).max(0.2).describe('Wobble amount'),
  wobbleSpeed: z.number().min(0).max(0.005).describe('Wobble speed'),
  radiusVarianceMin: z.number().min(0.5).max(1).describe('Minimum radius variance'),
  radiusVarianceMax: z.number().min(1).max(1.5).describe('Maximum radius variance'),
  angleOffsetRange: z.number().min(0).max(1).describe('Angle offset range'),

  // Presence Particles
  presenceCount: z.number().min(0).max(200).describe('Presence particle count'),
  presenceRadius: z.number().min(1).max(2).describe('Presence orbit radius'),
  presenceSize: z.number().min(1).max(10).describe('Presence particle size'),
  presenceOpacity: z.number().min(0).max(0.5).describe('Presence particle opacity'),
  presenceOrbitSpeed: z.number().min(0).max(0.001).describe('Presence orbit speed'),

  // Colors
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).describe('Primary color (hex)'),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).describe('Background color (hex)'),
  backgroundColorMid: z.string().regex(/^#[0-9A-Fa-f]{6}$/).describe('Mid background color (hex)'),
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
  updates: Partial<VisualizationConfig>
): VisualizationConfig {
  const merged = { ...current, ...updates };
  return parseConfig(merged);
}

export const DEFAULT_CONFIG: VisualizationConfig = {
  // Particle System
  particleCount: 200,
  particleMinSize: 2,
  particleMaxSize: 5,
  particleMinOpacity: 0.3,
  particleMaxOpacity: 0.7,

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
  glowIntensity: 0.3,
  glowRadius: 1.5,
  trailFade: 0.12,
  coreRadius: 20,
  coreOpacity: 0.9,

  // Particle Movement
  wobbleAmount: 0.05,
  wobbleSpeed: 0.001,
  radiusVarianceMin: 0.8,
  radiusVarianceMax: 1.2,
  angleOffsetRange: 0.3,

  // Presence Particles
  presenceCount: 50,
  presenceRadius: 1.3,
  presenceSize: 3,
  presenceOpacity: 0.15,
  presenceOrbitSpeed: 0.0001,

  // Colors
  primaryColor: '#7EB5C1',
  backgroundColor: '#0f1723',
  backgroundColorMid: '#1a2634',
};
