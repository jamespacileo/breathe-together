/**
 * Shaders barrel export
 * All GLSL shaders used in the particle visualization system
 */

export { peripheralFragmentShader } from './effects/peripheral.frag';
// Effect shaders
export { peripheralVertexShader } from './effects/peripheral.vert';
export { starFragmentShader } from './effects/starfield.frag';
export { starVertexShader } from './effects/starfield.vert';
export { simulationFragmentShader } from './gpgpu/simulation.frag';
// GPGPU simulation shaders
export { simulationVertexShader } from './gpgpu/simulation.vert';
export { particleFragmentShader } from './particles/particle.frag';
// Main particle shaders
export { particleVertexShader } from './particles/particle.vert';
export { sphereFragmentShader } from './sphere/sphere.frag';
// Central sphere shaders
export { sphereVertexShader } from './sphere/sphere.vert';
