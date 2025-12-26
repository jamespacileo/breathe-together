/**
 * Theatre.js Module Exports
 *
 * Central export point for all Theatre.js configuration and objects.
 */

// Project and sheet
export {
	// Objects
	breathCycleObj,
	cameraObj,
	crystalCoreObj,
	debugObj,
	innerGlowObj,
	nebulaObj,
	orbitingShellObj,
	outerHaloObj,
	peripheralParticlesObj,
	postProcessingObj,
	project,
	sceneObj,
	sequence,
	sheet,
	starFieldObj,
	userParticlesObj,
} from './project';
// Studio initialization
export { getStudio, initializeStudio } from './studioInit';
// Types
export type {
	BreathCycleProps,
	CameraProps,
	CrystalCoreProps,
	DebugProps,
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
