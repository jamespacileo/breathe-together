/**
 * Starfield Fragment Shader
 * Soft, dim stars for background depth
 */
export const starFragmentShader = /* glsl */ `
varying float vBrightness;
varying float vPhase;

void main() {
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);

  // Soft star
  float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
  alpha *= alpha;

  // Dim star color
  vec3 color = vec3(0.7, 0.75, 0.85);
  color *= vBrightness * 0.4;

  alpha *= 0.3;

  if (alpha < 0.01) discard;

  gl_FragColor = vec4(color, alpha);
}
`;
