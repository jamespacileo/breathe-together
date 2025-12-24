/**
 * User Orbit Particle Fragment Shader
 * Creates soft glowing dot with subtle comet trail effect
 */
export const userParticleFragmentShader = /* glsl */ `
precision highp float;

varying vec3 vColor;
varying float vDistance;
varying float vTwinkle;
varying float vPhaseType;
varying float vVelocity;

void main() {
  // Distance from center of point sprite
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center) * 2.0;

  // === COMET TRAIL EFFECT ===
  // Stretch particle based on velocity to create subtle trail
  float trailStretch = 1.0 + vVelocity * 3.0;
  vec2 stretchedCoord = center;
  stretchedCoord.x *= trailStretch;
  float trailDist = length(stretchedCoord) * 2.0;

  // Soft Gaussian falloff for core
  float coreDist = dist * 1.8;
  float alpha = exp(-coreDist * coreDist * 2.5);

  // Trail glow - elongated soft tail
  float trailGlow = exp(-trailDist * trailDist * 1.5) * 0.4 * vVelocity * 3.0;
  alpha = max(alpha, trailGlow);

  // Add subtle outer glow
  float glowDist = dist * 1.2;
  float glow = exp(-glowDist * glowDist * 1.5) * 0.3;
  alpha = max(alpha, glow);

  // Discard pixels outside the particle (with trail consideration)
  if (dist > 1.0 && trailDist > 1.2) discard;

  // Base color with distance fade
  vec3 color = vColor;

  // Depth-based fade (particles further away are slightly more transparent)
  float depthFade = 1.0 - smoothstep(25.0, 50.0, vDistance) * 0.3;

  // Twinkle brightening
  color += vec3(0.15, 0.2, 0.25) * vTwinkle;

  // Soft center brightening
  float centerGlow = 1.0 - dist * 0.3;
  color *= centerGlow;

  // Trail color - slightly cooler/lighter in the tail
  vec3 trailColor = color + vec3(0.05, 0.08, 0.12) * vVelocity * 2.0;
  color = mix(color, trailColor, smoothstep(0.0, 0.5, trailDist));

  // Final alpha with depth fade - vivid visibility
  float finalAlpha = alpha * 0.9 * depthFade;

  // Slightly boost alpha during twinkle
  finalAlpha += vTwinkle * 0.15;

  gl_FragColor = vec4(color, finalAlpha);
}
`;
