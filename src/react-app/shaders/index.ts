/**
 * Shaders barrel export
 * All GLSL shaders used in the particle visualization system
 */

// GPGPU simulation shader (vertex shader provided by GPUComputationRenderer)
export { simulationFragmentShader } from './gpgpu/simulation.frag';
// User particle shaders
export { userSimFragmentShader } from './gpgpu/userSim.frag';
export { particleFragmentShader } from './particles/particle.frag';
// Main particle shaders
export { particleVertexShader } from './particles/particle.vert';
export { glowFragmentShader } from './sphere/glow.frag';

// Sphere glow shaders
export { glowVertexShader } from './sphere/glow.vert';
export { sphereFragmentShader } from './sphere/sphere.frag';
// Central sphere shaders
export { sphereVertexShader } from './sphere/sphere.vert';
export { userParticleFragmentShader, userParticleVertexShader } from './user';
