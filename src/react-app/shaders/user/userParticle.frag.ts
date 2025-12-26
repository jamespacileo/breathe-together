/**
 * User Orbit Particle Fragment Shader
 * Creates soft glowing dot with subtle comet trail effect
 */
export const userParticleFragmentShader = /* glsl */ `
precision highp float;

// === SHADER CONSTANTS ===
// Comet trail
const float TRAIL_STRETCH_FACTOR = 3.0;    // How much velocity stretches particle
const float TRAIL_GLOW_INTENSITY = 0.4;    // Trail brightness
const float TRAIL_VELOCITY_MULT = 3.0;     // Velocity contribution to trail

// Core appearance
const float CORE_SCALE = 1.8;              // Core size multiplier
const float CORE_FALLOFF = 2.5;            // Gaussian falloff sharpness

// Outer glow
const float GLOW_SCALE = 1.2;              // Glow size relative to core
const float GLOW_FALLOFF = 1.5;            // Glow edge softness
const float GLOW_INTENSITY = 0.3;          // Glow brightness

// Depth fade
const float DEPTH_FADE_START = 25.0;       // Distance where fade begins
const float DEPTH_FADE_END = 50.0;         // Distance where fade maxes
const float DEPTH_FADE_AMOUNT = 0.3;       // Maximum fade reduction

// Twinkle
const vec3 TWINKLE_COLOR = vec3(0.15, 0.2, 0.25); // Twinkle highlight tint
const float TWINKLE_ALPHA_BOOST = 0.15;    // Alpha boost during twinkle

// Trail color
const vec3 TRAIL_COLOR_SHIFT = vec3(0.05, 0.08, 0.12); // Cool/light tail tint

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
  float trailStretch = 1.0 + vVelocity * TRAIL_STRETCH_FACTOR;
  vec2 stretchedCoord = center;
  stretchedCoord.x *= trailStretch;
  float trailDist = length(stretchedCoord) * 2.0;

  // Soft Gaussian falloff for core
  float coreDist = dist * CORE_SCALE;
  float alpha = exp(-coreDist * coreDist * CORE_FALLOFF);

  // Trail glow - elongated soft tail
  float trailGlow = exp(-trailDist * trailDist * GLOW_FALLOFF) * TRAIL_GLOW_INTENSITY * vVelocity * TRAIL_VELOCITY_MULT;
  alpha = max(alpha, trailGlow);

  // Add subtle outer glow
  float glowDist = dist * GLOW_SCALE;
  float glow = exp(-glowDist * glowDist * GLOW_FALLOFF) * GLOW_INTENSITY;
  alpha = max(alpha, glow);

  // Discard pixels outside the particle (with trail consideration)
  if (dist > 1.0 && trailDist > 1.2) discard;

  // Base color with distance fade
  vec3 color = vColor;

  // Depth-based fade (particles further away are slightly more transparent)
  float depthFade = 1.0 - smoothstep(DEPTH_FADE_START, DEPTH_FADE_END, vDistance) * DEPTH_FADE_AMOUNT;

  // Twinkle brightening
  color += TWINKLE_COLOR * vTwinkle;

  // Soft center brightening
  float centerGlow = 1.0 - dist * GLOW_INTENSITY;
  color *= centerGlow;

  // Trail color - slightly cooler/lighter in the tail
  vec3 trailColor = color + TRAIL_COLOR_SHIFT * vVelocity * 2.0;
  color = mix(color, trailColor, smoothstep(0.0, 0.5, trailDist));

  // Final alpha with depth fade - vivid visibility
  float finalAlpha = alpha * 0.9 * depthFade;

  // Slightly boost alpha during twinkle
  finalAlpha += vTwinkle * TWINKLE_ALPHA_BOOST;

  gl_FragColor = vec4(color, finalAlpha);
}
`;
