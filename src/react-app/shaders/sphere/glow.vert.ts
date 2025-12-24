/**
 * Glow Sphere Vertex Shader
 * Simple pass-through for outer glow mesh
 */
export const glowVertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
