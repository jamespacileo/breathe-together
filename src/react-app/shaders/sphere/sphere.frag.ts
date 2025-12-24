/**
 * Central Sphere Fragment Shader
 * Ethereal sphere with fresnel glow and phase-specific coloring
 */
export const sphereFragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uBreathPhase;
uniform int uPhaseType;
uniform float uColorTemperature;
uniform float uCrystallization;
uniform vec3 uColor1;
uniform vec3 uColor2;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  // Fresnel effect for ethereal edge glow
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float fresnel = pow(1.0 - max(0.0, dot(viewDir, vNormal)), 2.5);

  // Gradient based on vertical position
  float gradient = vPosition.y * 0.5 + 0.5;
  vec3 baseColor = mix(uColor1, uColor2, gradient);

  // === PHASE-SPECIFIC HUE SHIFTING ===
  // Inhale: Cool, gathering energy (cyan/blue tint)
  // Hold-in: Stable, present (neutral with slight glow)
  // Exhale: Warm, releasing (magenta/rose tint)
  // Hold-out: Deep, peaceful (deeper blue-purple)

  vec3 inhaleHue = vec3(0.15, 0.35, 0.45);    // Deep teal
  vec3 holdInHue = vec3(0.2, 0.3, 0.4);       // Neutral blue-gray
  vec3 exhaleHue = vec3(0.35, 0.25, 0.4);     // Warm purple-rose
  vec3 holdOutHue = vec3(0.18, 0.22, 0.35);   // Deep peaceful blue

  vec3 phaseColor;
  if (uPhaseType == 0) {
    // Inhale - transition from holdOut to inhale colors
    phaseColor = mix(holdOutHue, inhaleHue, uBreathPhase);
  } else if (uPhaseType == 1) {
    // Hold-in - settle into stable color
    phaseColor = mix(inhaleHue, holdInHue, min(1.0, uCrystallization * 1.5));
  } else if (uPhaseType == 2) {
    // Exhale - transition to warm releasing color
    phaseColor = mix(holdInHue, exhaleHue, 1.0 - uBreathPhase);
  } else {
    // Hold-out - deep peaceful settling
    phaseColor = mix(exhaleHue, holdOutHue, min(1.0, uCrystallization * 1.5));
  }

  // Blend base color with phase color
  baseColor = mix(baseColor, phaseColor, 0.6);

  // Additional temperature tint (from particle system)
  vec3 coolTint = vec3(-0.03, 0.02, 0.06);
  vec3 warmTint = vec3(0.06, 0.0, 0.03);
  vec3 tempShift = mix(coolTint, warmTint, uColorTemperature * 0.5 + 0.5);
  baseColor += tempShift;

  // Edge glow color shifts with phase
  vec3 edgeColor = vec3(0.5, 0.7, 0.85);
  if (uPhaseType == 2) {
    // Warmer edge during exhale
    edgeColor = vec3(0.7, 0.6, 0.8);
  } else if (uPhaseType == 0) {
    // Cooler edge during inhale
    edgeColor = vec3(0.5, 0.75, 0.9);
  }

  vec3 color = mix(baseColor, edgeColor, fresnel * 0.6);

  // Subtle surface shimmer (reduced during crystallization)
  float shimmerStrength = 0.02 * (1.0 - uCrystallization * 0.6);
  float shimmer = sin(vPosition.x * 20.0 + uTime) * sin(vPosition.y * 20.0 + uTime * 1.3) * shimmerStrength;
  color += shimmer;

  // Soft alpha with fresnel - more visible during exhale (expanded)
  float baseAlpha = 0.12;
  if (uPhaseType == 2) {
    // More visible during exhale
    baseAlpha = 0.15 + (1.0 - uBreathPhase) * 0.08;
  } else if (uPhaseType == 0) {
    // Slightly less visible during inhale (contracting)
    baseAlpha = 0.1 + uBreathPhase * 0.05;
  }
  float alpha = baseAlpha + fresnel * 0.3;

  gl_FragColor = vec4(color, alpha);
}
`;
