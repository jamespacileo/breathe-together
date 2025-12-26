/**
 * Glow Sphere Fragment Shader
 * Outer glow effect with phase-specific coloring
 * Uses inverted fresnel for edge glow effect
 */
export const glowFragmentShader = /* glsl */ `
// === SHADER CONSTANTS ===
const float FRESNEL_POWER = 3.5;          // Edge glow sharpness
const float PULSE_BASE = 0.85;            // Base glow intensity
const float PULSE_AMPLITUDE = 0.08;       // Pulse variation range
const float PULSE_SPEED = 0.4;            // Pulse frequency
const float GLOW_ALPHA_BASE = 0.25;       // Base transparency
const float INHALE_INTENSITY_MIN = 0.8;   // Glow during start of inhale
const float INHALE_INTENSITY_RANGE = 0.4; // Added intensity at full inhale
const float EXHALE_INTENSITY_MAX = 1.2;   // Glow at start of exhale

uniform float uBreathPhase;
uniform int uPhaseType;
uniform float uTime;
uniform vec3 uInhaleColor;
uniform vec3 uHoldInColor;
uniform vec3 uExhaleColor;
uniform vec3 uHoldOutColor;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);

  // Inverted fresnel - glow at edges, transparent in center
  float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), FRESNEL_POWER);

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
  float pulse = PULSE_BASE + sin(uTime * PULSE_SPEED) * PULSE_AMPLITUDE;

  // Phase-specific intensity for dynamic breathing feedback
  float phaseIntensity = 1.0;
  if (uPhaseType == 0) {
    // Inhale: glow builds as breath fills
    phaseIntensity = INHALE_INTENSITY_MIN + uBreathPhase * INHALE_INTENSITY_RANGE;
  } else if (uPhaseType == 2) {
    // Exhale: glow releases and fades
    phaseIntensity = EXHALE_INTENSITY_MAX - (1.0 - uBreathPhase) * INHALE_INTENSITY_RANGE;
  }

  float alpha = fresnel * GLOW_ALPHA_BASE * pulse * phaseIntensity;

  gl_FragColor = vec4(glowColor, alpha);
}
`;
