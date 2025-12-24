export {
	BASE_SPHERE_RADIUS,
	BREATH_DEPTH,
	COLOR_INDICES,
	FBO_SIZE,
	getPaletteUniform,
	hexToVec3,
	PALETTE,
	type PaletteColor,
	TOTAL_PARTICLES,
	type UserColor,
} from './constants';
export {
	GPUParticleSystem,
	type GPUParticleSystemConfig,
} from './GPUParticleSystem';
export {
	findScaffoldParticles,
	generateFibonacciSphere,
	getParticleUV,
	initializeParticleTextures,
	type ParticleData,
} from './particleUtils';
export { renderFragmentShader } from './render.frag';
export { renderVertexShader } from './render.vert';
export {
	simulationFragmentShader,
	simulationVertexShader,
} from './simulation.glsl';
