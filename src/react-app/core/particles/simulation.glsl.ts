/**
 * GPGPU Simulation Shader for 50K Particle Breathing Sphere
 * Particles contract inward on inhale, expand outward on exhale
 */

export const simulationVertexShader = /* glsl */ `
precision highp float;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const simulationFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D tPosition;
uniform sampler2D tOriginalPosition;
uniform float uTime;
uniform float uEasedProgress;
uniform int uPhaseType; // 0=inhale, 1=hold-full, 2=exhale, 3=hold-empty
uniform float uSphereRadius;
uniform float uBreathDepth;

varying vec2 vUv;

// Simple smooth noise for hold drift
float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise3D(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
        mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
        mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
    f.z
  );
}

// Simplex-like noise for organic drift
vec3 snoise3D(vec3 p) {
  return vec3(
    noise3D(p) - 0.5,
    noise3D(p + vec3(31.416, 47.853, 12.793)) - 0.5,
    noise3D(p + vec3(93.127, 27.541, 65.894)) - 0.5
  ) * 2.0;
}

void main() {
  vec4 posData = texture2D(tPosition, vUv);
  vec4 origData = texture2D(tOriginalPosition, vUv);

  vec3 position = posData.xyz;
  float type = posData.w;

  vec3 originalDir = normalize(origData.xyz);
  float currentRadius = length(position);

  // Calculate target radius based on breath phase
  float targetRadius;
  vec3 driftOffset = vec3(0.0);

  if (uPhaseType == 0) {
    // INHALE: contract toward center
    targetRadius = uSphereRadius - uBreathDepth * uEasedProgress;
  } else if (uPhaseType == 1) {
    // HOLD FULL: stay contracted + gentle drift
    targetRadius = uSphereRadius - uBreathDepth;
    driftOffset = snoise3D(position * 2.0 + uTime * 0.5) * 0.002;
  } else if (uPhaseType == 2) {
    // EXHALE: expand outward
    targetRadius = (uSphereRadius - uBreathDepth) + uBreathDepth * uEasedProgress;
  } else {
    // HOLD EMPTY: stay expanded + gentle drift
    targetRadius = uSphereRadius;
    driftOffset = snoise3D(position * 2.0 + uTime * 0.5) * 0.003;
  }

  // Scaffold particles have slightly damped response
  float damping = (type == 0.0) ? 0.85 : 1.0;
  float smoothedRadius = mix(currentRadius, targetRadius, damping * 0.15);

  // Calculate new position
  vec3 newPosition = originalDir * smoothedRadius + driftOffset;

  // Add subtle orbital rotation
  float orbitSpeed = 0.02;
  float orbitAngle = uTime * orbitSpeed;
  float cosA = cos(orbitAngle);
  float sinA = sin(orbitAngle);
  newPosition = vec3(
    newPosition.x * cosA - newPosition.z * sinA,
    newPosition.y,
    newPosition.x * sinA + newPosition.z * cosA
  );

  gl_FragColor = vec4(newPosition, type);
}
`;
