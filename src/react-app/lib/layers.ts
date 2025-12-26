/**
 * Scene Layer Constants
 *
 * Centralized z-depth and sizing constants for the visualization.
 * Prevents z-fighting and ensures consistent layer ordering.
 */

/** Z-depth positions for each visual layer (front to back) */
export const LAYER_DEPTHS = {
	/** Central breathing sphere position */
	BREATHING_SPHERE: 0,
	/** User particles orbit range - closest to sphere when inhaled */
	USER_PARTICLES_SETTLED: 8,
	/** User particles orbit range - furthest from sphere when exhaled */
	USER_PARTICLES_SPREAD: 18,
	/** Peripheral sparkle particles z-range */
	PERIPHERAL_PARTICLES_Z: 50,
	/** Star field inner radius */
	STAR_FIELD_RADIUS: 100,
	/** Star field depth range */
	STAR_FIELD_DEPTH: 50,
	/** Galaxy background plane position */
	GALAXY_BACKGROUND: -80,
} as const;

/** Scale factor to convert config sphere radius to particle system units */
export const PARTICLE_RADIUS_SCALE = 10;

/** Camera configuration */
export const CAMERA = {
	POSITION_Z: 50,
	FOV: 60,
} as const;

/** Post-processing effect constants */
export const POST_PROCESSING = {
	BLOOM_INTENSITY: 0.3,
	BLOOM_THRESHOLD: 0.6,
	BLOOM_SMOOTHING: 0.9,
	BLOOM_RADIUS: 0.8,
	VIGNETTE_OFFSET: 0.35,
} as const;
