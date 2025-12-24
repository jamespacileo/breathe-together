// Simple pass-through vertex shader for simulation FBO
void main() {
  gl_Position = vec4(position, 1.0);
}
