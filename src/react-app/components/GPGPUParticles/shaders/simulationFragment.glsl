precision highp float;

uniform sampler2D uPositions;
uniform sampler2D uOriginalPositions;
uniform float uTime;
uniform float uDeltaTime;
uniform float uBreathPhase;
uniform float uPhaseType;
uniform float uExpandedRadius;
uniform float uContractedRadius;

varying vec2 vUv;

// Simplex 3D noise
vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Curl noise for fluid-like motion
vec3 curlNoise(vec3 p, float t) {
  float eps = 0.01;

  float n1 = snoise(vec3(p.x, p.y + eps, p.z) + t);
  float n2 = snoise(vec3(p.x, p.y - eps, p.z) + t);
  float n3 = snoise(vec3(p.x, p.y, p.z + eps) + t);
  float n4 = snoise(vec3(p.x, p.y, p.z - eps) + t);
  float n5 = snoise(vec3(p.x + eps, p.y, p.z) + t);
  float n6 = snoise(vec3(p.x - eps, p.y, p.z) + t);

  float x = (n1 - n2 - n3 + n4) / (2.0 * eps);
  float y = (n3 - n4 - n5 + n6) / (2.0 * eps);
  float z = (n5 - n6 - n1 + n2) / (2.0 * eps);

  return vec3(x, y, z);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;

  vec4 posData = texture2D(uPositions, uv);
  vec4 origData = texture2D(uOriginalPositions, uv);

  vec3 pos = posData.xyz;
  vec3 origPos = origData.xyz;
  float phase = origData.w;

  // Calculate original direction and distance
  float origDist = length(origPos);
  vec3 dir = normalize(origPos);

  // Target radius based on breath phase (inverted: 1 = compressed, 0 = expanded)
  float targetRadius = mix(uExpandedRadius, uContractedRadius, uBreathPhase);

  // Add variation based on original position
  float radiusVariation = (origDist / 20.0) * 0.3;
  float particleTargetRadius = targetRadius * (0.85 + radiusVariation);

  // Calculate target position
  vec3 targetPos = dir * particleTargetRadius;

  // Add curl noise for fluid motion
  float noiseScale = 0.08;
  float noiseTime = uTime * 0.15;
  vec3 curlOffset = curlNoise(origPos * noiseScale + phase, noiseTime);

  // Noise strength decreases when compressed
  float noiseStrength = mix(3.0, 0.5, uBreathPhase);
  targetPos += curlOffset * noiseStrength;

  // Add orbital motion
  float orbitSpeed = 0.2 + phase * 0.1;
  float orbit = uTime * orbitSpeed;
  mat3 rotY = mat3(
    cos(orbit * 0.3), 0.0, sin(orbit * 0.3),
    0.0, 1.0, 0.0,
    -sin(orbit * 0.3), 0.0, cos(orbit * 0.3)
  );
  targetPos = rotY * targetPos;

  // Add gentle floating
  float floatAmount = mix(0.8, 0.2, uBreathPhase);
  targetPos.x += sin(uTime * 0.3 + phase) * floatAmount;
  targetPos.y += cos(uTime * 0.25 + phase * 1.3) * floatAmount;
  targetPos.z += sin(uTime * 0.2 + phase * 0.7) * floatAmount * 0.5;

  // Smooth interpolation to target (spring-like behavior)
  float springStrength = 0.08;
  vec3 velocity = (targetPos - pos) * springStrength;

  // Add subtle turbulence
  vec3 turb = curlNoise(pos * 0.2, uTime * 0.3) * 0.1 * (1.0 - uBreathPhase);
  velocity += turb;

  // Update position
  vec3 newPos = pos + velocity;

  gl_FragColor = vec4(newPos, posData.w);
}
