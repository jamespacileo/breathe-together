/**
 * Theatre.js Type Definitions
 *
 * TypeScript interfaces for Theatre.js animation objects
 */

/**
 * Master breath cycle values - keyframed in Theatre.js timeline
 * Replaces the computed values from useGlobalUniforms
 */
export interface BreathCycleProps {
	/** 0-1: contracted (inhale) to expanded (exhale) */
	breathPhase: number;
	/** 0-3: inhale, hold-in, exhale, hold-out */
	phaseType: number;
	/** 0-1: progress within current phase */
	rawProgress: number;
	/** 0-1: progress with easing applied */
	easedProgress: number;
	/** 0-1: peaks at phase end (preparing for transition) */
	anticipation: number;
	/** 0-1: peaks at phase start (settling after transition) */
	overshoot: number;
	/** -1/0/1: down (exhale), hold, up (inhale) */
	diaphragmDirection: number;
	/** -1 to 1: cool to warm color shift */
	colorTemperature: number;
	/** 0-1: stillness intensity during hold phases */
	crystallization: number;
	/** 0-1: transient wave at phase transitions */
	breathWave: number;
	/** 0-1: smooth blend at phase boundaries */
	phaseTransitionBlend: number;
}

/**
 * Glass orb layer props (refractive core)
 */
export interface GlassOrbProps {
	scale: number;
	transmission: number;
	thickness: number;
	roughness: number;
	chromaticAberration: number;
	distortion: number;
	distortionScale: number;
	temporalDistortion: number;
}

/**
 * Orb glow layer props (custom shader)
 */
export interface OrbGlowProps {
	scale: number;
	glowIntensity: number;
	pulseAmount: number;
	fresnelPower: number;
	coreGlowPower: number;
	edgeHighlightPower: number;
	colorR: number;
	colorG: number;
	colorB: number;
}

/**
 * Orbital particles layer props
 */
export interface OrbitalParticlesProps {
	minRadiusScale: number;
	maxRadiusScale: number;
	orbitSpeed: number;
	particleSize: number;
	opacity: number;
	pulseAmount: number;
	colorR: number;
	colorG: number;
	colorB: number;
}

/**
 * Atmospheric halo layer props
 */
export interface AtmosphericHaloProps {
	minScale: number;
	maxScale: number;
	opacity: number;
	pulseAmount: number;
	falloff: number;
	colorR: number;
	colorG: number;
	colorB: number;
}

/**
 * User presence swarm props
 */
export interface UserPresenceProps {
	settledRadiusMult: number;
	spreadRadiusMult: number;
	orbitSpeed: number;
	bobAmount: number;
	positionSmoothing: number;
	baseSize: number;
	sizeVariation: number;
	opacity: number;
	crystalOrbitReduction: number;
}

/**
 * Nebula background props
 */
export interface NebulaProps {
	rotationSpeed: number;
	verticalDrift: number;
	opacity: number;
	scale: number;
}

/**
 * Star field props
 */
export interface StarFieldProps {
	rotationSpeed: number;
	verticalDrift: number;
	count: number;
	factor: number;
}

/**
 * Peripheral particles props
 */
export interface PeripheralParticlesProps {
	count: number;
	size: number;
	opacity: number;
	color: string;
	rotationSpeed: number;
	scale: number;
}

/**
 * Post-processing effects props
 */
export interface PostProcessingProps {
	bloomIntensity: number;
	bloomThreshold: number;
	bloomSmoothing: number;
	bloomRadius: number;
	vignetteDarkness: number;
	vignetteOffset: number;
	noiseOpacity: number;
}

/**
 * Camera props
 */
export interface CameraProps {
	positionX: number;
	positionY: number;
	positionZ: number;
	fov: number;
}

/**
 * RGBA color type (from Theatre.js types.rgba())
 */
export interface RgbaColor {
	r: number;
	g: number;
	b: number;
	a: number;
}

/**
 * Global scene props
 */
export interface SceneProps {
	backgroundColor: RgbaColor;
	sphereBaseRadius: number;
}

/**
 * Debug visualization controls
 */
export interface DebugProps {
	enabled: boolean;
	showAxes: boolean;
	showOrbitRings: boolean;
	showLayerPlanes: boolean;
	ringOpacity: number;
	settledRingColor: string;
	spreadRingColor: string;
}

/**
 * Combined Theatre.js props for the entire scene
 */
export interface TheatreProps {
	breathCycle: BreathCycleProps;
	glassOrb: GlassOrbProps;
	orbGlow: OrbGlowProps;
	orbitalParticles: OrbitalParticlesProps;
	atmosphericHalo: AtmosphericHaloProps;
	userPresence: UserPresenceProps;
	nebula: NebulaProps;
	starField: StarFieldProps;
	peripheralParticles: PeripheralParticlesProps;
	postProcessing: PostProcessingProps;
	scene: SceneProps;
	debug: DebugProps;
}
