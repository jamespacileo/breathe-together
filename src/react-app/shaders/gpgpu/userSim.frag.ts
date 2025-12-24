/**
 * User Particles Simulation Fragment Shader
 * Handles breath-synchronized radius, orbital motion, and flutter effects
 *
 * Behavior:
 * - Inhale: particles settle close to sphere surface (radius ~8)
 * - Exhale: particles spread outward (radius ~18)
 * - Gentle flutter via curl noise
 * - Slow orbital rotation around Y-axis
 */
export const userSimFragmentShader = /* glsl */ `
precision highp float;

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
  // Comfortable orbital distance from sphere
  float settledRadius = uSphereRadius + 5.0;  // Clear separation from sphere glow
  float spreadRadius = 18.0;   // Expanded when exhaled
  float targetRadius = mix(spreadRadius, settledRadius, uBreathPhase);

  // Uniform radius on inhale, variable on exhale for spread effect
  float radiusVariation = 0.85 + particlePhase * 0.3;  // 0.85 to 1.15
  float variationAmount = 1.0 - uBreathPhase;  // 0 at inhale, 1 at exhale
  targetRadius *= mix(1.0, radiusVariation, variationAmount);

  // === ORBITAL MOTION ===
  // Visible Dyson swarm rotation - faster base for clear movement
  float baseOrbitSpeed = 0.18;

  // Phase-specific speed modulation - keep orbiting visible during inhale
  float orbitSpeedMult = 1.0;
  if (uPhaseType == 0) {
    orbitSpeedMult = 1.2; // Visible during inhale
  } else if (uPhaseType == 1) {
    orbitSpeedMult = 0.8; // Less slowdown on hold-in
  } else if (uPhaseType == 2) {
    orbitSpeedMult = 1.3; // Faster during exhale
  } else {
    orbitSpeedMult = 0.7; // Hold-out
  }

  // Crystallization reduces motion - keep orbiting visible during holds
  orbitSpeedMult *= (1.0 - uCrystallization * 0.4);

  // Update angle (refresh-rate independent via delta uniform)
  float orbitSpeed = baseOrbitSpeed * orbitSpeedMult;
  float newAngle = storedAngle + orbitSpeed * uDelta;

  // === FLUTTER EFFECT ===
  // Gentle organic motion via curl noise
  float flutterStrength = 0.4 * (1.0 - uCrystallization * 0.8);

  // More flutter when spread out, less when settled
  flutterStrength *= mix(1.0, 0.3, uBreathPhase);

  vec3 flutterOffset = curlNoise(origPos * 0.15 + uTime * 0.2) * flutterStrength;

  // === VERTICAL BOBBING ===
  float bobAmount = 0.3 * (1.0 - uCrystallization * 0.6);
  float verticalBob = sin(uTime * 0.5 + particlePhase * 6.28) * bobAmount;

  // Diaphragm drift
  float diaphragmInfluence = uDiaphragmDirection * 0.3 * (1.0 - uCrystallization);

  // === WIND TURBULENCE ===
  // Active during inhale (phaseType 0) and exhale (phaseType 2)
  float windActive = 0.0;
  if (uPhaseType == 0 || uPhaseType == 2) {
    windActive = 1.0;
  }

  // Turbulence intensity peaks mid-phase, fades at start/end
  float phaseProgress = uBreathPhase;
  if (uPhaseType == 2) {
    phaseProgress = 1.0 - uBreathPhase; // Reverse for exhale
  }
  float turbulenceEnvelope = sin(phaseProgress * 3.14159); // Peaks at 0.5

  // Directional wind based on breath direction
  vec3 windDirection = vec3(0.0, uDiaphragmDirection, 0.0);
  float windStrength = 0.3 * windActive * turbulenceEnvelope;

  // Add noise-based variation for natural feel
  vec3 windNoise = curlNoise(origPos * 0.3 + uTime * 0.5) * 0.2;
  vec3 windOffset = (windDirection + windNoise) * windStrength;

  // === CALCULATE NEW POSITION ===
  // Convert spherical to cartesian with orbital rotation applied
  float x = sin(phi) * cos(newAngle) * targetRadius;
  float y = cos(phi) * targetRadius + verticalBob + diaphragmInfluence;
  float z = sin(phi) * sin(newAngle) * targetRadius;

  vec3 targetPos = vec3(x, y, z) + flutterOffset + windOffset;

  // Smooth interpolation for organic feel
  float smoothing = 0.08;
  vec3 newPos = mix(pos, targetPos, smoothing);

  // Store position and orbital angle
  gl_FragColor = vec4(newPos, newAngle);
}
`;
