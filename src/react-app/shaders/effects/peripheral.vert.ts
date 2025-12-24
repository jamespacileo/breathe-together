/**
 * Peripheral Vision Particles Vertex Shader
 * Subtle particles at edges of vision - felt more than seen
 */
export const peripheralVertexShader = /* glsl */ `
uniform float uTime;
uniform float uBreathPhase;
uniform float uDiaphragmDirection;
uniform float uCrystallization;
uniform vec2 uViewOffset;

attribute float aPhase;
attribute float aSize;

varying float vAlpha;
varying float vPhase;

void main() {
  vec3 pos = position;

  // Radial breathing motion - inward during inhale, outward during exhale
  float radialOffset = (uBreathPhase - 0.5) * 2.0; // -1 to 1
  float dist = length(pos.xy);
  vec2 dir = dist > 0.001 ? normalize(pos.xy) : vec2(0.0, 1.0);

  // Drift toward/away from center based on breath
  pos.xy -= dir * radialOffset * 1.5;

  // Vertical drift for diaphragmatic cue (very subtle)
  pos.y += uDiaphragmDirection * 0.3 * (1.0 - uCrystallization);

  // Micro-saccade response (view offset)
  pos.x += uViewOffset.x * 15.0;
  pos.y += uViewOffset.y * 15.0;

  // Gentle orbital drift (slower during holds)
  float orbitSpeed = 0.05 * (1.0 - uCrystallization * 0.7);
  float angle = uTime * orbitSpeed + aPhase * 6.28;
  float cosA = cos(angle);
  float sinA = sin(angle);
  vec3 rotatedPos = vec3(
    pos.x * cosA - pos.z * sinA,
    pos.y,
    pos.x * sinA + pos.z * cosA
  );

  vec4 mvPosition = modelViewMatrix * vec4(rotatedPos, 1.0);

  // Size based on distance (larger when further = more peripheral)
  float depthSize = 1.0 + (-mvPosition.z - 30.0) * 0.02;
  gl_PointSize = aSize * depthSize * 2.0;

  // Very low alpha - these should be felt, not seen
  // Even lower during holds (crystallization)
  vAlpha = 0.08 * (1.0 - uCrystallization * 0.5);
  vPhase = aPhase;

  gl_Position = projectionMatrix * mvPosition;
}
`;
