/**
 * Particle Vertex Shader
 * Handles point size, position, and color/type-based rendering
 */

export const renderVertexShader = /* glsl */ `
precision highp float;

// Textures
uniform sampler2D tPosition;  // Position (xyz) + type (w)
uniform sampler2D tVelocity;  // Velocity (xyz) + spawnTime (w)
uniform sampler2D tColor;     // Color (rgba)

// Uniforms
uniform float uTime;
uniform float uBaseSize;
uniform float uPixelRatio;
uniform int uPhaseType;
uniform float uEasedProgress;
uniform float uTemperatureShift; // -1 cool to +1 warm

// Per-particle attributes
attribute vec2 aReference;    // UV coords in texture
attribute float aLetterIndex; // Which letter for word particles (-1 if none)

// Varyings
varying vec3 vColor;
varying float vAlpha;
varying float vSparkle;
varying float vDepth;

// Hue rotation matrix for temperature shift
mat3 hueRotateMatrix(float angle) {
  float cosA = cos(angle);
  float sinA = sin(angle);
  return mat3(
    0.213 + cosA * 0.787 - sinA * 0.213, 0.213 - cosA * 0.213 + sinA * 0.143, 0.213 - cosA * 0.213 - sinA * 0.787,
    0.715 - cosA * 0.715 - sinA * 0.715, 0.715 + cosA * 0.285 + sinA * 0.140, 0.715 - cosA * 0.715 + sinA * 0.715,
    0.072 - cosA * 0.072 + sinA * 0.928, 0.072 - cosA * 0.072 - sinA * 0.283, 0.072 + cosA * 0.928 + sinA * 0.072
  );
}

void main() {
  // Sample textures
  vec4 posData = texture2D(tPosition, aReference);
  vec4 velData = texture2D(tVelocity, aReference);
  vec4 colorData = texture2D(tColor, aReference);

  vec3 position = posData.xyz;
  float particleType = posData.w;
  float spawnTime = velData.w;
  vec3 baseColor = colorData.rgb;

  // Transform position
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Calculate depth for size attenuation
  vDepth = -mvPosition.z;
  float distanceAttenuation = 1.0 / max(vDepth * 0.5, 1.0);

  // Base size with slight variation based on type
  float size = uBaseSize;

  // User particles (type 1-5) are slightly larger
  if (particleType > 0.5 && particleType < 5.5) {
    size *= 1.3;
  }

  // Word-recruited particles (type 6) are brighter but same size
  if (particleType > 5.5) {
    size *= 1.2;
  }

  // Phase-specific size modulation
  float sizeModulation = 1.0;
  if (uPhaseType == 0) {
    // Inhale: particles slightly smaller as they contract
    sizeModulation = 1.0 - uEasedProgress * 0.1;
  } else if (uPhaseType == 2) {
    // Exhale: particles slightly larger as they expand
    sizeModulation = 1.0 + uEasedProgress * 0.1;
  }

  // Spark effect for newly spawned particles
  float sparkIntensity = 0.0;
  if (spawnTime > 0.0) {
    float timeSinceSpawn = uTime - spawnTime;
    sparkIntensity = exp(-timeSinceSpawn * 3.0);
    size *= (1.0 + sparkIntensity * 2.0);
  }
  vSparkle = sparkIntensity;

  gl_PointSize = size * sizeModulation * distanceAttenuation * uPixelRatio;

  // Color processing
  vec3 color = baseColor;

  // Apply temperature shift (hue rotation)
  float angle = uTemperatureShift * 0.17; // ~10 degrees max
  color = hueRotateMatrix(angle) * color;

  // Spark brightness boost
  color *= (1.0 + sparkIntensity * 1.5);

  // Scaffold particles (type 0) are dimmer
  float alpha = 1.0;
  if (particleType < 0.5) {
    alpha = 0.5; // Scaffold opacity
  }

  // User particles full opacity
  // Word-recruited particles have slight glow
  if (particleType > 5.5) {
    color *= 1.3;
  }

  vColor = color;
  vAlpha = alpha;
}
`;
