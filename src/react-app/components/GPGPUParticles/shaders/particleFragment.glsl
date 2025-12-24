precision highp float;

uniform float uTime;
uniform float uBreathPhase;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;

varying vec3 vPosition;
varying float vDistance;
varying float vSize;
varying float vPhase;
varying float vBreathPhase;

// RGB to HSL conversion
vec3 rgb2hsl(vec3 c) {
  float maxC = max(max(c.r, c.g), c.b);
  float minC = min(min(c.r, c.g), c.b);
  float l = (maxC + minC) / 2.0;
  float s = 0.0;
  float h = 0.0;

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

// HSL to RGB conversion
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
  // Distance from center of point
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);

  // Soft circle with glow
  float alpha = 1.0 - smoothstep(0.0, 0.5, dist);

  // Add glow halo
  float glow = exp(-dist * 4.0) * 0.5;
  alpha += glow;

  if (alpha < 0.01) discard;

  // Color mixing based on position and phase
  float positionMix = (vPosition.y + 20.0) / 40.0;
  float phaseMix = vPhase;

  // Three-way color blend
  vec3 baseColor = mix(uColor1, uColor2, positionMix);
  baseColor = mix(baseColor, uColor3, phaseMix * 0.5);

  // Convert to HSL for breathing-based adjustments
  vec3 hsl = rgb2hsl(baseColor);

  // Hue shift based on breath phase
  float hueShift = (vBreathPhase - 0.5) * 0.05;
  hsl.x = mod(hsl.x + hueShift + 1.0, 1.0);

  // Saturation boost during inhale
  hsl.y = clamp(hsl.y + vBreathPhase * 0.2, 0.0, 1.0);

  // Lightness boost during inhale
  hsl.z = clamp(hsl.z + vBreathPhase * 0.15, 0.0, 1.0);

  vec3 color = hsl2rgb(hsl);

  // Add brightness based on breath phase
  float brightness = 1.0 + vBreathPhase * 0.4;
  color *= brightness;

  // Add subtle color variation based on time
  float colorPulse = sin(uTime + vPhase * 6.28) * 0.1;
  color += colorPulse * vec3(0.1, 0.05, 0.15);

  // Core glow (brighter center)
  float coreGlow = exp(-dist * 8.0) * vBreathPhase * 0.8;
  color += vec3(1.0, 0.9, 0.8) * coreGlow;

  // Fade based on breath phase (more opaque when inhaled)
  float baseAlpha = 0.6 + vBreathPhase * 0.3;
  alpha *= baseAlpha;

  // Distance fade
  float distanceFade = 1.0 - smoothstep(30.0, 80.0, vDistance);
  alpha *= distanceFade;

  gl_FragColor = vec4(color, alpha);
}
