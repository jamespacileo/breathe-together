/**
 * GPU Particle Simulation Shader
 * Handles position updates, breathing animation, and word formation
 */

export const simulationShader = /* glsl */ `
precision highp float;

// Textures
uniform sampler2D tPosition;    // Current positions (xyz) + type (w)
uniform sampler2D tVelocity;    // Velocity (xyz) + spawnTime (w)
uniform sampler2D tWordTargets; // Word target positions when active

// Breath state
uniform float uEasedProgress;   // 0-1 within current phase (eased)
uniform int uPhaseType;         // 0=inhale, 1=hold-full, 2=exhale, 3=hold-empty
uniform float uSphereRadius;    // Base radius (1.0)
uniform float uBreathDepth;     // Contraction/expansion amount (0.3)
uniform float uTime;

// Word formation
uniform float uWordProgress;    // 0-1 for word reveal animation
uniform float uWordActive;      // 1.0 when word is being shown
uniform float uLetterCount;     // Number of letters in current word

// Simplex noise for organic motion
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
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

vec3 snoise3D(vec3 p) {
  return vec3(
    snoise(p),
    snoise(p + vec3(31.416, 47.853, 12.793)),
    snoise(p + vec3(93.719, 27.183, 61.428))
  );
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;

  vec4 posData = texture2D(tPosition, uv);
  vec4 velData = texture2D(tVelocity, uv);

  vec3 position = posData.xyz;
  float particleType = posData.w;
  vec3 velocity = velData.xyz;
  float spawnTime = velData.w;

  // Get direction from center
  vec3 direction = normalize(position);
  float currentRadius = length(position);

  // Calculate target radius based on breath phase
  float targetRadius;

  if (uPhaseType == 0) {
    // Inhale: contract toward center
    targetRadius = uSphereRadius - uBreathDepth * uEasedProgress;
  } else if (uPhaseType == 1) {
    // Hold full: stay contracted with gentle drift
    targetRadius = uSphereRadius - uBreathDepth;
    position += snoise3D(position * 2.0 + uTime * 0.5) * 0.002;
  } else if (uPhaseType == 2) {
    // Exhale: expand outward
    float contractedRadius = uSphereRadius - uBreathDepth;
    targetRadius = contractedRadius + uBreathDepth * uEasedProgress;
  } else {
    // Hold empty: stay expanded with gentle drift
    targetRadius = uSphereRadius;
    position += snoise3D(position * 2.0 + uTime * 0.3) * 0.003;
  }

  // Scaffold particles have damped response for organic movement
  float damping = (particleType < 0.5) ? 0.7 : 1.0;
  targetRadius = mix(currentRadius, targetRadius, damping);

  // Calculate target position on sphere
  vec3 targetPos = direction * targetRadius;

  // Add subtle organic motion
  float noiseScale = 0.5;
  vec3 noise = snoise3D(position * noiseScale + uTime * 0.1) * 0.02;
  targetPos += noise;

  // Word formation override
  if (uWordActive > 0.5 && particleType > 5.5) {
    // This particle is recruited for word formation
    vec4 wordTarget = texture2D(tWordTargets, uv);

    if (wordTarget.w > 0.5) {
      // Has a valid word target
      float letterIndex = wordTarget.w;
      float letterRevealPoint = letterIndex / max(uLetterCount, 1.0);
      float letterProgress = smoothstep(letterRevealPoint - 0.1, letterRevealPoint, uWordProgress);

      // Interpolate from sphere position to letter position
      targetPos = mix(targetPos, wordTarget.xyz, letterProgress);
    }
  }

  // Spring physics for smooth movement
  float springStrength = 0.08;
  velocity = (targetPos - position) * springStrength;
  vec3 newPos = position + velocity;

  // Spark effect for newly spawned user particles
  if (spawnTime > 0.0) {
    float timeSinceSpawn = uTime - spawnTime;
    float sparkIntensity = exp(-timeSinceSpawn * 3.0);
    // Add outward burst on spawn
    newPos += direction * sparkIntensity * 0.1;
  }

  gl_FragColor = vec4(newPos, particleType);
}
`;

export const velocityUpdateShader = /* glsl */ `
precision highp float;

uniform sampler2D tPosition;
uniform sampler2D tVelocity;
uniform float uTime;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;

  vec4 posData = texture2D(tPosition, uv);
  vec4 velData = texture2D(tVelocity, uv);

  // Velocity is computed in main simulation
  // This just passes through spawn time and clears expired sparks
  float spawnTime = velData.w;

  // Clear spawn time after spark has faded (3 seconds)
  if (uTime - spawnTime > 3.0) {
    spawnTime = 0.0;
  }

  gl_FragColor = vec4(velData.xyz, spawnTime);
}
`;
