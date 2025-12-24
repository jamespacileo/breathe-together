/**
 * Particle Fragment Shader
 * Soft glow circles with sparkle highlights
 */

export const renderFragmentShader = /* glsl */ `
precision highp float;

varying vec3 vColor;
varying float vAlpha;
varying float vSparkle;
varying float vDepth;

void main() {
  // Distance from center of point
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);

  // Soft falloff for glow effect
  float alpha = 1.0 - smoothstep(0.3, 0.5, dist);

  if (alpha < 0.01) discard;

  // Sparkle highlight at center
  float sparkle = 1.0 + 0.5 * smoothstep(0.1, 0.0, dist);

  // Apply sparkle from spawn effect
  sparkle += vSparkle * 2.0 * smoothstep(0.2, 0.0, dist);

  vec3 color = vColor * sparkle;

  // Slight rim highlight
  float rim = smoothstep(0.35, 0.4, dist) * smoothstep(0.5, 0.4, dist);
  color += vColor * rim * 0.3;

  // Depth-based fade
  float depthFade = 1.0 - smoothstep(2.0, 8.0, vDepth);
  alpha *= depthFade;

  gl_FragColor = vec4(color, alpha * vAlpha);
}
`;
