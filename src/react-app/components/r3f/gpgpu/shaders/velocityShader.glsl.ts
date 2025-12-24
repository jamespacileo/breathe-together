/**
 * GPGPU Velocity Compute Shader
 * Computes velocities with spring physics, curl noise, and breathing modulation
 */
import { COMMON_UNIFORMS, NOISE_FUNCTIONS } from './noise.glsl';

export const VELOCITY_COMPUTE_SHADER = /* glsl */ `
${COMMON_UNIFORMS}

uniform sampler2D texturePosition;
uniform sampler2D textureVelocity;
uniform sampler2D textureOriginal;
uniform float uActiveCount;

${NOISE_FUNCTIONS}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;

  // Calculate particle index from UV
  float particleIndex = floor(uv.x * resolution.x) + floor(uv.y * resolution.y) * resolution.x;

  vec4 posData = texture2D(texturePosition, uv);
  vec4 velData = texture2D(textureVelocity, uv);
  vec4 origData = texture2D(textureOriginal, uv);

  vec3 position = posData.xyz;
  vec3 velocity = velData.xyz;
  vec3 originalPos = origData.xyz;
  float particleLife = posData.w;
  float particleStiffness = origData.w;

  // Skip inactive particles
  if (particleLife < 0.01 || particleIndex >= uActiveCount) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    return;
  }

  // Calculate target position based on breath
  float currentDist = length(originalPos);
  float targetDist = mix(uExpandedRadius, uTargetRadius, uBreathValue);
  float scaleFactor = targetDist / max(currentDist, 0.001) / uExpandedRadius * currentDist;

  vec3 targetPos = normalize(originalPos) * scaleFactor;

  // Rotation
  float rotAngle = uBreathValue * 0.26;
  float cosA = cos(rotAngle);
  float sinA = sin(rotAngle);
  targetPos = vec3(
    targetPos.x * cosA - targetPos.z * sinA,
    targetPos.y,
    targetPos.x * sinA + targetPos.z * cosA
  );

  // Spring force
  vec3 toTarget = targetPos - position;
  float springForce = particleStiffness * 0.3;
  vec3 springAccel = toTarget * springForce;

  // Multi-frequency curl noise for complex organic motion
  vec3 curl1 = curlNoise(position * 0.3, uTime * 0.2) * 0.012;
  vec3 curl2 = curlNoise(position * 0.8 + 100.0, uTime * 0.4) * 0.006;
  vec3 curl3 = curlNoise(position * 1.5 + 200.0, uTime * 0.1) * 0.003;
  vec3 totalCurl = curl1 + curl2 + curl3;

  // Breathing pulse - particles pulse outward/inward with breath
  float breathPulse = sin(uTime * 0.8) * 0.003;
  vec3 breathForce = normalize(position) * breathPulse * (1.0 - uBreathValue);

  // Phase-specific behavior
  vec3 phaseForce = vec3(0.0);

  // During hold phases, add subtle oscillation
  if (uPhaseType > 0.5 && uPhaseType < 1.5) {
    // Hold-in: particles hover with gentle shimmer
    float shimmer = sin(uTime * 3.0 + length(position) * 5.0) * 0.002;
    phaseForce = normalize(position) * shimmer;
  } else if (uPhaseType > 2.5) {
    // Hold-out: particles drift slightly outward
    float drift = sin(uTime * 2.0 + originalPos.y * 3.0) * 0.001;
    phaseForce = normalize(position) * drift;
  }

  // Update velocity
  velocity += springAccel + totalCurl + breathForce + phaseForce;

  // Damping with slight variation based on distance
  float damping = 0.92 - length(position) * 0.01;
  damping = clamp(damping, 0.85, 0.95);
  velocity *= damping;

  // Velocity limit
  float maxVel = 0.5;
  float velMag = length(velocity);
  if (velMag > maxVel) {
    velocity = velocity / velMag * maxVel;
  }

  gl_FragColor = vec4(velocity, velData.w);
}
`;
