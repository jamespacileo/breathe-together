/**
 * User Orbit Particle Vertex Shader
 * Handles particle sizing, twinkle effects, and color for orbiting user particles
 */
export const userParticleVertexShader = /* glsl */ `
precision highp float;

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
  float orbitalVelocity = 0.12 * length(pos.xz) * 0.01;  // Orbital contribution
  float breathingVelocity = 0.0;
  if (uPhaseType == 0 || uPhaseType == 2) {
    breathingVelocity = 0.15;  // Active breathing phases have more motion
  } else {
    breathingVelocity = 0.05;  // Hold phases - subtle motion
  }
  vVelocity = orbitalVelocity + breathingVelocity;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vDistance = -mvPosition.z;

  // Depth-based size attenuation
  float distanceAttenuation = 150.0 / max(vDistance, 1.0);

  // Dynamic size based on user count: fewer users = bigger particles
  // 2.0x for 2 users, 1.3x for 50 users, 1.0x for 200 users, 0.7x for 500+
  float countScale = 1.0 + 1.0 * (1.0 - smoothstep(2.0, 200.0, uUserCount));

  // Base size for user particles with count scaling
  float baseSize = aSize * 0.8 * distanceAttenuation * countScale;

  // Phase-specific size modulation
  float sizePhase = 1.0;
  if (uPhaseType == 0) {
    // Inhale: slightly smaller, contracting feel
    sizePhase = 0.9 + uBreathPhase * 0.1;
  } else if (uPhaseType == 1) {
    // Hold-in: stable with gentle pulse
    float pulse = sin(uTime * 2.0 + aPhase * 6.28) * 0.05;
    sizePhase = 1.0 + pulse * (1.0 - uCrystallization * 0.8);
  } else if (uPhaseType == 2) {
    // Exhale: expanding
    sizePhase = 1.1 - uBreathPhase * 0.15;
  } else {
    // Hold-out: soft floating pulse
    float pulse = sin(uTime * 1.5 + aPhase * 6.28) * 0.04;
    sizePhase = 1.05 + pulse * (1.0 - uCrystallization * 0.8);
  }
  baseSize *= sizePhase;

  // Gentle twinkle effect
  float twinkleSpeed = 2.5;
  float twinklePhase = uTime * twinkleSpeed + aPhase * 50.0;
  float twinkle1 = pow(max(0.0, sin(twinklePhase)), 12.0);
  float twinkle2 = pow(max(0.0, sin(twinklePhase * 1.3 + 1.5)), 12.0);
  float twinkle = max(twinkle1, twinkle2);

  // Reduce twinkle during crystallization for stillness
  twinkle *= (1.0 - uCrystallization * 0.7);
  vTwinkle = twinkle;

  // Apply twinkle to size
  baseSize *= (1.0 + twinkle * 0.3);

  gl_PointSize = baseSize * uPixelRatio;
  gl_Position = projectionMatrix * mvPosition;

  // Color with subtle phase-based temperature shift
  vec3 color = aColor;

  // Keep colors vivid with minimal desaturation
  vec3 gray = vec3(dot(color, vec3(0.299, 0.587, 0.114)));
  color = mix(gray, color, 0.95);

  // Phase-based color temperature
  vec3 coolShift = vec3(-0.02, 0.02, 0.05);  // Cyan shift
  vec3 warmShift = vec3(0.03, 0.0, 0.02);    // Rose shift

  float temperature = 0.0;
  if (uPhaseType == 0) {
    temperature = -0.5; // Cool during inhale
  } else if (uPhaseType == 2) {
    temperature = 0.3;  // Slightly warm during exhale
  }

  vec3 tempShift = mix(coolShift, warmShift, temperature * 0.5 + 0.5);
  color += tempShift * 0.5;

  vColor = clamp(color, 0.0, 1.0);
  vPhaseType = float(uPhaseType);
}
`;
