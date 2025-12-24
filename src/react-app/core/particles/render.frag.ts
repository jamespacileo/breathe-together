/**
 * Particle Render Fragment Shader
 * Soft glow circles with sparkle highlights
 */

export const renderFragmentShader = /* glsl */ `
precision highp float;

varying vec3 vColor;
varying float vAlpha;
varying float vSparkle;

void main() {
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);

  // Soft falloff
  float alpha = 1.0 - smoothstep(0.3, 0.5, dist);

  if (alpha < 0.01) discard;

  // Sparkle highlight at center
  float sparkle = 1.0 + 0.5 * smoothstep(0.1, 0.0, dist);

  vec3 color = vColor * sparkle;

  // Additional sparkle boost
  if (vSparkle > 0.3) {
    float sparkleCore = smoothstep(0.15, 0.0, dist) * vSparkle;
    color += vec3(1.0) * sparkleCore * 0.5;
  }

  gl_FragColor = vec4(color, alpha * vAlpha);
}
`;
