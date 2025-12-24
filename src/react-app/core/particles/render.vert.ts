/**
 * Particle Render Vertex Shader
 * Handles point size, position, and varying setup
 */

export const renderVertexShader = /* glsl */ `
precision highp float;

uniform sampler2D tPosition;
uniform sampler2D tColor;
uniform float uTime;
uniform float uPixelRatio;
uniform float uSpawnTime;
uniform float uTemperatureShift;

attribute vec2 aReference;
attribute float aSize;
attribute float aRandomSeed;

varying vec3 vColor;
varying float vAlpha;
varying float vSparkle;

// Color palette uniform (18 floats = 6 colors × 3 components)
uniform vec3 uPalette[6];

void main() {
  vec4 posData = texture2D(tPosition, aReference);
  vec3 pos = posData.xyz;
  float type = posData.w;

  // Get color from palette based on type
  int colorIndex = int(type);
  vColor = uPalette[colorIndex];

  // Apply temperature shift (cool to warm)
  float angle = uTemperatureShift * 0.17; // ~10° max rotation
  float cosA = cos(angle);
  float sinA = sin(angle);

  // Simplified hue rotation
  vec3 tempColor = vColor;
  tempColor.r = vColor.r * (0.213 + cosA * 0.787) + vColor.g * (0.715 - cosA * 0.715) + vColor.b * (0.072 - cosA * 0.072);
  tempColor.g = vColor.r * (0.213 - cosA * 0.213) + vColor.g * (0.715 + cosA * 0.285) + vColor.b * (0.072 - cosA * 0.072);
  tempColor.b = vColor.r * (0.213 - cosA * 0.213) + vColor.g * (0.715 - cosA * 0.715) + vColor.b * (0.072 + cosA * 0.928);
  vColor = tempColor;

  // Spawn/spark effect
  float timeSinceSpawn = uTime - uSpawnTime;
  float sparkIntensity = exp(-timeSinceSpawn * 3.0);

  // Sparkle calculation
  float sparkleTime = uTime * 5.0 + aRandomSeed * 100.0;
  float sparkle1 = pow(max(0.0, sin(sparkleTime)), 12.0);
  float sparkle2 = pow(max(0.0, sin(sparkleTime * 1.7 + 1.0)), 12.0);
  vSparkle = max(sparkle1, sparkle2) + sparkIntensity * 0.5;

  // Position transform
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  float distanceAttenuation = 200.0 / max(-mvPosition.z, 1.0);

  // Size with sparkle boost
  float size = aSize * distanceAttenuation;
  size *= (1.0 + sparkIntensity * 2.0);
  size *= (1.0 + vSparkle * 0.3);

  // Alpha based on type (user particles brighter than scaffold)
  vAlpha = type > 0.5 ? 0.9 : 0.4;
  vAlpha *= (1.0 + sparkIntensity * 1.5);

  gl_PointSize = size * uPixelRatio;
  gl_Position = projectionMatrix * mvPosition;
}
`;
