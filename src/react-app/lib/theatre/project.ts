/**
 * Theatre.js Project Configuration
 *
 * Defines the main project, sheet, and sequence for the breathing animation.
 * This is the central configuration point for all Theatre.js objects.
 */

import { getProject, types } from '@theatre/core';
import type {
	BreathCycleProps,
	CameraProps,
	CrystalCoreProps,
	InnerGlowProps,
	NebulaProps,
	OrbitingShellProps,
	OuterHaloProps,
	PeripheralParticlesProps,
	PostProcessingProps,
	SceneProps,
	StarFieldProps,
	UserParticlesProps,
} from './types';

// Import saved state for production (will be created after designing in Studio)
// import state from './state.json';

/**
 * Main Theatre.js project
 * In production, pass { state } to load saved animation data
 */
export const project = getProject('BreatheTogetherProject', {
	// state, // Uncomment after exporting state from Studio
});

/**
 * Main sheet containing all animation objects
 */
export const sheet = project.sheet('BreathingScene');

/**
 * Animation sequence - controls playback of the breathing cycle
 */
export const sequence = sheet.sequence;

// =============================================================================
// OBJECT DEFINITIONS
// =============================================================================

/**
 * Master breath cycle object - drives all breath-synced animations
 * 16-second looping timeline (4s per phase: inhale, hold-in, exhale, hold-out)
 */
export const breathCycleObj = sheet.object('breathCycle', {
	breathPhase: types.number(0, { range: [0, 1], nudgeMultiplier: 0.01 }),
	phaseType: types.number(0, { range: [0, 3], nudgeMultiplier: 1 }),
	rawProgress: types.number(0, { range: [0, 1], nudgeMultiplier: 0.01 }),
	easedProgress: types.number(0, { range: [0, 1], nudgeMultiplier: 0.01 }),
	anticipation: types.number(0, { range: [0, 1], nudgeMultiplier: 0.01 }),
	overshoot: types.number(0, { range: [0, 1], nudgeMultiplier: 0.01 }),
	diaphragmDirection: types.number(0, { range: [-1, 1], nudgeMultiplier: 0.1 }),
	colorTemperature: types.number(0, { range: [-1, 1], nudgeMultiplier: 0.1 }),
	crystallization: types.number(0, { range: [0, 1], nudgeMultiplier: 0.01 }),
	breathWave: types.number(0, { range: [0, 1], nudgeMultiplier: 0.01 }),
	phaseTransitionBlend: types.number(0, {
		range: [0, 1],
		nudgeMultiplier: 0.01,
	}),
});

/**
 * Camera object
 */
export const cameraObj = sheet.object('camera', {
	positionX: types.number(0, { range: [-10, 10], nudgeMultiplier: 0.1 }),
	positionY: types.number(0, { range: [-10, 10], nudgeMultiplier: 0.1 }),
	positionZ: types.number(5, { range: [1, 20], nudgeMultiplier: 0.1 }),
	fov: types.number(50, { range: [20, 120], nudgeMultiplier: 1 }),
});

/**
 * Crystal core layer object
 */
export const crystalCoreObj = sheet.object('crystalCore', {
	scale: types.number(0.35, { range: [0.1, 2], nudgeMultiplier: 0.01 }),
	transmission: types.number(0.98, { range: [0, 1], nudgeMultiplier: 0.01 }),
	thickness: types.number(0.3, { range: [0, 2], nudgeMultiplier: 0.01 }),
	roughness: types.number(0.05, { range: [0, 1], nudgeMultiplier: 0.01 }),
	chromaticAberration: types.number(0.06, {
		range: [0, 0.5],
		nudgeMultiplier: 0.01,
	}),
	distortion: types.number(0.08, { range: [0, 0.5], nudgeMultiplier: 0.01 }),
	distortionScale: types.number(0.3, { range: [0, 2], nudgeMultiplier: 0.01 }),
	temporalDistortion: types.number(0.1, {
		range: [0, 1],
		nudgeMultiplier: 0.01,
	}),
});

/**
 * Inner glow layer object (custom shader)
 */
export const innerGlowObj = sheet.object('innerGlow', {
	scale: types.number(0.48, { range: [0.1, 2], nudgeMultiplier: 0.01 }),
	glowIntensity: types.number(0.6, { range: [0, 1], nudgeMultiplier: 0.01 }),
	pulseAmount: types.number(0.08, { range: [0, 0.3], nudgeMultiplier: 0.01 }),
	fresnelPower: types.number(2, { range: [0.5, 5], nudgeMultiplier: 0.1 }),
	coreGlowPower: types.number(1.5, { range: [0.5, 3], nudgeMultiplier: 0.1 }),
	edgeHighlightPower: types.number(3, { range: [1, 6], nudgeMultiplier: 0.1 }),
	colorR: types.number(0.42, { range: [0, 1], nudgeMultiplier: 0.01 }),
	colorG: types.number(0.72, { range: [0, 1], nudgeMultiplier: 0.01 }),
	colorB: types.number(0.82, { range: [0, 1], nudgeMultiplier: 0.01 }),
});

/**
 * Orbiting shell layer object
 */
export const orbitingShellObj = sheet.object('orbitingShell', {
	minRadiusScale: types.number(1.2, { range: [0.5, 2], nudgeMultiplier: 0.01 }),
	maxRadiusScale: types.number(1.8, { range: [1, 4], nudgeMultiplier: 0.01 }),
	orbitSpeed: types.number(0.15, { range: [0, 1], nudgeMultiplier: 0.01 }),
	particleSize: types.number(0.012, {
		range: [0.001, 0.05],
		nudgeMultiplier: 0.001,
	}),
	opacity: types.number(0.4, { range: [0, 1], nudgeMultiplier: 0.01 }),
	pulseAmount: types.number(1.0, { range: [0, 2], nudgeMultiplier: 0.01 }),
	colorR: types.number(0.72, { range: [0, 1], nudgeMultiplier: 0.01 }),
	colorG: types.number(0.91, { range: [0, 1], nudgeMultiplier: 0.01 }),
	colorB: types.number(0.97, { range: [0, 1], nudgeMultiplier: 0.01 }),
});

/**
 * Outer halo layer object
 */
export const outerHaloObj = sheet.object('outerHalo', {
	minScale: types.number(1.5, { range: [0.5, 3], nudgeMultiplier: 0.01 }),
	maxScale: types.number(2.2, { range: [1, 5], nudgeMultiplier: 0.01 }),
	opacity: types.number(0.12, { range: [0, 1], nudgeMultiplier: 0.01 }),
	pulseAmount: types.number(0.1, { range: [0, 0.5], nudgeMultiplier: 0.01 }),
	falloff: types.number(3.0, { range: [1, 6], nudgeMultiplier: 0.1 }),
	colorR: types.number(0.42, { range: [0, 1], nudgeMultiplier: 0.01 }),
	colorG: types.number(0.72, { range: [0, 1], nudgeMultiplier: 0.01 }),
	colorB: types.number(0.82, { range: [0, 1], nudgeMultiplier: 0.01 }),
});

/**
 * User particles swarm object
 */
export const userParticlesObj = sheet.object('userParticles', {
	settledRadiusMult: types.number(1.5, { range: [1, 3], nudgeMultiplier: 0.1 }),
	spreadRadiusMult: types.number(4.0, { range: [2, 8], nudgeMultiplier: 0.1 }),
	orbitSpeed: types.number(0.3, { range: [0, 1], nudgeMultiplier: 0.01 }),
	bobAmount: types.number(0.1, { range: [0, 0.5], nudgeMultiplier: 0.01 }),
	positionSmoothing: types.number(0.08, {
		range: [0.01, 0.2],
		nudgeMultiplier: 0.01,
	}),
	baseSize: types.number(0.015, {
		range: [0.005, 0.05],
		nudgeMultiplier: 0.001,
	}),
	sizeVariation: types.number(0.3, { range: [0, 1], nudgeMultiplier: 0.01 }),
	opacity: types.number(1.0, { range: [0, 1], nudgeMultiplier: 0.01 }),
	crystalOrbitReduction: types.number(0.4, {
		range: [0, 1],
		nudgeMultiplier: 0.01,
	}),
});

/**
 * Nebula background object
 */
export const nebulaObj = sheet.object('nebula', {
	rotationSpeed: types.number(0.003, {
		range: [0, 0.02],
		nudgeMultiplier: 0.001,
	}),
	verticalDrift: types.number(0.02, { range: [0, 0.1], nudgeMultiplier: 0.01 }),
	opacity: types.number(0.3, { range: [0, 1], nudgeMultiplier: 0.01 }),
	scale: types.number(1, { range: [0.5, 2], nudgeMultiplier: 0.01 }),
});

/**
 * Star field object
 */
export const starFieldObj = sheet.object('starField', {
	rotationSpeed: types.number(0.05, { range: [0, 0.2], nudgeMultiplier: 0.01 }),
	verticalDrift: types.number(0.01, { range: [0, 0.1], nudgeMultiplier: 0.01 }),
	count: types.number(300, { range: [50, 1000], nudgeMultiplier: 10 }),
	factor: types.number(4, { range: [1, 10], nudgeMultiplier: 0.1 }),
});

/**
 * Peripheral particles object
 */
export const peripheralParticlesObj = sheet.object('peripheralParticles', {
	count: types.number(60, { range: [10, 200], nudgeMultiplier: 5 }),
	size: types.number(4, { range: [1, 10], nudgeMultiplier: 0.5 }),
	opacity: types.number(0.12, { range: [0, 1], nudgeMultiplier: 0.01 }),
	color: types.string('#7ec8d4', { label: 'Color' }),
	rotationSpeed: types.number(-0.008, {
		range: [-0.05, 0.05],
		nudgeMultiplier: 0.001,
	}),
	scale: types.number(1, { range: [0.5, 2], nudgeMultiplier: 0.01 }),
});

/**
 * Post-processing effects object
 */
export const postProcessingObj = sheet.object('postProcessing', {
	bloomIntensity: types.number(0.3, { range: [0, 1], nudgeMultiplier: 0.01 }),
	bloomThreshold: types.number(0.6, { range: [0, 1], nudgeMultiplier: 0.01 }),
	bloomSmoothing: types.number(0.4, { range: [0, 1], nudgeMultiplier: 0.01 }),
	bloomRadius: types.number(0.8, { range: [0, 2], nudgeMultiplier: 0.01 }),
	vignetteDarkness: types.number(0.4, { range: [0, 1], nudgeMultiplier: 0.01 }),
	vignetteOffset: types.number(0.5, { range: [0, 1], nudgeMultiplier: 0.01 }),
	noiseOpacity: types.number(0.08, { range: [0, 0.3], nudgeMultiplier: 0.01 }),
});

/**
 * Global scene object
 */
export const sceneObj = sheet.object('scene', {
	backgroundColor: types.rgba({ r: 0.02, g: 0.02, b: 0.05, a: 1 }),
	sphereBaseRadius: types.number(1.0, {
		range: [0.5, 2],
		nudgeMultiplier: 0.1,
	}),
});

// =============================================================================
// TYPE EXPORTS FOR OBJECT VALUES
// =============================================================================

export type {
	BreathCycleProps,
	CameraProps,
	CrystalCoreProps,
	InnerGlowProps,
	NebulaProps,
	OrbitingShellProps,
	OuterHaloProps,
	PeripheralParticlesProps,
	PostProcessingProps,
	SceneProps,
	StarFieldProps,
	UserParticlesProps,
};
