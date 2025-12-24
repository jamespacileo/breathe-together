/**
 * Peripheral Vision Particles Fragment Shader
 * Soft, diffuse particles for atmospheric effect
 */
export const peripheralFragmentShader = /* glsl */ `
uniform float uTime;
uniform float uBreathPhase;

varying float vAlpha;
varying float vPhase;

void main() {
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);

  // Soft, diffuse particles
  float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;

  if (alpha < 0.001) discard;

  // Very subtle color - almost gray with hint of the breathing color
  vec3 color = vec3(0.4, 0.5, 0.55);

  // Subtle pulse synchronized with breath
  float pulse = sin(uTime * 0.5 + vPhase * 6.28) * 0.1 + 0.9;
  alpha *= pulse;

  gl_FragColor = vec4(color, alpha);
}
`;
