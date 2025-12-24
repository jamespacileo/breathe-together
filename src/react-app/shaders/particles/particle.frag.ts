/**
 * Main Particle Fragment Shader
 * Handles particle shape, glow, sparkle, and phase-specific rendering
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

  // === SHARPER, MORE DEFINED PARTICLE SHAPE ===
  float coreDist = dist * 2.5;
  float alpha = 1.0 - smoothstep(0.6, 1.0, coreDist);

  if (alpha < 0.01) discard;

  // Base color
  vec3 color = vColor;
  int phaseType = int(vPhaseType + 0.5);

  // === SHINY HIGHLIGHT ===
  float coreHighlight = exp(-coreDist * 4.0);
  color *= (1.0 + coreHighlight * 0.8);

  // === SPARKLE/GLIMMER ===
  if (vSparkle > 0.3) {
    float sparkleIntensity = pow((vSparkle - 0.3) / 0.7, 2.0);
    float sparkleCore = exp(-coreDist * 6.0) * sparkleIntensity;
    color += vec3(1.0) * sparkleCore * 0.8;
    color *= (1.0 + sparkleIntensity * 0.4);
  }

  // === PHASE-SPECIFIC BRIGHTNESS ===
  float brightness = 1.0;
  if (phaseType == 0) {
    brightness = 0.85 + vBreathPhase * 0.15;
  } else if (phaseType == 1) {
    // During crystallization, brightness is more stable
    float pulseAmount = 0.05 * (1.0 - uCrystallization * 0.7);
    brightness = 1.0 + sin(uTime * 3.0) * pulseAmount;
  } else if (phaseType == 2) {
    brightness = 1.0 - vBreathPhase * 0.1;
  } else {
    float pulseAmount = 0.03 * (1.0 - uCrystallization * 0.7);
    brightness = 0.9 + sin(uTime * 2.0) * pulseAmount;
  }
  color *= brightness;

  // === DEPTH-BASED BRIGHTNESS ===
  float depthBrightness = 0.8 + vDepthFactor * 0.25;
  color *= depthBrightness;

  // === EDGE RIM ===
  float rimDist = abs(coreDist - 0.7);
  float rim = exp(-rimDist * 8.0) * 0.15;
  color += vColor * rim;

  // === ALPHA ===
  float baseAlpha = 0.8;
  if (phaseType == 0) {
    baseAlpha = 0.7 + vBreathPhase * 0.2;
  } else if (phaseType == 1) {
    baseAlpha = 0.9;
  } else if (phaseType == 2) {
    baseAlpha = 0.85 - vBreathPhase * 0.1;
  } else {
    baseAlpha = 0.75;
  }

  baseAlpha = min(1.0, baseAlpha + vSparkle * 0.2);
  alpha *= baseAlpha;

  // Depth fade
  float depthFade = 0.5 + vDepthFactor * 0.5;
  alpha *= depthFade;

  // Distance fade
  float distanceFade = 1.0 - smoothstep(40.0, 70.0, vDistance);
  alpha *= distanceFade;

  // === BIRTH ANIMATION ALPHA ===
  // Particles fade in during birth
  alpha *= vBirthAlpha;

  gl_FragColor = vec4(color, alpha);
}
`;
