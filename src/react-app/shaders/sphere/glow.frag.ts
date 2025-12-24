/**
 * Glow Sphere Fragment Shader
 * Outer glow effect with phase-specific coloring
 * Uses inverted fresnel for edge glow effect
 */
export const glowFragmentShader = /* glsl */ `
uniform float uBreathPhase;
uniform int uPhaseType;
uniform float uTime;
uniform vec3 uInhaleColor;
uniform vec3 uHoldInColor;
uniform vec3 uExhaleColor;
uniform vec3 uHoldOutColor;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vec3 viewDir = normalize(cameraPosition - vPosition);

  // Inverted fresnel - glow at edges, transparent in center
  float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 3.5);

  // Select glow color based on breathing phase
  vec3 glowColor;
  if (uPhaseType == 0) {
    // Inhale - transition from holdOut to inhale colors
    glowColor = mix(uHoldOutColor, uInhaleColor, uBreathPhase);
  } else if (uPhaseType == 1) {
    // Hold-in - stable color
    glowColor = uHoldInColor;
  } else if (uPhaseType == 2) {
    // Exhale - transition from holdIn to exhale colors
    glowColor = mix(uHoldInColor, uExhaleColor, 1.0 - uBreathPhase);
  } else {
    // Hold-out - stable color
    glowColor = uHoldOutColor;
  }

  // Gentle pulsing glow
  float pulse = 0.85 + sin(uTime * 0.4) * 0.08;

  // Phase-specific intensity for dynamic breathing feedback
  float phaseIntensity = 1.0;
  if (uPhaseType == 0) {
    // Inhale: glow builds as breath fills
    phaseIntensity = 0.8 + uBreathPhase * 0.4;
  } else if (uPhaseType == 2) {
    // Exhale: glow releases and fades
    phaseIntensity = 1.2 - (1.0 - uBreathPhase) * 0.4;
  }

  float alpha = fresnel * 0.25 * pulse * phaseIntensity;

  gl_FragColor = vec4(glowColor, alpha);
}
`;
