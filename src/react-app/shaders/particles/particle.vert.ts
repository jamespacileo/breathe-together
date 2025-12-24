/**
 * Main Particle Vertex Shader
 * Handles particle sizing, sparkle effects, and color temperature
 */
export const particleVertexShader = /* glsl */ `
precision highp float;

uniform sampler2D uPositions;
uniform float uTime;
uniform float uBreathPhase;
uniform float uPixelRatio;
uniform int uPhaseType; // 0=inhale, 1=hold-in, 2=exhale, 3=hold-out

// === NEW SUBTLE EFFECT UNIFORMS ===
uniform float uColorTemperature;  // -1 cool to 1 warm
uniform float uCrystallization;   // Hold stillness factor
uniform float uBreathWave;        // Radial wave intensity
uniform float uBirthProgress;     // Global entry animation (0-1)

// === WORD FORMATION UNIFORMS ===
uniform sampler2D uWordFormationData; // Per-particle word data
uniform float uWordFormationActive;   // 0-1 whether word formation is active

attribute vec2 aReference;
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;
attribute float aBirthDelay;      // Per-particle birth stagger

varying vec3 vColor;
varying vec3 vPosition;
varying float vDistance;
varying float vPhase;
varying float vBreathPhase;
varying float vSparkle;
varying float vVelocity;
varying float vDepthFactor;
varying float vPhaseType;
varying float vBirthAlpha;
varying float vWordBlend; // 0-1 how much this particle is forming a word

void main() {
  vec4 posData = texture2D(uPositions, aReference);
  vec3 pos = posData.xyz;
  float velocity = posData.w;

  vPosition = pos;
  vPhase = aPhase;
  vBreathPhase = uBreathPhase;
  vVelocity = velocity;
  vPhaseType = float(uPhaseType);

  // === WORD FORMATION BLEND ===
  // Check if this particle is forming a word
  vWordBlend = 0.0;
  if (uWordFormationActive > 0.01) {
    vec4 wordData = texture2D(uWordFormationData, aReference);
    float letterIndex = wordData.w;
    // letterIndex >= 0 means this particle is part of the word
    if (letterIndex >= 0.0) {
      // Calculate blend based on how close particle is to word position
      vec3 wordPos = wordData.xyz;
      float distToWord = length(pos - wordPos);
      // Particles closer to word position have higher blend
      vWordBlend = 1.0 - smoothstep(0.0, 3.0, distToWord);
      vWordBlend = max(vWordBlend, 0.3); // Minimum blend when selected
    }
  }

  // === ENTRY BIRTH ANIMATION ===
  // Particles emerge from center during first few seconds
  // Staggered by aBirthDelay for wave-like appearance
  float birthTime = uBirthProgress - aBirthDelay * 0.5;
  float birthAlpha = smoothstep(0.0, 0.3, birthTime);
  vBirthAlpha = birthAlpha;

  // During birth, particles emerge from center
  if (birthAlpha < 1.0) {
    float emergeFactor = birthAlpha;
    // Slight inward pull for particles still being born
    pos = mix(pos * 0.3, pos, emergeFactor);
  }

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vDistance = -mvPosition.z;

  // === DEPTH-BASED SIZE VARIATION ===
  float depthFromCamera = vDistance;
  float minDepth = 30.0;
  float maxDepth = 70.0;
  vDepthFactor = 1.0 - smoothstep(minDepth, maxDepth, depthFromCamera);

  float distanceAttenuation = 180.0 / max(vDistance, 1.0);
  float depthSizeMultiplier = 0.6 + vDepthFactor * 0.5;
  float baseSize = aSize * 0.4 * distanceAttenuation * depthSizeMultiplier;

  // === PHASE-SPECIFIC SIZE PULSING ===
  float sizePulse = 1.0;
  if (uPhaseType == 0) {
    sizePulse = 1.0 - uBreathPhase * 0.1;
  } else if (uPhaseType == 1) {
    // During hold, pulsing is reduced by crystallization
    float pulseAmount = 0.06 * (1.0 - uCrystallization * 0.7);
    sizePulse = 1.0 + sin(uTime * 2.5 + aPhase * 6.28) * pulseAmount;
  } else if (uPhaseType == 2) {
    sizePulse = 1.0 + (1.0 - uBreathPhase) * 0.15;
  } else {
    float pulseAmount = 0.04 * (1.0 - uCrystallization * 0.7);
    sizePulse = 1.05 + sin(uTime * 1.5 + aPhase * 6.28) * pulseAmount;
  }
  baseSize *= sizePulse;

  // === TRAIL EFFECT ===
  float trailStretch = 1.0 + velocity * 5.0;
  baseSize *= min(trailStretch, 1.3);

  // === WORD FORMATION SIZE BOOST ===
  // Particles forming words grow slightly larger and brighter
  if (vWordBlend > 0.01) {
    baseSize *= (1.0 + vWordBlend * 0.4); // Up to 40% larger
  }

  // === SPARKLE ===
  // Reduced during crystallization (holds should be calm)
  float sparkleIntensity = 1.0 - uCrystallization * 0.6;
  float sparkleTime = uTime * 5.0 + aPhase * 100.0;
  float sparkle1 = pow(max(0.0, sin(sparkleTime)), 12.0);
  float sparkle2 = pow(max(0.0, sin(sparkleTime * 1.7 + 1.0)), 12.0);
  float sparkle3 = pow(max(0.0, sin(sparkleTime * 2.3 + 2.0)), 12.0);
  float sparkle = max(sparkle1, max(sparkle2, sparkle3)) * sparkleIntensity;
  vSparkle = sparkle;

  baseSize *= (1.0 + sparkle * 0.5);

  // Birth animation: particles start smaller
  baseSize *= birthAlpha;

  gl_PointSize = baseSize * uPixelRatio;
  gl_Position = projectionMatrix * mvPosition;

  // === COLOR with TEMPERATURE SHIFTING ===
  vec3 color = aColor;

  // Saturation boost
  vec3 gray = vec3(dot(color, vec3(0.299, 0.587, 0.114)));
  color = mix(gray, color, 1.4);

  // Temperature shift based on breath phase
  // Cool (cyan/blue) during inhale, warm (magenta/pink) during exhale
  vec3 coolTint = vec3(-0.05, 0.02, 0.08);   // Shift toward cyan
  vec3 warmTint = vec3(0.08, 0.0, 0.04);     // Shift toward magenta/pink

  vec3 tempShift = mix(coolTint, warmTint, uColorTemperature * 0.5 + 0.5);
  color += tempShift;

  // During breath wave, particles in the wave get brighter
  if (uBreathWave > 0.01) {
    float distFromCenter = length(pos);
    float waveRadius = uBreathWave * 25.0;
    float waveInfluence = exp(-abs(distFromCenter - waveRadius) * 0.3) * uBreathWave;
    color += vec3(0.1, 0.15, 0.2) * waveInfluence;
  }

  vColor = clamp(color, 0.0, 1.0);
}
`;
