/**
 * GPGPU Position Compute Shader
 * Updates particle positions based on velocity and applies spring physics
 */
import { COMMON_UNIFORMS, NOISE_FUNCTIONS } from './noise.glsl';

export const POSITION_COMPUTE_SHADER = /* glsl */ `
${COMMON_UNIFORMS}

// texturePosition and textureVelocity are auto-injected by GPUComputationRenderer
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

  // Determine target life based on active count
  float targetLife = particleIndex < uActiveCount ? 1.0 : 0.0;

  // Smooth fade in/out
  particleLife += (targetLife - particleLife) * 0.02;

  // Skip inactive particles
  if (particleLife < 0.01) {
    gl_FragColor = vec4(originalPos, 0.0);
    return;
  }

  // Calculate target position based on breath
  // When breathValue = 1 (inhaled), particles move inward
  // When breathValue = 0 (exhaled), particles at original position
  float targetRadius = uTargetRadius;
  float currentDist = length(originalPos);
  float targetDist = mix(uExpandedRadius, targetRadius, uBreathValue);
  float scaleFactor = targetDist / max(currentDist, 0.001) / uExpandedRadius * currentDist;

  // Normalize and scale
  vec3 targetPos = normalize(originalPos) * scaleFactor;

  // Add subtle rotation during inhale (twist effect)
  float rotAngle = uBreathValue * 0.26;
  float cosA = cos(rotAngle);
  float sinA = sin(rotAngle);
  targetPos = vec3(
    targetPos.x * cosA - targetPos.z * sinA,
    targetPos.y,
    targetPos.x * sinA + targetPos.z * cosA
  );

  // Add curl noise for organic movement
  vec3 curl = curlNoise(position * 0.5, uTime * 0.3) * 0.015;

  // Add subtle breathing-synchronized wave
  float breathWave = sin(uTime * 0.5 + length(originalPos) * 2.0) * uBreathValue * 0.02;
  targetPos += normalize(originalPos) * breathWave;

  // Spring physics toward target
  vec3 toTarget = targetPos - position;
  float springForce = particleStiffness * 0.3;
  vec3 springAccel = toTarget * springForce;

  // Update velocity with spring force and curl noise
  velocity += springAccel + curl;

  // Damping
  float damping = 0.92;
  velocity *= damping;

  // Update position
  position += velocity * uDeltaTime * 60.0;

  // Output new position (w = particle life)
  gl_FragColor = vec4(position, particleLife);
}
`;
