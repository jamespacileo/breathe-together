/**
 * GPGPU Simulation Fragment Shader
 * Handles 50K particle physics with breathing mechanics per spec
 */

export const simulationFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uPositions;
uniform sampler2D uOriginalPositions;
uniform sampler2D uRecruitmentTargets;
uniform float uTime;
uniform float uEasedProgress;
uniform int uPhaseType; // 0=inhale, 1=hold-full, 2=exhale, 3=hold-empty
uniform float uSphereRadius;
uniform float uBreathDepth;

// Word formation
uniform float uWordActive;
uniform float uWordProgress;
uniform float uLetterCount;

// 3D Simplex noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise3D(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;

  vec4 posData = texture2D(uPositions, uv);
  vec4 origData = texture2D(uOriginalPositions, uv);
  vec4 recruitData = texture2D(uRecruitmentTargets, uv);

  vec3 pos = posData.xyz;
  float type = posData.w;
  vec3 origPos = origData.xyz;
  float phase = origData.w;

  // Check if inactive particle
  if (type < -0.5) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, -1.0);
    return;
  }

  vec3 direction = normalize(origPos);
  float currentRadius = length(pos);

  // Calculate target radius based on breath phase
  float targetRadius;

  if (uPhaseType == 0) {
    // INHALE: contract toward center
    targetRadius = uSphereRadius - uBreathDepth * uEasedProgress;
  } else if (uPhaseType == 1) {
    // HOLD FULL: stay contracted with gentle drift
    targetRadius = uSphereRadius - uBreathDepth;
    pos += vec3(
      snoise3D(pos * 2.0 + uTime * 0.3),
      snoise3D(pos * 2.0 + uTime * 0.3 + 100.0),
      snoise3D(pos * 2.0 + uTime * 0.3 + 200.0)
    ) * 0.002;
  } else if (uPhaseType == 2) {
    // EXHALE: expand outward
    float startRadius = uSphereRadius - uBreathDepth;
    targetRadius = startRadius + uBreathDepth * uEasedProgress;
  } else {
    // HOLD EMPTY: stay expanded with gentle drift
    targetRadius = uSphereRadius;
    pos += vec3(
      snoise3D(pos * 2.0 + uTime * 0.2),
      snoise3D(pos * 2.0 + uTime * 0.2 + 100.0),
      snoise3D(pos * 2.0 + uTime * 0.2 + 200.0)
    ) * 0.003;
  }

  // Scaffold particles (type 0): damped response for organic feel
  float damping = (type < 0.5) ? 0.7 : 1.0;
  targetRadius = mix(currentRadius, targetRadius, damping);

  vec3 targetPos = direction * targetRadius;

  // Check if this particle is recruited for word formation
  float letterIndex = recruitData.w;
  bool isRecruited = letterIndex >= 0.0 && uWordActive > 0.5;

  if (isRecruited) {
    // Calculate letter reveal progress
    float letterRevealPoint = letterIndex / uLetterCount;
    float letterProgress = smoothstep(
      letterRevealPoint - 0.1,
      letterRevealPoint,
      uWordProgress
    );

    // Interpolate from sphere position to letter position
    vec3 letterTarget = recruitData.xyz;
    targetPos = mix(targetPos, letterTarget, letterProgress);

    // Mark as word-recruited type
    type = 6.0;
  }

  // Spring interpolation toward target
  float springStrength = 0.06;
  vec3 newPos = mix(pos, targetPos, springStrength);

  gl_FragColor = vec4(newPos, type);
}
`;

export const simulationVertexShader = /* glsl */ `
precision highp float;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
