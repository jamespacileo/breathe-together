/**
 * User Orbit Particle Vertex Shader
 * Handles particle sizing, twinkle effects, and color for orbiting user particles
 */
export const userParticleVertexShader = /* glsl */ `
precision highp float;

// === SHADER CONSTANTS ===
// Velocity estimation
const float ORBITAL_VELOCITY_SCALE = 0.0012;  // Orbital contribution factor
const float ACTIVE_PHASE_VELOCITY = 0.15;     // Velocity during inhale/exhale
const float HOLD_PHASE_VELOCITY = 0.05;       // Velocity during holds

// Size attenuation
const float DISTANCE_ATTENUATION_FACTOR = 150.0;
const float BASE_SIZE_MULT = 0.8;
const float COUNT_SCALE_MIN_USERS = 2.0;      // User count for max scale
const float COUNT_SCALE_MAX_USERS = 200.0;    // User count for normal scale

// Phase size modulation
const float INHALE_SIZE_MIN = 0.9;
const float INHALE_SIZE_RANGE = 0.1;
const float HOLD_IN_PULSE_SPEED = 2.0;
const float HOLD_IN_PULSE_AMOUNT = 0.05;
const float EXHALE_SIZE_BASE = 1.1;
const float EXHALE_SIZE_RANGE = 0.15;
const float HOLD_OUT_PULSE_SPEED = 1.5;
const float HOLD_OUT_PULSE_AMOUNT = 0.04;
const float HOLD_OUT_SIZE_BASE = 1.05;

// Twinkle
const float TWINKLE_SPEED = 2.5;
const float TWINKLE_PHASE_SPREAD = 50.0;
const float TWINKLE_SHARPNESS = 12.0;
const float TWINKLE_SIZE_BOOST = 0.3;
const float TWINKLE_CRYSTAL_REDUCTION = 0.7;

// Color temperature
const float COLOR_SATURATION = 0.95;
const vec3 COOL_SHIFT = vec3(-0.02, 0.02, 0.05);  // Cyan tint
const vec3 WARM_SHIFT = vec3(0.03, 0.0, 0.02);    // Rose tint
const float INHALE_TEMP = -0.5;
const float EXHALE_TEMP = 0.3;

uniform sampler2D uPositions;
uniform float uTime;
uniform float uBreathPhase;
uniform float uPixelRatio;
uniform int uPhaseType;
uniform float uCrystallization;
uniform float uUserCount;  // Total users for dynamic sizing

attribute vec2 aReference;
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;

varying vec3 vColor;
varying float vDistance;
varying float vTwinkle;
varying float vPhaseType;
varying float vVelocity;

void main() {
  vec4 posData = texture2D(uPositions, aReference);
  vec3 pos = posData.xyz;

  // Estimate velocity for trail effect based on orbital motion and breathing phase
  float orbitalVelocity = ORBITAL_VELOCITY_SCALE * length(pos.xz);
  float breathingVelocity = (uPhaseType == 0 || uPhaseType == 2) ? ACTIVE_PHASE_VELOCITY : HOLD_PHASE_VELOCITY;
  vVelocity = orbitalVelocity + breathingVelocity;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vDistance = -mvPosition.z;

  // Depth-based size attenuation
  float distanceAttenuation = DISTANCE_ATTENUATION_FACTOR / max(vDistance, 1.0);

  // Dynamic size based on user count: fewer users = bigger particles
  float countScale = 1.0 + 1.0 * (1.0 - smoothstep(COUNT_SCALE_MIN_USERS, COUNT_SCALE_MAX_USERS, uUserCount));

  // Base size for user particles with count scaling
  float baseSize = aSize * BASE_SIZE_MULT * distanceAttenuation * countScale;

  // Phase-specific size modulation
  float sizePhase = 1.0;
  if (uPhaseType == 0) {
    // Inhale: slightly smaller, contracting feel
    sizePhase = INHALE_SIZE_MIN + uBreathPhase * INHALE_SIZE_RANGE;
  } else if (uPhaseType == 1) {
    // Hold-in: stable with gentle pulse
    float pulse = sin(uTime * HOLD_IN_PULSE_SPEED + aPhase * 6.28) * HOLD_IN_PULSE_AMOUNT;
    sizePhase = 1.0 + pulse * (1.0 - uCrystallization * 0.8);
  } else if (uPhaseType == 2) {
    // Exhale: expanding
    sizePhase = EXHALE_SIZE_BASE - uBreathPhase * EXHALE_SIZE_RANGE;
  } else {
    // Hold-out: soft floating pulse
    float pulse = sin(uTime * HOLD_OUT_PULSE_SPEED + aPhase * 6.28) * HOLD_OUT_PULSE_AMOUNT;
    sizePhase = HOLD_OUT_SIZE_BASE + pulse * (1.0 - uCrystallization * 0.8);
  }
  baseSize *= sizePhase;

  // Gentle twinkle effect
  float twinklePhase = uTime * TWINKLE_SPEED + aPhase * TWINKLE_PHASE_SPREAD;
  float twinkle1 = pow(max(0.0, sin(twinklePhase)), TWINKLE_SHARPNESS);
  float twinkle2 = pow(max(0.0, sin(twinklePhase * 1.3 + 1.5)), TWINKLE_SHARPNESS);
  float twinkle = max(twinkle1, twinkle2);

  // Reduce twinkle during crystallization for stillness
  twinkle *= (1.0 - uCrystallization * TWINKLE_CRYSTAL_REDUCTION);
  vTwinkle = twinkle;

  // Apply twinkle to size
  baseSize *= (1.0 + twinkle * TWINKLE_SIZE_BOOST);

  gl_PointSize = baseSize * uPixelRatio;
  gl_Position = projectionMatrix * mvPosition;

  // Color with subtle phase-based temperature shift
  vec3 color = aColor;

  // Keep colors vivid with minimal desaturation
  vec3 gray = vec3(dot(color, vec3(0.299, 0.587, 0.114)));
  color = mix(gray, color, COLOR_SATURATION);

  // Phase-based color temperature
  float temperature = 0.0;
  if (uPhaseType == 0) {
    temperature = INHALE_TEMP;
  } else if (uPhaseType == 2) {
    temperature = EXHALE_TEMP;
  }

  vec3 tempShift = mix(COOL_SHIFT, WARM_SHIFT, temperature * 0.5 + 0.5);
  color += tempShift * 0.5;

  vColor = clamp(color, 0.0, 1.0);
  vPhaseType = float(uPhaseType);
}
`;
