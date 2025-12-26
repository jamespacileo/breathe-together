/**
 * User Particles Simulation Fragment Shader
 * Handles breath-synchronized radius, orbital motion, and flutter effects
 *
 * Behavior:
 * - Inhale: particles settle close to sphere surface (1.5x sphere radius)
 * - Exhale: particles spread outward (4x sphere radius)
 * - Gentle flutter via curl noise
 * - Slow orbital rotation around Y-axis
 */
export const userSimFragmentShader = /* glsl */ `
precision highp float;

// === SHADER CONSTANTS ===
// Breathing radius - multipliers relative to uSphereRadius
const float SETTLED_RADIUS_MULTIPLIER = 1.5;  // Orbit at 1.5x sphere radius when settled
const float SPREAD_RADIUS_MULTIPLIER = 4.0;   // Spread to 4x sphere radius when exhaled
const float RADIUS_VARIATION_MIN = 0.85;      // Min variation factor
const float RADIUS_VARIATION_RANGE = 0.3;     // Range for variation (0.85-1.15)

// Orbital motion
const float BASE_ORBIT_SPEED = 0.18;      // Base orbital rotation speed
const float INHALE_ORBIT_MULT = 1.2;      // Speed multiplier during inhale
const float HOLD_IN_ORBIT_MULT = 0.8;     // Speed multiplier during hold-in
const float EXHALE_ORBIT_MULT = 1.3;      // Speed multiplier during exhale
const float HOLD_OUT_ORBIT_MULT = 0.7;    // Speed multiplier during hold-out
const float CRYSTAL_ORBIT_REDUCTION = 0.4; // Max orbit reduction at full crystallization

// Flutter effect
const float FLUTTER_STRENGTH = 0.4;       // Base flutter intensity
const float FLUTTER_CRYSTAL_REDUCTION = 0.8; // Flutter reduction at crystallization
const float FLUTTER_BREATH_REDUCTION = 0.3;  // Flutter reduction when settled (inhale)
const float FLUTTER_NOISE_SCALE = 0.15;   // Curl noise frequency
const float FLUTTER_TIME_SCALE = 0.2;     // Curl noise time evolution

// Vertical motion
const float BOB_AMOUNT = 0.3;             // Vertical bobbing amplitude
const float BOB_SPEED = 0.5;              // Bobbing frequency
const float DIAPHRAGM_INFLUENCE = 0.3;    // Breath direction drift amount

// Wind turbulence
const float WIND_STRENGTH = 0.3;          // Wind intensity
const float WIND_NOISE_SCALE = 0.3;       // Wind noise frequency
const float WIND_NOISE_SPEED = 0.5;       // Wind noise time evolution
const float WIND_NOISE_AMOUNT = 0.2;      // Additional noise variation

// Position interpolation
const float POSITION_SMOOTHING = 0.08;    // Lerp factor for smooth motion

// Note: texturePosition is automatically added by GPUComputationRenderer
uniform sampler2D uOriginalPositions;
uniform float uTime;
uniform float uDelta;            // Frame delta for refresh-rate independence
uniform float uBreathPhase;      // 0 = exhaled (spread), 1 = inhaled (settled)
uniform int uPhaseType;          // 0=inhale, 1=hold-in, 2=exhale, 3=hold-out
uniform float uCrystallization;  // 0-1, stillness during holds
uniform float uDiaphragmDirection; // -1 down (inhale), 1 up (exhale), 0 hold
uniform float uSphereRadius;       // Sphere glow radius for Dyson swarm positioning

// Simple hash for noise
float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

// 3D noise
float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
        mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
        mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
    f.z
  );
}

// Curl noise for organic flutter motion
vec3 curlNoise(vec3 p) {
  float e = 0.1;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);

  vec3 curl;
  curl.x = (noise(p + dy) - noise(p - dy)) - (noise(p + dz) - noise(p - dz));
  curl.y = (noise(p + dz) - noise(p - dz)) - (noise(p + dx) - noise(p - dx));
  curl.z = (noise(p + dx) - noise(p - dx)) - (noise(p + dy) - noise(p - dy));

  return normalize(curl + 0.001) * 0.5;
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;

  vec4 posData = texture2D(texturePosition, uv);
  vec4 origData = texture2D(uOriginalPositions, uv);

  vec3 pos = posData.xyz;
  float storedAngle = posData.w; // Current orbital angle

  // Original data: xyz = initial spherical position, w = random phase
  vec3 origPos = origData.xyz;
  float particlePhase = origData.w;

  // Calculate spherical coordinates from original position
  float origRadius = length(origPos);
  float theta = atan(origPos.z, origPos.x); // Horizontal angle
  float phi = acos(clamp(origPos.y / max(origRadius, 0.001), -1.0, 1.0)); // Vertical angle

  // === BREATHING RADIUS ===
  // Settle close on inhale (breathPhase = 1), spread on exhale (breathPhase = 0)
  // Both radii are relative to the sphere's current scale
  float settledRadius = uSphereRadius * SETTLED_RADIUS_MULTIPLIER;
  float spreadRadius = uSphereRadius * SPREAD_RADIUS_MULTIPLIER;
  float targetRadius = mix(spreadRadius, settledRadius, uBreathPhase);

  // Uniform radius on inhale, variable on exhale for spread effect
  float radiusVariation = RADIUS_VARIATION_MIN + particlePhase * RADIUS_VARIATION_RANGE;
  float variationAmount = 1.0 - uBreathPhase;  // 0 at inhale, 1 at exhale
  targetRadius *= mix(1.0, radiusVariation, variationAmount);

  // === ORBITAL MOTION ===
  // Phase-specific speed modulation - keep orbiting visible during inhale
  float orbitSpeedMult = 1.0;
  if (uPhaseType == 0) {
    orbitSpeedMult = INHALE_ORBIT_MULT;
  } else if (uPhaseType == 1) {
    orbitSpeedMult = HOLD_IN_ORBIT_MULT;
  } else if (uPhaseType == 2) {
    orbitSpeedMult = EXHALE_ORBIT_MULT;
  } else {
    orbitSpeedMult = HOLD_OUT_ORBIT_MULT;
  }

  // Crystallization reduces motion - keep orbiting visible during holds
  orbitSpeedMult *= (1.0 - uCrystallization * CRYSTAL_ORBIT_REDUCTION);

  // Update angle (refresh-rate independent via delta uniform)
  float orbitSpeed = BASE_ORBIT_SPEED * orbitSpeedMult;
  float newAngle = mod(storedAngle + orbitSpeed * uDelta, 6.28318530718);

  // === FLUTTER EFFECT ===
  // Gentle organic motion via curl noise
  float flutterStrength = FLUTTER_STRENGTH * (1.0 - uCrystallization * FLUTTER_CRYSTAL_REDUCTION);

  // More flutter when spread out, less when settled
  flutterStrength *= mix(1.0, FLUTTER_BREATH_REDUCTION, uBreathPhase);

  vec3 flutterOffset = curlNoise(origPos * FLUTTER_NOISE_SCALE + uTime * FLUTTER_TIME_SCALE) * flutterStrength;

  // === VERTICAL BOBBING ===
  float bobAmount = BOB_AMOUNT * (1.0 - uCrystallization * 0.6);
  float verticalBob = sin(uTime * BOB_SPEED + particlePhase * 6.28) * bobAmount;

  // Diaphragm drift
  float diaphragmInfluence = uDiaphragmDirection * DIAPHRAGM_INFLUENCE * (1.0 - uCrystallization);

  // === WIND TURBULENCE ===
  // Active during inhale (phaseType 0) and exhale (phaseType 2)
  float windActive = (uPhaseType == 0 || uPhaseType == 2) ? 1.0 : 0.0;

  // Turbulence intensity peaks mid-phase, fades at start/end
  float phaseProgress = uBreathPhase;
  if (uPhaseType == 2) {
    phaseProgress = 1.0 - uBreathPhase; // Reverse for exhale
  }
  float turbulenceEnvelope = sin(phaseProgress * 3.14159); // Peaks at 0.5

  // Directional wind based on breath direction
  vec3 windDirection = vec3(0.0, uDiaphragmDirection, 0.0);
  float windStrength = WIND_STRENGTH * windActive * turbulenceEnvelope;

  // Add noise-based variation for natural feel
  vec3 windNoise = curlNoise(origPos * WIND_NOISE_SCALE + uTime * WIND_NOISE_SPEED) * WIND_NOISE_AMOUNT;
  vec3 windOffset = (windDirection + windNoise) * windStrength;

  // === CALCULATE NEW POSITION ===
  // Convert spherical to cartesian with orbital rotation applied
  float x = sin(phi) * cos(newAngle) * targetRadius;
  float y = cos(phi) * targetRadius + verticalBob + diaphragmInfluence;
  float z = sin(phi) * sin(newAngle) * targetRadius;

  vec3 targetPos = vec3(x, y, z) + flutterOffset + windOffset;

  // Smooth interpolation for organic feel (refresh-rate independent)
  float smoothing = 1.0 - pow(1.0 - POSITION_SMOOTHING, uDelta * 60.0);
  vec3 newPos = mix(pos, targetPos, smoothing);

  // Store position and orbital angle
  gl_FragColor = vec4(newPos, newAngle);
}
`;
