/**
 * GPGPU Simulation Fragment Shader
 * Handles particle physics, orbital motion, breath-synchronized effects, and word formation
 */
export const simulationFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uPositions;
uniform sampler2D uOriginalPositions;
uniform float uTime;
uniform float uBreathPhase;
uniform float uExpandedRadius;
uniform float uContractedRadius;
uniform int uPhaseType; // 0=inhale, 1=hold-in, 2=exhale, 3=hold-out

// === NEW SUBTLE EFFECT UNIFORMS ===
uniform float uAnticipation;      // Pre-transition gathering (0-1)
uniform float uOvershoot;         // Post-transition settling (0-1)
uniform float uDiaphragmDirection; // -1 down (inhale), 1 up (exhale), 0 hold
uniform float uCrystallization;   // Hold phase stillness (0-1)
uniform float uBreathWave;        // Radial wave intensity (0-1)
uniform vec2 uViewOffset;         // Micro-saccade parallax
uniform float uPhaseTransitionBlend; // 0-1, smooths parameter changes at phase boundaries

// === WORD FORMATION UNIFORMS ===
uniform sampler2D uWordTargets;     // Target positions for word particles (xyz) + letterIndex (w)
uniform sampler2D uWordParticles;   // Which particles are word particles (r=1) + progress (g) + letterCount (b)
uniform float uWordProgress;        // Global word animation progress (0-1)
uniform float uWordFormationEnd;    // When formation phase ends (default 0.7)
uniform float uWordLetterOverlap;   // Letter reveal overlap duration (default 0.4)

// Simple smooth noise
float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

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

// === CURL NOISE for coherent organic flow ===
// Creates streams like smoke or water - particles move together
vec3 curlNoise(vec3 p) {
  float e = 0.1;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);

  float n = noise(p);
  float ndx = noise(p + dx);
  float ndy = noise(p + dy);
  float ndz = noise(p + dz);

  // Curl = cross product of gradient
  vec3 curl;
  curl.x = (noise(p + dy) - noise(p - dy)) - (noise(p + dz) - noise(p - dz));
  curl.y = (noise(p + dz) - noise(p - dz)) - (noise(p + dx) - noise(p - dx));
  curl.z = (noise(p + dx) - noise(p - dx)) - (noise(p + dy) - noise(p - dy));

  return normalize(curl + 0.001) * 0.5;
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;

  vec4 posData = texture2D(uPositions, uv);
  vec4 origData = texture2D(uOriginalPositions, uv);

  vec3 pos = posData.xyz;
  vec3 origPos = origData.xyz;
  float phase = origData.w;

  // Calculate original direction and distance
  float origDist = length(origPos);
  vec3 dir = origDist > 0.001 ? normalize(origPos) : vec3(0.0, 1.0, 0.0);

  // Target radius - smooth interpolation between expanded and contracted
  float targetRadius = mix(uExpandedRadius, uContractedRadius, uBreathPhase);

  // Slight variation per particle for organic feel
  float radiusVariation = 0.9 + (origDist / 20.0) * 0.2;
  float particleTargetRadius = targetRadius * radiusVariation;

  // Calculate base orbital position
  vec3 targetPos = dir * particleTargetRadius;

  // === PHASE-SPECIFIC BEHAVIORS with SMOOTH TRANSITIONS ===
  //
  // To avoid jarring changes at phase boundaries, we:
  // 1. Define target values for current phase
  // 2. Use a "transitional" baseline that's a gentle average
  // 3. Blend from baseline to target using uPhaseTransitionBlend
  // This means at the start of each phase (blend=0), parameters are closer
  // to neutral values, then smoothly ramp to phase-specific values.

  // Reduced base orbit speed for more subtle, meditative rotation
  float baseOrbitSpeed = 0.06 + phase * 0.02;

  // Baseline (transitional) values - neutral middle ground
  float baselineOrbitMult = 0.85;
  float baselineDisplacement = 0.2;
  float baselineBob = 0.1;
  float baselineSpring = 0.055;
  float baselineSpiral = 0.0;
  float radiusModifier = 0.0;

  // Target values for current phase
  float targetOrbitMult = 1.0;
  float targetDisplacement = 0.2;
  float targetBob = 0.1;
  float targetSpring = 0.06;
  float targetSpiral = 0.0;

  if (uPhaseType == 0) {
    // INHALE: Gathering energy, slightly faster but still gentle
    targetOrbitMult = 1.2;
    targetDisplacement = 0.12;
    targetBob = 0.06;
    targetSpring = 0.07;
    targetSpiral = 0.15;
  } else if (uPhaseType == 1) {
    // HOLD-IN: Calm settling, minimal motion
    targetOrbitMult = 0.7;
    targetDisplacement = 0.04;
    targetBob = 0.02;
    targetSpring = 0.04;
    // Gentle pulse effect
    float pulse = sin(uTime * 2.0) * 0.015;
    radiusModifier = pulse;
  } else if (uPhaseType == 2) {
    // EXHALE: Particles drift outward gracefully
    targetOrbitMult = 0.9;
    targetDisplacement = 0.25;
    targetBob = 0.1;
    targetSpring = 0.05;
    targetSpiral = 0.1;
  } else {
    // HOLD-OUT: Peaceful floating, dreamy drift
    targetOrbitMult = 0.6;
    targetDisplacement = 0.18;
    targetBob = 0.08;
    targetSpring = 0.04;
    // Wandering effect
    float wander = noise(origPos * 0.05 + uTime * 0.1) * 0.2;
    radiusModifier = wander * 0.03;
  }

  // Smooth blend from baseline to target values
  // At phase start (blend=0): use mostly baseline values
  // As phase progresses (blend→1): use full target values
  float blend = uPhaseTransitionBlend;
  float orbitSpeedMultiplier = mix(baselineOrbitMult, targetOrbitMult, blend);
  float displacementStrength = mix(baselineDisplacement, targetDisplacement, blend);
  float bobAmount = mix(baselineBob, targetBob, blend);
  float springStrength = mix(baselineSpring, targetSpring, blend);
  float spiralStrength = mix(baselineSpiral, targetSpiral, blend);

  // Apply radius modifier (pulse/wander effects) with blend
  particleTargetRadius *= (1.0 + radiusModifier * blend);

  // === CRYSTALLIZATION: Reduce motion during holds ===
  float crystalFactor = 1.0 - uCrystallization * 0.8;
  displacementStrength *= crystalFactor;
  bobAmount *= crystalFactor;
  orbitSpeedMultiplier *= (1.0 - uCrystallization * 0.5);

  // Apply orbital rotation with phase-specific speed
  float orbit = uTime * baseOrbitSpeed * orbitSpeedMultiplier;
  float cosOrbit = cos(orbit);
  float sinOrbit = sin(orbit);

  // Rotate around Y axis
  targetPos = vec3(
    targetPos.x * cosOrbit + targetPos.z * sinOrbit,
    targetPos.y,
    -targetPos.x * sinOrbit + targetPos.z * cosOrbit
  );

  // Apply spiral effect - now always in same direction, just varies in intensity
  // (Removed sign flip between phases which caused jarring direction changes)
  if (abs(spiralStrength) > 0.01) {
    float spiralAngle = uTime * 0.2 * (0.5 + phase * 0.5);
    targetPos.y += sin(spiralAngle + phase * 6.28) * spiralStrength * 0.3;
  }

  // === COHERENT CURL NOISE (organic flow) ===
  // Particles move in streams, not randomly
  vec3 flowField = curlNoise(origPos * 0.08 + uTime * 0.03);
  float flowStrength = displacementStrength * 0.6 * crystalFactor;
  targetPos += flowField * flowStrength;

  // Additional noise-based displacement (reduced, curl does more work now)
  float noiseVal = noise(origPos * 0.1 + uTime * 0.05 + phase) - 0.5;
  targetPos += dir * noiseVal * displacementStrength * 0.4;

  // === DIAPHRAGMATIC VERTICAL DRIFT ===
  // Subtle downward drift during inhale, upward during exhale
  // Apply phase blend to prevent abrupt direction changes
  float diaphragmStrength = 0.25 * (1.0 - uCrystallization);
  float smoothDiaphragm = uDiaphragmDirection * blend;
  targetPos.y += smoothDiaphragm * diaphragmStrength * (0.5 + phase * 0.5);

  // Vertical bobbing with phase-specific amplitude
  targetPos.y += sin(uTime * 0.4 + phase * 6.28) * bobAmount;

  // === ANTICIPATION: Gentle gather before transition ===
  // Reduced to minimal effect - just a slight inward pull, no Y offset
  if (uAnticipation > 0.01) {
    float anticipationPull = uAnticipation * 0.08;
    targetPos *= (1.0 - anticipationPull);
  }

  // === OVERSHOOT: Subtle settle after transition ===
  if (uOvershoot > 0.01) {
    float overshootAmount = uOvershoot * 0.05;
    targetPos *= (1.0 + overshootAmount);
  }

  // === BREATH WAVE: Radial ripple visualization ===
  if (uBreathWave > 0.01) {
    float waveRadius = uBreathWave * 25.0;
    float distFromCenter = length(targetPos);
    float waveDelta = abs(distFromCenter - waveRadius);
    float waveInfluence = exp(-waveDelta * 0.5) * uBreathWave;
    // Push particles outward in the wave
    targetPos += dir * waveInfluence * 2.0;
  }

  // === MICRO-SACCADE PARALLAX ===
  // Very subtle shift based on view/mouse position
  targetPos.x += uViewOffset.x * (10.0 + origDist * 0.3);
  targetPos.y += uViewOffset.y * (10.0 + origDist * 0.3);

  // Smooth spring interpolation with phase-specific strength
  vec3 velocity = (targetPos - pos) * springStrength;
  vec3 newPos = pos + velocity;

  // === SUB-PIXEL JITTER REMOVAL during holds ===
  // Snap to sub-pixel grid when crystallized for true stillness
  if (uCrystallization > 0.8) {
    float snapStrength = (uCrystallization - 0.8) * 5.0; // 0-1 over last 20%
    float gridSize = 0.02; // Sub-pixel precision
    vec3 snapped = floor(newPos / gridSize + 0.5) * gridSize;
    newPos = mix(newPos, snapped, snapStrength * 0.5);
  }

  // === WORD FORMATION ===
  // Check if this particle is recruited for word formation
  vec4 wordParticleData = texture2D(uWordParticles, uv);
  float isWordParticle = wordParticleData.r;

  if (isWordParticle > 0.5 && uWordProgress > 0.0) {
    // Get target position and letter info
    vec4 wordTargetData = texture2D(uWordTargets, uv);
    vec3 wordTarget = wordTargetData.xyz;
    float letterIndex = wordTargetData.w;
    float letterCount = wordParticleData.b;

    // Calculate per-letter progress for sequential reveal
    float letterProgress = 0.0;

    if (uWordProgress < uWordFormationEnd) {
      // Formation phase: letters reveal sequentially
      float formProgress = uWordProgress / uWordFormationEnd;
      float letterRevealPoint = letterIndex / max(1.0, letterCount);

      // Each letter starts revealing at its proportional point
      letterProgress = clamp((formProgress * 1.5 - letterRevealPoint) / uWordLetterOverlap, 0.0, 1.0);

      // Smooth easing (smoothstep)
      letterProgress = letterProgress * letterProgress * (3.0 - 2.0 * letterProgress);
    } else {
      // Dissolve phase: all letters fade out together
      float dissolveProgress = (uWordProgress - uWordFormationEnd) / (1.0 - uWordFormationEnd);
      float dissolve = clamp(dissolveProgress, 0.0, 1.0);

      // Ease out the dissolve
      letterProgress = 1.0 - dissolve * dissolve;
    }

    // Add subtle floating animation to word particles
    float floatOffset = sin(uTime * 1.5 + letterIndex * 0.5) * 0.15;
    vec3 animatedTarget = wordTarget;
    animatedTarget.y += floatOffset * letterProgress;

    // Interpolate from sphere position to word position
    newPos = mix(newPos, animatedTarget, letterProgress);

    // Reduce velocity when forming word (particles should feel more stable)
    velocity *= (1.0 - letterProgress * 0.7);
  }

  // Store velocity magnitude in w for trail effect
  float velocityMag = length(velocity);

  gl_FragColor = vec4(newPos, velocityMag);
}
`;
