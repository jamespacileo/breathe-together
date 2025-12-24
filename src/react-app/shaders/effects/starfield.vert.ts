/**
 * Starfield Vertex Shader
 * Distant twinkling stars for depth and ambiance
 */
export const starVertexShader = /* glsl */ `
uniform float uTime;
uniform float uBreathPhase;

attribute float aSize;
attribute float aPhase;
attribute float aBrightness;

varying float vBrightness;
varying float vPhase;

void main() {
  vBrightness = aBrightness;
  vPhase = aPhase;

  vec3 pos = position;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // Very subtle twinkle
  float twinkle = 0.8 + sin(uTime * 2.0 + aPhase * 10.0) * 0.2;

  gl_PointSize = aSize * twinkle * (200.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`;
