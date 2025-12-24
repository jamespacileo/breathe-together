/**
 * Main Particle Fragment Shader
 * Soft, ethereal particles for meditation visualization
 */
export const particleFragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uBreathPhase;
uniform int uPhaseType;
uniform float uCrystallization;

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

void main() {
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);

  // === SOFT, DIFFUSE PARTICLE SHAPE ===
  // Gaussian-like falloff for dreamy, soft appearance
  float coreDist = dist * 2.0;
  float alpha = exp(-coreDist * coreDist * 2.0);

  if (alpha < 0.01) discard;

  // Base color - keep it gentle
  vec3 color = vColor;
  int phaseType = int(vPhaseType + 0.5);

  // === SOFT INNER GLOW (subtle) ===
  float coreGlow = exp(-coreDist * 3.0);
  color = mix(color, color * 1.2, coreGlow * 0.3);

  // === GENTLE SPARKLE (very subtle) ===
  if (vSparkle > 0.5) {
    float sparkleIntensity = (vSparkle - 0.5) * 2.0;
    float sparkleCore = exp(-coreDist * 4.0) * sparkleIntensity;
    color += vec3(0.15) * sparkleCore;
  }

  // === PHASE-SPECIFIC SUBTLE BRIGHTNESS ===
  float brightness = 1.0;
  if (phaseType == 0) {
    // Inhale - gentle brightening as we gather energy
    brightness = 0.9 + vBreathPhase * 0.1;
  } else if (phaseType == 1) {
    // Hold-in - calm, stable glow
    float pulseAmount = 0.02 * (1.0 - uCrystallization * 0.8);
    brightness = 1.0 + sin(uTime * 1.5) * pulseAmount;
  } else if (phaseType == 2) {
    // Exhale - softly dimming as we release
    brightness = 1.0 - vBreathPhase * 0.05;
  } else {
    // Hold-out - peaceful, subdued
    float pulseAmount = 0.015 * (1.0 - uCrystallization * 0.8);
    brightness = 0.95 + sin(uTime * 1.0) * pulseAmount;
  }
  color *= brightness;

  // === DEPTH-BASED SOFTENING ===
  float depthBrightness = 0.85 + vDepthFactor * 0.15;
  color *= depthBrightness;

  // === SOFT ALPHA - more transparent for ethereal feel ===
  float baseAlpha = 0.5;
  if (phaseType == 0) {
    // Inhale - particles become more visible as they gather
    baseAlpha = 0.4 + vBreathPhase * 0.15;
  } else if (phaseType == 1) {
    // Hold-in - calm presence
    baseAlpha = 0.55;
  } else if (phaseType == 2) {
    // Exhale - particles soften as they release
    baseAlpha = 0.5 - vBreathPhase * 0.1;
  } else {
    // Hold-out - peaceful fade
    baseAlpha = 0.4;
  }

  // Subtle sparkle boost
  baseAlpha = min(0.7, baseAlpha + vSparkle * 0.1);
  alpha *= baseAlpha;

  // Gentle depth fade
  float depthFade = 0.6 + vDepthFactor * 0.4;
  alpha *= depthFade;

  // Distance fade - softer transition
  float distanceFade = 1.0 - smoothstep(35.0, 60.0, vDistance);
  alpha *= distanceFade;

  // === BIRTH ANIMATION ALPHA ===
  alpha *= vBirthAlpha;

  gl_FragColor = vec4(color, alpha);
}
`;
