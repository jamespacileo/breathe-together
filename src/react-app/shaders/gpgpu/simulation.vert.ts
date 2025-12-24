/**
 * GPGPU Simulation Vertex Shader
 * Simple pass-through for full-screen quad
 */
export const simulationVertexShader = /* glsl */ `
void main() {
  gl_Position = vec4(position, 1.0);
}
`;
