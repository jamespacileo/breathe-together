precision highp float;

uniform sampler2D uPositions;
uniform float uTime;
uniform float uBreathPhase;
uniform float uPixelRatio;
uniform vec2 uResolution;

attribute vec2 aReference;
attribute float aSize;
attribute float aPhase;

varying vec3 vPosition;
varying float vDistance;
varying float vSize;
varying float vPhase;
varying float vBreathPhase;

void main() {
  vec4 posData = texture2D(uPositions, aReference);
  vec3 pos = posData.xyz;

  vPosition = pos;
  vPhase = aPhase;
  vBreathPhase = uBreathPhase;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vDistance = -mvPosition.z;

  // Dynamic size based on breath phase and distance
  float breathSize = 1.0 + uBreathPhase * 0.5;
  float distanceAttenuation = 300.0 / vDistance;
  float baseSize = aSize * breathSize * distanceAttenuation;

  // Add subtle pulsing
  float pulse = 1.0 + sin(uTime * 2.0 + aPhase * 6.28) * 0.1;

  vSize = baseSize * pulse;
  gl_PointSize = vSize * uPixelRatio;
  gl_Position = projectionMatrix * mvPosition;
}
