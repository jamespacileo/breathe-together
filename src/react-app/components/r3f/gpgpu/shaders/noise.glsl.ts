/**
 * GLSL Noise functions for shaders
 * Includes simplex noise, curl noise, and other utilities
 */

export const NOISE_FUNCTIONS = /* glsl */ `
// Simplex 3D Noise by Ian McEwan, Ashima Arts
vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  // Permutations
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  // Gradients: 7x7 points over a square, mapped onto an octahedron
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

  // Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// Curl noise - divergence-free noise for fluid-like motion
vec3 curlNoise(vec3 p, float time) {
  const float e = 0.1;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);

  float n = snoise(p + time * 0.1);
  float nx = snoise(p + dx + time * 0.1);
  float ny = snoise(p + dy + time * 0.1);
  float nz = snoise(p + dz + time * 0.1);

  // Approximate gradient
  vec3 grad = vec3(nx - n, ny - n, nz - n) / e;

  // Cross product with another noise field for curl
  float n2 = snoise(p * 0.5 + time * 0.05);
  float n2x = snoise((p + dx) * 0.5 + time * 0.05);
  float n2y = snoise((p + dy) * 0.5 + time * 0.05);
  float n2z = snoise((p + dz) * 0.5 + time * 0.05);
  vec3 grad2 = vec3(n2x - n2, n2y - n2, n2z - n2) / e;

  return cross(grad, grad2);
}

// Fractal Brownian Motion
float fbm(vec3 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for(int i = 0; i < 6; i++) {
    if(i >= octaves) break;
    value += amplitude * snoise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }

  return value;
}

// Voronoi-like cellular noise
float cellular(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);

  float minDist = 1.0;

  for(int x = -1; x <= 1; x++) {
    for(int y = -1; y <= 1; y++) {
      for(int z = -1; z <= 1; z++) {
        vec3 neighbor = vec3(float(x), float(y), float(z));
        vec3 point = vec3(
          snoise(i + neighbor),
          snoise(i + neighbor + 100.0),
          snoise(i + neighbor + 200.0)
        ) * 0.5 + 0.5;
        vec3 diff = neighbor + point - f;
        float dist = length(diff);
        minDist = min(minDist, dist);
      }
    }
  }

  return minDist;
}
`;

export const COMMON_UNIFORMS = /* glsl */ `
uniform float uTime;
uniform float uDeltaTime;
uniform float uBreathValue;
uniform float uPhaseType;
uniform float uTargetRadius;
uniform float uExpandedRadius;
uniform vec2 resolution;
`;
