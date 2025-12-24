/**
 * Visual Particle Shaders
 * Enhanced vertex and fragment shaders for beautiful particle rendering
 */
import { NOISE_FUNCTIONS } from './noise.glsl';

export const PARTICLE_VERTEX_SHADER = /* glsl */ `
uniform sampler2D texturePosition;
uniform float uTime;
uniform float uBreathValue;
uniform float uPhaseType;
uniform vec2 uResolution;

attribute vec2 reference;
attribute float size;
attribute vec3 aColor;

varying vec3 vColor;
varying float vAlpha;
varying float vDist;
varying float vSize;
varying vec2 vReference;

${NOISE_FUNCTIONS}

void main() {
  vReference = reference;
  vColor = aColor;

  // Sample position from GPGPU texture
  vec4 posData = texture2D(texturePosition, reference);
  vec3 position = posData.xyz;
  float life = posData.w;

  // Skip inactive particles
  if (life < 0.01) {
    gl_Position = vec4(0.0, 0.0, -1000.0, 1.0);
    gl_PointSize = 0.0;
    vAlpha = 0.0;
    return;
  }

  // Per-particle variation using reference as seed
  float seed = reference.x * 100.0 + reference.y * 10.0;

  // Multi-frequency twinkle
  float twinkle1 = sin(uTime * (0.5 + seed * 0.3) + seed * 6.28) * 0.3;
  float twinkle2 = sin(uTime * (0.8 + seed * 0.2) + seed * 3.14) * 0.15;
  float twinkle3 = sin(uTime * (1.2 + seed * 0.1) + seed * 1.57) * 0.1;
  float twinkle = 0.55 + twinkle1 + twinkle2 + twinkle3;

  // Breath-synchronized brightness
  float breathBrightness = 0.7 + uBreathValue * 0.4;

  // Aurora-like shimmer based on position
  float aurora = 0.0;
  float noiseVal = snoise(position * 2.0 + uTime * 0.2);
  aurora = noiseVal * 0.2 + 0.1;

  // Phase-specific alpha modulation
  float phaseAlpha = 1.0;
  if (uPhaseType > 0.5 && uPhaseType < 1.5) {
    // Hold-in: brighter, more intense
    phaseAlpha = 1.0 + sin(uTime * 4.0 + seed * 2.0) * 0.15;
  } else if (uPhaseType > 2.5) {
    // Hold-out: softer, more diffuse
    phaseAlpha = 0.85 + sin(uTime * 2.0 + seed) * 0.1;
  }

  vAlpha = life * twinkle * breathBrightness * phaseAlpha;
  vAlpha = clamp(vAlpha, 0.0, 1.0);

  // Size modulation
  float sizeMultiplier = 0.8 + twinkle * 0.4;
  sizeMultiplier *= (0.9 + uBreathValue * 0.2);

  // Pulse effect
  float pulse = sin(uTime * 0.3 + seed * 3.14) * 0.1 + 1.0;
  sizeMultiplier *= pulse;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vDist = -mvPosition.z;

  // Size with depth attenuation
  float depthSize = size * sizeMultiplier * (4.0 / -mvPosition.z);
  gl_PointSize = clamp(depthSize * life, 1.0, 80.0);
  vSize = gl_PointSize;

  gl_Position = projectionMatrix * mvPosition;
}
`;

export const PARTICLE_FRAGMENT_SHADER = /* glsl */ `
uniform sampler2D uTexture;
uniform float uTime;
uniform float uBreathValue;
uniform float uPhaseType;
uniform vec3 uPrimaryColor;
uniform vec3 uSecondaryColor;

varying vec3 vColor;
varying float vAlpha;
varying float vDist;
varying float vSize;
varying vec2 vReference;

${NOISE_FUNCTIONS}

// Color space conversion
vec3 rgb2hsl(vec3 c) {
  float maxC = max(max(c.r, c.g), c.b);
  float minC = min(min(c.r, c.g), c.b);
  float l = (maxC + minC) / 2.0;
  float h = 0.0;
  float s = 0.0;

  if (maxC != minC) {
    float d = maxC - minC;
    s = l > 0.5 ? d / (2.0 - maxC - minC) : d / (maxC + minC);

    if (maxC == c.r) {
      h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
    } else if (maxC == c.g) {
      h = (c.b - c.r) / d + 2.0;
    } else {
      h = (c.r - c.g) / d + 4.0;
    }
    h /= 6.0;
  }

  return vec3(h, s, l);
}

float hue2rgb(float p, float q, float t) {
  if (t < 0.0) t += 1.0;
  if (t > 1.0) t -= 1.0;
  if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
  if (t < 1.0/2.0) return q;
  if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
  return p;
}

vec3 hsl2rgb(vec3 hsl) {
  float h = hsl.x;
  float s = hsl.y;
  float l = hsl.z;

  if (s == 0.0) {
    return vec3(l);
  }

  float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
  float p = 2.0 * l - q;

  return vec3(
    hue2rgb(p, q, h + 1.0/3.0),
    hue2rgb(p, q, h),
    hue2rgb(p, q, h - 1.0/3.0)
  );
}

void main() {
  if (vAlpha < 0.01) discard;

  // Star texture
  vec4 tex = texture2D(uTexture, gl_PointCoord);
  if (tex.a < 0.01) discard;

  // Distance-based falloff
  float fade = smoothstep(12.0, 2.0, vDist);

  // Calculate color with hue shifting based on breath
  vec3 hsl = rgb2hsl(vColor);

  // Subtle hue shift during different phases
  float hueShift = 0.0;
  if (uPhaseType < 0.5) {
    // Inhale: shift toward warm (positive)
    hueShift = 0.02 * uBreathValue;
  } else if (uPhaseType > 1.5 && uPhaseType < 2.5) {
    // Exhale: shift toward cool (negative)
    hueShift = -0.02 * (1.0 - uBreathValue);
  }
  hsl.x = fract(hsl.x + hueShift);

  // Saturation boost during holds
  if (uPhaseType > 0.5 && uPhaseType < 1.5) {
    hsl.y = min(1.0, hsl.y * 1.1);
  }

  // Lightness modulation
  hsl.z = clamp(hsl.z * (0.9 + uBreathValue * 0.2), 0.0, 1.0);

  vec3 color = hsl2rgb(hsl);

  // Add core glow
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  float coreGlow = exp(-dist * dist * 8.0) * 0.3;
  color += vec3(coreGlow) * uBreathValue;

  // Aurora effect - color variation based on noise
  float aurora = snoise(vec3(vReference * 10.0, uTime * 0.1)) * 0.5 + 0.5;
  vec3 auroraColor = mix(uPrimaryColor, uSecondaryColor, aurora);
  color = mix(color, auroraColor, 0.15);

  // Final alpha
  float alpha = tex.a * 1.4 * fade * vAlpha;

  gl_FragColor = vec4(color, alpha);
}
`;

// Halo/glow shader for the central sphere effect
export const HALO_VERTEX_SHADER = /* glsl */ `
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const HALO_FRAGMENT_SHADER = /* glsl */ `
uniform float uTime;
uniform float uBreathValue;
uniform vec3 uColor;
uniform float uOpacity;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // Fresnel effect for edge glow
  vec3 viewDirection = normalize(cameraPosition - vPosition);
  float fresnel = pow(1.0 - abs(dot(vNormal, viewDirection)), 3.0);

  // Breathing modulation
  float breathGlow = 0.3 + uBreathValue * 0.7;

  // Pulsing effect
  float pulse = sin(uTime * 2.0) * 0.1 + 0.9;

  float alpha = fresnel * breathGlow * pulse * uOpacity;

  gl_FragColor = vec4(uColor, alpha);
}
`;
