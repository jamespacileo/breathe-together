/**
 * Visual Particle Shaders
 * Enhanced vertex and fragment shaders for beautiful particle rendering
 */
import { NOISE_FUNCTIONS } from './noise.glsl';

export const PARTICLE_VERTEX_SHADER = /* glsl */ `
uniform sampler2D texturePosition;
uniform sampler2D textureVelocity;
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
varying float vSparkle;
varying float vVelocity;

${NOISE_FUNCTIONS}

void main() {
  vReference = reference;
  vColor = aColor;

  // Sample position and velocity from GPGPU textures
  vec4 posData = texture2D(texturePosition, reference);
  vec4 velData = texture2D(textureVelocity, reference);
  vec3 position = posData.xyz;
  vec3 velocity = velData.xyz;
  float life = posData.w;
  float speed = length(velocity);
  vVelocity = speed;

  // Skip inactive particles
  if (life < 0.01) {
    gl_Position = vec4(0.0, 0.0, -1000.0, 1.0);
    gl_PointSize = 0.0;
    vAlpha = 0.0;
    vSparkle = 0.0;
    return;
  }

  // Per-particle variation using reference as seed
  float seed = reference.x * 100.0 + reference.y * 10.0;

  // Multi-frequency twinkle
  float twinkle1 = sin(uTime * (0.5 + seed * 0.3) + seed * 6.28) * 0.25;
  float twinkle2 = sin(uTime * (0.8 + seed * 0.2) + seed * 3.14) * 0.12;
  float twinkle3 = sin(uTime * (1.2 + seed * 0.1) + seed * 1.57) * 0.08;
  float twinkle = 0.55 + twinkle1 + twinkle2 + twinkle3;

  // Breath-synchronized brightness - DIMMER when inhaled, brighter when exhaled
  float breathBrightness = 1.0 - uBreathValue * 0.35;

  // Subtle sparkle/glitter effect based on movement and time
  // Fast particles occasionally catch light
  float sparkleTime = uTime * 8.0 + seed * 100.0;
  float sparkleNoise = snoise(vec3(seed * 50.0, sparkleTime * 0.3, speed * 10.0));
  float sparkleThreshold = 0.92 - speed * 0.5; // Moving particles sparkle more
  vSparkle = smoothstep(sparkleThreshold, 1.0, sparkleNoise) * speed * 3.0;
  vSparkle = clamp(vSparkle, 0.0, 0.4); // Keep it subtle

  // Phase-specific alpha modulation
  float phaseAlpha = 1.0;
  if (uPhaseType > 0.5 && uPhaseType < 1.5) {
    // Hold-in: calmer, more subdued
    phaseAlpha = 0.85 + sin(uTime * 2.0 + seed * 2.0) * 0.08;
  } else if (uPhaseType > 2.5) {
    // Hold-out: slightly brighter, relaxed
    phaseAlpha = 0.95 + sin(uTime * 1.5 + seed) * 0.1;
  }

  vAlpha = life * twinkle * breathBrightness * phaseAlpha;
  vAlpha = clamp(vAlpha, 0.0, 1.0);

  // Size modulation - slightly smaller when inhaled
  float sizeMultiplier = 0.85 + twinkle * 0.3;
  sizeMultiplier *= (1.05 - uBreathValue * 0.15);

  // Pulse effect
  float pulse = sin(uTime * 0.3 + seed * 3.14) * 0.08 + 1.0;
  sizeMultiplier *= pulse;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vDist = -mvPosition.z;

  // Size with depth attenuation
  float depthSize = size * sizeMultiplier * (4.0 / -mvPosition.z);
  gl_PointSize = clamp(depthSize * life, 1.0, 70.0);
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
varying float vSparkle;
varying float vVelocity;

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
    // Inhale: shift toward cooler (negative) - calming
    hueShift = -0.015 * uBreathValue;
  } else if (uPhaseType > 1.5 && uPhaseType < 2.5) {
    // Exhale: shift toward warm (positive)
    hueShift = 0.015 * (1.0 - uBreathValue);
  }
  hsl.x = fract(hsl.x + hueShift);

  // Reduce saturation when inhaled for calmer look
  hsl.y = hsl.y * (1.0 - uBreathValue * 0.15);

  // Lightness - dimmer when inhaled, brighter when exhaled
  hsl.z = clamp(hsl.z * (1.0 - uBreathValue * 0.2), 0.0, 1.0);

  vec3 color = hsl2rgb(hsl);

  // Soft core glow - reduced when inhaled
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  float coreGlow = exp(-dist * dist * 10.0) * 0.2 * (1.0 - uBreathValue * 0.5);
  color += vec3(coreGlow);

  // Aurora effect - subtle color variation
  float aurora = snoise(vec3(vReference * 10.0, uTime * 0.08)) * 0.5 + 0.5;
  vec3 auroraColor = mix(uPrimaryColor, uSecondaryColor, aurora);
  color = mix(color, auroraColor, 0.1);

  // Subtle sparkle/glitter effect - tiny bright glints on moving particles
  // Creates a glittery, almost unnoticeable shimmer
  float sparkleIntensity = vSparkle * (1.0 - uBreathValue * 0.5);
  color += vec3(sparkleIntensity * 0.8, sparkleIntensity * 0.9, sparkleIntensity);

  // Final alpha - slightly reduced when inhaled
  float alphaModulation = 1.0 - uBreathValue * 0.15;
  float alpha = tex.a * 1.2 * fade * vAlpha * alphaModulation;

  gl_FragColor = vec4(color, alpha);
}
`;

// Halo/glow shader for the central sphere effect
export const HALO_VERTEX_SHADER = /* glsl */ `
varying vec3 vWorldPosition;
varying vec3 vViewPosition;
varying vec3 vNormal;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const HALO_FRAGMENT_SHADER = /* glsl */ `
uniform float uTime;
uniform float uBreathValue;
uniform vec3 uColor;
uniform float uOpacity;

varying vec3 vWorldPosition;
varying vec3 vViewPosition;
varying vec3 vNormal;

void main() {
  // View direction in view space
  vec3 viewDir = normalize(vViewPosition);

  // Fresnel effect - glow at edges
  float fresnel = 1.0 - abs(dot(normalize(vNormal), viewDir));
  fresnel = pow(fresnel, 2.0);

  // Breathing modulation - brighter when exhaled
  float breathGlow = 0.6 + (1.0 - uBreathValue) * 0.4;

  // Subtle pulsing
  float pulse = sin(uTime * 1.5) * 0.08 + 0.92;

  // Soft radial falloff from center
  float radialFade = 1.0 - smoothstep(0.0, 1.0, length(vWorldPosition) * 0.8);

  float alpha = fresnel * breathGlow * pulse * uOpacity * radialFade;
  alpha = clamp(alpha, 0.0, 1.0);

  // Slightly tinted glow
  vec3 glowColor = uColor * (0.9 + fresnel * 0.1);

  gl_FragColor = vec4(glowColor, alpha);
}
`;
