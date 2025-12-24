/**
 * Particle Render Shaders
 * Vertex: handles point size, position, color from type
 * Fragment: soft glow circles per spec
 */

export const renderVertexShader = /* glsl */ `
precision highp float;

uniform sampler2D uPositions;
uniform float uTime;
uniform int uPhaseType;
uniform float uTemperatureShift; // -1 cool to +1 warm
uniform float uPixelRatio;
uniform vec3 uPalette[6]; // scaffold + 5 user colors

// Spark effect uniforms
uniform float uSparkActive;
uniform float uSparkTime;

attribute vec2 aReference;
attribute float aSize;
attribute float aPhase;
attribute float aSpawnTime;

varying vec3 vColor;
varying float vAlpha;
varying float vSparkle;

// Hue rotation matrix for temperature shift
vec3 applyTemperature(vec3 color, float shift) {
  float angle = shift * 0.17; // ~10° max rotation
  float cosA = cos(angle);
  float sinA = sin(angle);

  mat3 hueRotate = mat3(
    0.213 + cosA*0.787 - sinA*0.213, 0.213 - cosA*0.213 + sinA*0.143, 0.213 - cosA*0.213 - sinA*0.787,
    0.715 - cosA*0.715 - sinA*0.715, 0.715 + cosA*0.285 + sinA*0.140, 0.715 - cosA*0.715 + sinA*0.715,
    0.072 - cosA*0.072 + sinA*0.928, 0.072 - cosA*0.072 - sinA*0.283, 0.072 + cosA*0.928 + sinA*0.072
  );

  return hueRotate * color;
}

void main() {
  vec4 posData = texture2D(uPositions, aReference);
  vec3 pos = posData.xyz;
  float type = posData.w;

  // Skip inactive particles
  if (type < -0.5) {
    gl_Position = vec4(0.0);
    gl_PointSize = 0.0;
    return;
  }

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Distance attenuation for point size
  float distanceAttenuation = 300.0 / length(mvPosition.xyz);
  float baseSize = aSize * distanceAttenuation;

  // Spark effect for newly spawned user particles
  float sparkIntensity = 0.0;
  if (uSparkActive > 0.5 && type > 0.5 && type < 5.5) {
    float timeSinceSpawn = uTime - aSpawnTime;
    if (timeSinceSpawn < 1.0) {
      sparkIntensity = exp(-timeSinceSpawn * 3.0);
      baseSize *= (1.0 + sparkIntensity * 2.0);
    }
  }
  vSparkle = sparkIntensity;

  gl_PointSize = baseSize * uPixelRatio;

  // Get base color from type
  int typeIndex = int(clamp(type, 0.0, 5.0));
  vec3 baseColor = uPalette[typeIndex];

  // Word-recruited particles (type 6) use scaffold color but brighter
  if (type > 5.5) {
    baseColor = uPalette[0] * 1.5;
  }

  // Apply temperature shift
  vec3 color = applyTemperature(baseColor, uTemperatureShift);

  // Boost brightness for spark effect
  color *= (1.0 + sparkIntensity * 1.5);

  vColor = color;

  // Alpha based on particle type
  // Scaffold (0): fainter, user (1-5): brighter
  vAlpha = type < 0.5 ? 0.4 : 0.85;

  // Word-recruited slightly brighter
  if (type > 5.5) {
    vAlpha = 0.7;
  }
}
`;

export const renderFragmentShader = /* glsl */ `
precision highp float;

varying vec3 vColor;
varying float vAlpha;
varying float vSparkle;

void main() {
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);

  // Soft falloff per spec
  float alpha = 1.0 - smoothstep(0.3, 0.5, dist);

  if (alpha < 0.01) discard;

  // Optional sparkle highlight at center
  float sparkle = 1.0 + 0.5 * smoothstep(0.1, 0.0, dist);

  // Boost during spark effect
  sparkle *= (1.0 + vSparkle * 2.0);

  vec3 color = vColor * sparkle;

  gl_FragColor = vec4(color, alpha * vAlpha);
}
`;
