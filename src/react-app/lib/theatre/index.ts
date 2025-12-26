/**
 * Theatre.js Module Exports
 *
 * Central export point for all Theatre.js configuration and objects.
 */

// Project and sheet
export {
	// Objects
	atmosphericHaloObj,
	breathCycleObj,
	cameraObj,
	debugObj,
	glassOrbObj,
	nebulaObj,
	orbGlowObj,
	orbitalParticlesObj,
	peripheralParticlesObj,
	postProcessingObj,
	project,
	sceneObj,
	sequence,
	sheet,
	starFieldObj,
	userPresenceObj,
} from './project';
// Studio initialization
export { getStudio, initializeStudio } from './studioInit';
// Subscription helpers
export {
	useTheatreColor,
	useTheatreObject,
	useTheatreRef,
} from './subscriptionHelpers';
export type {
	UseTheatreObjectOptions,
	UseTheatreObjectResult,
} from './subscriptionHelpers';
// Types
export type {
	AtmosphericHaloProps,
	BreathCycleProps,
	CameraProps,
	DebugProps,
	GlassOrbProps,
	NebulaProps,
	OrbGlowProps,
	OrbitalParticlesProps,
	PeripheralParticlesProps,
	PostProcessingProps,
	SceneProps,
	StarFieldProps,
	UserPresenceProps,
} from './types';
