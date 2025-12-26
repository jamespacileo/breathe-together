/**
 * Shaders barrel export
 * All GLSL shaders used in the particle visualization system
 */

// GPGPU simulation shaders
export { simulationFragmentShader } from './gpgpu/simulation.frag';
export { userSimFragmentShader } from './gpgpu/userSim.frag';

// Central sphere shaders
export { sphereFragmentShader } from './sphere/sphere.frag';
export { sphereVertexShader } from './sphere/sphere.vert';

// Sphere glow shaders
export { glowFragmentShader } from './sphere/glow.frag';
export { glowVertexShader } from './sphere/glow.vert';

// User particle shaders
export { userParticleFragmentShader, userParticleVertexShader } from './user';
