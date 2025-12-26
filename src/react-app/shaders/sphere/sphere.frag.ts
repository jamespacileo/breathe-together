/**
 * Central Sphere Fragment Shader
 * Ethereal sphere with fresnel glow, inner core glow, and phase-specific coloring
 * Colors passed via uniforms for centralized palette management
 */
export const sphereFragmentShader = /* glsl */ `
precision highp float;

// === SHADER CONSTANTS ===
const float FRESNEL_POWER = 2.5;         // Edge transparency falloff
const float SHIMMER_FREQUENCY = 20.0;    // Surface wave frequency
const float CORE_GLOW_FALLOFF = 2.5;     // Inner core glow intensity falloff
const vec3 CORE_COLOR = vec3(0.753, 0.91, 0.941);  // #c0e8f0 inner core

uniform float uTime;
uniform float uBreathPhase;
uniform int uPhaseType;
uniform float uColorTemperature;
uniform float uCrystallization;
uniform vec3 uColor1;
uniform vec3 uColor2;

// Phase-specific colors (passed from centralized palette)
uniform vec3 uInhaleHue;
uniform vec3 uHoldInHue;
uniform vec3 uExhaleHue;
uniform vec3 uHoldOutHue;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  // Fresnel effect for ethereal edge glow
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float fresnel = pow(1.0 - max(0.0, dot(viewDir, vNormal)), FRESNEL_POWER);

  // Inner core glow - brighter at center, fades toward edges
  float distFromCenter = length(vPosition);
  float coreGlow = exp(-distFromCenter * CORE_GLOW_FALLOFF);
  float coreOpacity = 0.12 + uBreathPhase * 0.08;

  // Gradient based on vertical position
  float gradient = vPosition.y * 0.5 + 0.5;
  vec3 baseColor = mix(uColor1, uColor2, gradient);

  // === PHASE-SPECIFIC HUE SHIFTING ===
  // Soft blue palette throughout - calming, meditative
  // Colors from centralized palette via uniforms

  vec3 phaseColor;
  if (uPhaseType == 0) {
    // Inhale - transition from holdOut to inhale colors
    phaseColor = mix(uHoldOutHue, uInhaleHue, uBreathPhase);
  } else if (uPhaseType == 1) {
    // Hold-in - settle into stable color
    phaseColor = mix(uInhaleHue, uHoldInHue, min(1.0, uCrystallization * 1.5));
  } else if (uPhaseType == 2) {
    // Exhale - transition to warm releasing color
    phaseColor = mix(uHoldInHue, uExhaleHue, 1.0 - uBreathPhase);
  } else {
    // Hold-out - deep peaceful settling
    phaseColor = mix(uExhaleHue, uHoldOutHue, min(1.0, uCrystallization * 1.5));
  }

  // Blend base color with phase color
  baseColor = mix(baseColor, phaseColor, 0.6);

  // Subtle temperature tint - stays in blue range
  vec3 coolTint = vec3(-0.02, 0.02, 0.04);
  vec3 warmTint = vec3(0.02, 0.01, 0.03);
  vec3 tempShift = mix(coolTint, warmTint, uColorTemperature * 0.5 + 0.5);
  baseColor += tempShift;

  // Soft blue edge glow - consistent across phases
  vec3 edgeColor = vec3(0.5, 0.72, 0.82);
  if (uPhaseType == 2) {
    // Slightly softer edge during exhale
    edgeColor = vec3(0.55, 0.70, 0.80);
  } else if (uPhaseType == 0) {
    // Slightly brighter edge during inhale
    edgeColor = vec3(0.48, 0.75, 0.85);
  }

  vec3 color = mix(baseColor, edgeColor, fresnel * 0.6);

  // Subtle surface shimmer (reduced during crystallization)
  float shimmerStrength = 0.02 * (1.0 - uCrystallization * 0.6);
  float shimmer = sin(vPosition.x * SHIMMER_FREQUENCY + uTime) * sin(vPosition.y * SHIMMER_FREQUENCY + uTime * 1.3) * shimmerStrength;
  color += shimmer;

  // Blend in inner core glow (replaces separate inner core mesh)
  color = mix(color, CORE_COLOR, coreGlow * coreOpacity);

  // Soft alpha with fresnel - more visible during exhale (expanded)
  float baseAlpha = 0.12;
  if (uPhaseType == 2) {
    // More visible during exhale
    baseAlpha = 0.15 + (1.0 - uBreathPhase) * 0.08;
  } else if (uPhaseType == 0) {
    // Slightly less visible during inhale (contracting)
    baseAlpha = 0.1 + uBreathPhase * 0.05;
  }
  float alpha = baseAlpha + fresnel * 0.3 + coreGlow * coreOpacity * 0.15;

  gl_FragColor = vec4(color, alpha);
}
`;
