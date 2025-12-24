import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { EnhancedBreathData } from './GPGPUScene';

// GLSL Shaders - refined with master craftsman attention to subtle, felt-not-seen details
const simulationVertexShader = `
void main() {
  gl_Position = vec4(position, 1.0);
}
`;

const simulationFragmentShader = `
precision highp float;

uniform sampler2D uPositions;
uniform sampler2D uOriginalPositions;
uniform float uTime;
uniform float uBreathPhase;
uniform float uExpandedRadius;
uniform float uContractedRadius;
uniform int uPhaseType; // 0=inhale, 1=hold-in, 2=exhale, 3=hold-out

// === NEW SUBTLE EFFECT UNIFORMS ===
uniform float uAnticipation;      // Pre-transition gathering (0-1)
uniform float uOvershoot;         // Post-transition settling (0-1)
uniform float uDiaphragmDirection; // -1 down (inhale), 1 up (exhale), 0 hold
uniform float uCrystallization;   // Hold phase stillness (0-1)
uniform float uBreathWave;        // Radial wave intensity (0-1)
uniform vec2 uViewOffset;         // Micro-saccade parallax
uniform float uPhaseTransitionBlend; // 0-1, smooths parameter changes at phase boundaries

// Simple smooth noise
float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 p) {
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

// === CURL NOISE for coherent organic flow ===
// Creates streams like smoke or water - particles move together
vec3 curlNoise(vec3 p) {
  float e = 0.1;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);

  float n = noise(p);
  float ndx = noise(p + dx);
  float ndy = noise(p + dy);
  float ndz = noise(p + dz);

  // Curl = cross product of gradient
  vec3 curl;
  curl.x = (noise(p + dy) - noise(p - dy)) - (noise(p + dz) - noise(p - dz));
  curl.y = (noise(p + dz) - noise(p - dz)) - (noise(p + dx) - noise(p - dx));
  curl.z = (noise(p + dx) - noise(p - dx)) - (noise(p + dy) - noise(p - dy));

  return normalize(curl + 0.001) * 0.5;
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
  vec3 dir = origDist > 0.001 ? normalize(origPos) : vec3(0.0, 1.0, 0.0);

  // Target radius - smooth interpolation between expanded and contracted
  float targetRadius = mix(uExpandedRadius, uContractedRadius, uBreathPhase);

  // Slight variation per particle for organic feel
  float radiusVariation = 0.9 + (origDist / 20.0) * 0.2;
  float particleTargetRadius = targetRadius * radiusVariation;

  // Calculate base orbital position
  vec3 targetPos = dir * particleTargetRadius;

  // === PHASE-SPECIFIC BEHAVIORS with SMOOTH TRANSITIONS ===
  //
  // To avoid jarring changes at phase boundaries, we:
  // 1. Define target values for current phase
  // 2. Use a "transitional" baseline that's a gentle average
  // 3. Blend from baseline to target using uPhaseTransitionBlend
  // This means at the start of each phase (blend=0), parameters are closer
  // to neutral values, then smoothly ramp to phase-specific values.

  float baseOrbitSpeed = 0.15 + phase * 0.05;

  // Baseline (transitional) values - neutral middle ground
  float baselineOrbitMult = 0.85;
  float baselineDisplacement = 0.2;
  float baselineBob = 0.1;
  float baselineSpring = 0.055;
  float baselineSpiral = 0.0;
  float radiusModifier = 0.0;

  // Target values for current phase
  float targetOrbitMult = 1.0;
  float targetDisplacement = 0.2;
  float targetBob = 0.1;
  float targetSpring = 0.06;
  float targetSpiral = 0.0;

  if (uPhaseType == 0) {
    // INHALE: Particles spiral inward with faster orbit, gathering energy
    targetOrbitMult = 1.4;
    targetDisplacement = 0.15;
    targetBob = 0.08;
    targetSpring = 0.08;
    targetSpiral = 0.3;
  } else if (uPhaseType == 1) {
    // HOLD-IN: Calm settling, minimal motion, gentle pulsing
    targetOrbitMult = 0.6;
    targetDisplacement = 0.05;
    targetBob = 0.03;
    targetSpring = 0.04;
    // Gentle pulse effect
    float pulse = sin(uTime * 2.0) * 0.02;
    radiusModifier = pulse;
  } else if (uPhaseType == 2) {
    // EXHALE: Particles drift outward gracefully, releasing
    targetOrbitMult = 0.9;
    targetDisplacement = 0.35;
    targetBob = 0.15;
    targetSpring = 0.05;
    targetSpiral = -0.2;
  } else {
    // HOLD-OUT: Peaceful floating, dreamy drift
    targetOrbitMult = 0.5;
    targetDisplacement = 0.25;
    targetBob = 0.12;
    targetSpring = 0.04;
    // Wandering effect
    float wander = noise(origPos * 0.05 + uTime * 0.1) * 0.3;
    radiusModifier = wander * 0.05;
  }

  // Smooth blend from baseline to target values
  // At phase start (blend=0): use mostly baseline values
  // As phase progresses (blend→1): use full target values
  float blend = uPhaseTransitionBlend;
  float orbitSpeedMultiplier = mix(baselineOrbitMult, targetOrbitMult, blend);
  float displacementStrength = mix(baselineDisplacement, targetDisplacement, blend);
  float bobAmount = mix(baselineBob, targetBob, blend);
  float springStrength = mix(baselineSpring, targetSpring, blend);
  float spiralStrength = mix(baselineSpiral, targetSpiral, blend);

  // Apply radius modifier (pulse/wander effects) with blend
  particleTargetRadius *= (1.0 + radiusModifier * blend);

  // === CRYSTALLIZATION: Reduce motion during holds ===
  float crystalFactor = 1.0 - uCrystallization * 0.8;
  displacementStrength *= crystalFactor;
  bobAmount *= crystalFactor;
  orbitSpeedMultiplier *= (1.0 - uCrystallization * 0.5);

  // Apply orbital rotation with phase-specific speed
  float orbit = uTime * baseOrbitSpeed * orbitSpeedMultiplier;
  float cosOrbit = cos(orbit);
  float sinOrbit = sin(orbit);

  // Rotate around Y axis
  targetPos = vec3(
    targetPos.x * cosOrbit + targetPos.z * sinOrbit,
    targetPos.y,
    -targetPos.x * sinOrbit + targetPos.z * cosOrbit
  );

  // Apply spiral effect (inward during inhale, outward during exhale)
  if (abs(spiralStrength) > 0.01) {
    float spiralAngle = uTime * spiralStrength * (0.5 + phase * 0.5);
    targetPos.y += sin(spiralAngle + phase * 6.28) * spiralStrength * 0.5;
  }

  // === COHERENT CURL NOISE (organic flow) ===
  // Particles move in streams, not randomly
  vec3 flowField = curlNoise(origPos * 0.08 + uTime * 0.03);
  float flowStrength = displacementStrength * 0.6 * crystalFactor;
  targetPos += flowField * flowStrength;

  // Additional noise-based displacement (reduced, curl does more work now)
  float noiseVal = noise(origPos * 0.1 + uTime * 0.05 + phase) - 0.5;
  targetPos += dir * noiseVal * displacementStrength * 0.4;

  // === DIAPHRAGMATIC VERTICAL DRIFT ===
  // Subtle downward drift during inhale, upward during exhale
  float diaphragmStrength = 0.4 * (1.0 - uCrystallization);
  targetPos.y += uDiaphragmDirection * diaphragmStrength * (0.5 + phase * 0.5);

  // Vertical bobbing with phase-specific amplitude
  targetPos.y += sin(uTime * 0.4 + phase * 6.28) * bobAmount;

  // === ANTICIPATION: Gather before transition ===
  // Particles slightly contract toward center before phase change
  if (uAnticipation > 0.01) {
    float anticipationPull = uAnticipation * 0.15;
    targetPos *= (1.0 - anticipationPull);
    // Slight upward gathering
    targetPos.y += uAnticipation * 0.3;
  }

  // === OVERSHOOT: Settle after transition ===
  // Particles overshoot then return (spring bounce)
  if (uOvershoot > 0.01) {
    float overshootAmount = uOvershoot * 0.1;
    // Slight outward bounce
    targetPos *= (1.0 + overshootAmount);
  }

  // === BREATH WAVE: Radial ripple visualization ===
  if (uBreathWave > 0.01) {
    float waveRadius = uBreathWave * 25.0;
    float distFromCenter = length(targetPos);
    float waveDelta = abs(distFromCenter - waveRadius);
    float waveInfluence = exp(-waveDelta * 0.5) * uBreathWave;
    // Push particles outward in the wave
    targetPos += dir * waveInfluence * 2.0;
  }

  // === MICRO-SACCADE PARALLAX ===
  // Very subtle shift based on view/mouse position
  targetPos.x += uViewOffset.x * (10.0 + origDist * 0.3);
  targetPos.y += uViewOffset.y * (10.0 + origDist * 0.3);

  // Smooth spring interpolation with phase-specific strength
  vec3 velocity = (targetPos - pos) * springStrength;
  vec3 newPos = pos + velocity;

  // === SUB-PIXEL JITTER REMOVAL during holds ===
  // Snap to sub-pixel grid when crystallized for true stillness
  if (uCrystallization > 0.8) {
    float snapStrength = (uCrystallization - 0.8) * 5.0; // 0-1 over last 20%
    float gridSize = 0.02; // Sub-pixel precision
    vec3 snapped = floor(newPos / gridSize + 0.5) * gridSize;
    newPos = mix(newPos, snapped, snapStrength * 0.5);
  }

  // Store velocity magnitude in w for trail effect
  float velocityMag = length(velocity);

  gl_FragColor = vec4(newPos, velocityMag);
}
`;

const particleVertexShader = `
precision highp float;

uniform sampler2D uPositions;
uniform float uTime;
uniform float uBreathPhase;
uniform float uPixelRatio;
uniform int uPhaseType; // 0=inhale, 1=hold-in, 2=exhale, 3=hold-out

// === NEW SUBTLE EFFECT UNIFORMS ===
uniform float uColorTemperature;  // -1 cool to 1 warm
uniform float uCrystallization;   // Hold stillness factor
uniform float uBreathWave;        // Radial wave intensity
uniform float uBirthProgress;     // Global entry animation (0-1)

attribute vec2 aReference;
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;
attribute float aBirthDelay;      // Per-particle birth stagger

varying vec3 vColor;
varying vec3 vPosition;
varying float vDistance;
varying float vPhase;
varying float vBreathPhase;
varying float vSparkle;
varying float vVelocity;
varying float vDepthFactor;
varying float vPhaseType;
varying float vBirthAlpha;

void main() {
  vec4 posData = texture2D(uPositions, aReference);
  vec3 pos = posData.xyz;
  float velocity = posData.w;

  vPosition = pos;
  vPhase = aPhase;
  vBreathPhase = uBreathPhase;
  vVelocity = velocity;
  vPhaseType = float(uPhaseType);

  // === ENTRY BIRTH ANIMATION ===
  // Particles emerge from center during first few seconds
  // Staggered by aBirthDelay for wave-like appearance
  float birthTime = uBirthProgress - aBirthDelay * 0.5;
  float birthAlpha = smoothstep(0.0, 0.3, birthTime);
  vBirthAlpha = birthAlpha;

  // During birth, particles emerge from center
  if (birthAlpha < 1.0) {
    float emergeFactor = birthAlpha;
    // Slight inward pull for particles still being born
    pos = mix(pos * 0.3, pos, emergeFactor);
  }

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vDistance = -mvPosition.z;

  // === DEPTH-BASED SIZE VARIATION ===
  float depthFromCamera = vDistance;
  float minDepth = 30.0;
  float maxDepth = 70.0;
  vDepthFactor = 1.0 - smoothstep(minDepth, maxDepth, depthFromCamera);

  float distanceAttenuation = 180.0 / max(vDistance, 1.0);
  float depthSizeMultiplier = 0.6 + vDepthFactor * 0.5;
  float baseSize = aSize * 0.4 * distanceAttenuation * depthSizeMultiplier;

  // === PHASE-SPECIFIC SIZE PULSING ===
  float sizePulse = 1.0;
  if (uPhaseType == 0) {
    sizePulse = 1.0 - uBreathPhase * 0.1;
  } else if (uPhaseType == 1) {
    // During hold, pulsing is reduced by crystallization
    float pulseAmount = 0.06 * (1.0 - uCrystallization * 0.7);
    sizePulse = 1.0 + sin(uTime * 2.5 + aPhase * 6.28) * pulseAmount;
  } else if (uPhaseType == 2) {
    sizePulse = 1.0 + (1.0 - uBreathPhase) * 0.15;
  } else {
    float pulseAmount = 0.04 * (1.0 - uCrystallization * 0.7);
    sizePulse = 1.05 + sin(uTime * 1.5 + aPhase * 6.28) * pulseAmount;
  }
  baseSize *= sizePulse;

  // === TRAIL EFFECT ===
  float trailStretch = 1.0 + velocity * 5.0;
  baseSize *= min(trailStretch, 1.3);

  // === SPARKLE ===
  // Reduced during crystallization (holds should be calm)
  float sparkleIntensity = 1.0 - uCrystallization * 0.6;
  float sparkleTime = uTime * 5.0 + aPhase * 100.0;
  float sparkle1 = pow(max(0.0, sin(sparkleTime)), 12.0);
  float sparkle2 = pow(max(0.0, sin(sparkleTime * 1.7 + 1.0)), 12.0);
  float sparkle3 = pow(max(0.0, sin(sparkleTime * 2.3 + 2.0)), 12.0);
  float sparkle = max(sparkle1, max(sparkle2, sparkle3)) * sparkleIntensity;
  vSparkle = sparkle;

  baseSize *= (1.0 + sparkle * 0.5);

  // Birth animation: particles start smaller
  baseSize *= birthAlpha;

  gl_PointSize = baseSize * uPixelRatio;
  gl_Position = projectionMatrix * mvPosition;

  // === COLOR with TEMPERATURE SHIFTING ===
  vec3 color = aColor;

  // Saturation boost
  vec3 gray = vec3(dot(color, vec3(0.299, 0.587, 0.114)));
  color = mix(gray, color, 1.4);

  // Temperature shift based on breath phase
  // Cool (cyan/blue) during inhale, warm (magenta/pink) during exhale
  vec3 coolTint = vec3(-0.05, 0.02, 0.08);   // Shift toward cyan
  vec3 warmTint = vec3(0.08, 0.0, 0.04);     // Shift toward magenta/pink

  vec3 tempShift = mix(coolTint, warmTint, uColorTemperature * 0.5 + 0.5);
  color += tempShift;

  // During breath wave, particles in the wave get brighter
  if (uBreathWave > 0.01) {
    float distFromCenter = length(pos);
    float waveRadius = uBreathWave * 25.0;
    float waveInfluence = exp(-abs(distFromCenter - waveRadius) * 0.3) * uBreathWave;
    color += vec3(0.1, 0.15, 0.2) * waveInfluence;
  }

  vColor = clamp(color, 0.0, 1.0);
}
`;

const particleFragmentShader = `
precision highp float;

uniform float uTime;
uniform float uBreathPhase;
uniform int uPhaseType;
uniform float uCrystallization;

varying vec3 vColor;
varying vec3 vPosition;
varying float vDistance;
varying float vPhase;
varying float vBreathPhase;
varying float vSparkle;
varying float vVelocity;
varying float vDepthFactor;
varying float vPhaseType;
varying float vBirthAlpha;

void main() {
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);

  // === SHARPER, MORE DEFINED PARTICLE SHAPE ===
  float coreDist = dist * 2.5;
  float alpha = 1.0 - smoothstep(0.6, 1.0, coreDist);

  if (alpha < 0.01) discard;

  // Base color
  vec3 color = vColor;
  int phaseType = int(vPhaseType + 0.5);

  // === SHINY HIGHLIGHT ===
  float coreHighlight = exp(-coreDist * 4.0);
  color *= (1.0 + coreHighlight * 0.8);

  // === SPARKLE/GLIMMER ===
  if (vSparkle > 0.3) {
    float sparkleIntensity = pow((vSparkle - 0.3) / 0.7, 2.0);
    float sparkleCore = exp(-coreDist * 6.0) * sparkleIntensity;
    color += vec3(1.0) * sparkleCore * 0.8;
    color *= (1.0 + sparkleIntensity * 0.4);
  }

  // === PHASE-SPECIFIC BRIGHTNESS ===
  float brightness = 1.0;
  if (phaseType == 0) {
    brightness = 0.85 + vBreathPhase * 0.15;
  } else if (phaseType == 1) {
    // During crystallization, brightness is more stable
    float pulseAmount = 0.05 * (1.0 - uCrystallization * 0.7);
    brightness = 1.0 + sin(uTime * 3.0) * pulseAmount;
  } else if (phaseType == 2) {
    brightness = 1.0 - vBreathPhase * 0.1;
  } else {
    float pulseAmount = 0.03 * (1.0 - uCrystallization * 0.7);
    brightness = 0.9 + sin(uTime * 2.0) * pulseAmount;
  }
  color *= brightness;

  // === DEPTH-BASED BRIGHTNESS ===
  float depthBrightness = 0.8 + vDepthFactor * 0.25;
  color *= depthBrightness;

  // === EDGE RIM ===
  float rimDist = abs(coreDist - 0.7);
  float rim = exp(-rimDist * 8.0) * 0.15;
  color += vColor * rim;

  // === ALPHA ===
  float baseAlpha = 0.8;
  if (phaseType == 0) {
    baseAlpha = 0.7 + vBreathPhase * 0.2;
  } else if (phaseType == 1) {
    baseAlpha = 0.9;
  } else if (phaseType == 2) {
    baseAlpha = 0.85 - vBreathPhase * 0.1;
  } else {
    baseAlpha = 0.75;
  }

  baseAlpha = min(1.0, baseAlpha + vSparkle * 0.2);
  alpha *= baseAlpha;

  // Depth fade
  float depthFade = 0.5 + vDepthFactor * 0.5;
  alpha *= depthFade;

  // Distance fade
  float distanceFade = 1.0 - smoothstep(40.0, 70.0, vDistance);
  alpha *= distanceFade;

  // === BIRTH ANIMATION ALPHA ===
  // Particles fade in during birth
  alpha *= vBirthAlpha;

  gl_FragColor = vec4(color, alpha);
}
`;

// Central sphere shader
const sphereVertexShader = `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const sphereFragmentShader = `
precision highp float;

uniform float uTime;
uniform float uBreathPhase;
uniform int uPhaseType;
uniform float uColorTemperature;
uniform float uCrystallization;
uniform vec3 uColor1;
uniform vec3 uColor2;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  // Fresnel effect for ethereal edge glow
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float fresnel = pow(1.0 - max(0.0, dot(viewDir, vNormal)), 2.5);

  // Gradient based on vertical position
  float gradient = vPosition.y * 0.5 + 0.5;
  vec3 baseColor = mix(uColor1, uColor2, gradient);

  // === PHASE-SPECIFIC HUE SHIFTING ===
  // Inhale: Cool, gathering energy (cyan/blue tint)
  // Hold-in: Stable, present (neutral with slight glow)
  // Exhale: Warm, releasing (magenta/rose tint)
  // Hold-out: Deep, peaceful (deeper blue-purple)

  vec3 inhaleHue = vec3(0.15, 0.35, 0.45);    // Deep teal
  vec3 holdInHue = vec3(0.2, 0.3, 0.4);       // Neutral blue-gray
  vec3 exhaleHue = vec3(0.35, 0.25, 0.4);     // Warm purple-rose
  vec3 holdOutHue = vec3(0.18, 0.22, 0.35);   // Deep peaceful blue

  vec3 phaseColor;
  if (uPhaseType == 0) {
    // Inhale - transition from holdOut to inhale colors
    phaseColor = mix(holdOutHue, inhaleHue, uBreathPhase);
  } else if (uPhaseType == 1) {
    // Hold-in - settle into stable color
    phaseColor = mix(inhaleHue, holdInHue, min(1.0, uCrystallization * 1.5));
  } else if (uPhaseType == 2) {
    // Exhale - transition to warm releasing color
    phaseColor = mix(holdInHue, exhaleHue, 1.0 - uBreathPhase);
  } else {
    // Hold-out - deep peaceful settling
    phaseColor = mix(exhaleHue, holdOutHue, min(1.0, uCrystallization * 1.5));
  }

  // Blend base color with phase color
  baseColor = mix(baseColor, phaseColor, 0.6);

  // Additional temperature tint (from particle system)
  vec3 coolTint = vec3(-0.03, 0.02, 0.06);
  vec3 warmTint = vec3(0.06, 0.0, 0.03);
  vec3 tempShift = mix(coolTint, warmTint, uColorTemperature * 0.5 + 0.5);
  baseColor += tempShift;

  // Edge glow color shifts with phase
  vec3 edgeColor = vec3(0.5, 0.7, 0.85);
  if (uPhaseType == 2) {
    // Warmer edge during exhale
    edgeColor = vec3(0.7, 0.6, 0.8);
  } else if (uPhaseType == 0) {
    // Cooler edge during inhale
    edgeColor = vec3(0.5, 0.75, 0.9);
  }

  vec3 color = mix(baseColor, edgeColor, fresnel * 0.6);

  // Subtle surface shimmer (reduced during crystallization)
  float shimmerStrength = 0.02 * (1.0 - uCrystallization * 0.6);
  float shimmer = sin(vPosition.x * 20.0 + uTime) * sin(vPosition.y * 20.0 + uTime * 1.3) * shimmerStrength;
  color += shimmer;

  // Soft alpha with fresnel - more visible during exhale (expanded)
  float baseAlpha = 0.12;
  if (uPhaseType == 2) {
    // More visible during exhale
    baseAlpha = 0.15 + (1.0 - uBreathPhase) * 0.08;
  } else if (uPhaseType == 0) {
    // Slightly less visible during inhale (contracting)
    baseAlpha = 0.1 + uBreathPhase * 0.05;
  }
  float alpha = baseAlpha + fresnel * 0.3;

  gl_FragColor = vec4(color, alpha);
}
`;

interface GPGPUParticleSystemProps {
	breathData: EnhancedBreathData;
	expandedRadius: number;
	contractedRadius: number;
}

// FBO size - number of particles = size^2
const FBO_SIZE = 56; // ~3136 particles - slightly fewer for better performance
const PARTICLE_COUNT = FBO_SIZE * FBO_SIZE;

export function GPGPUParticleSystem({
	breathData,
	expandedRadius,
	contractedRadius,
}: GPGPUParticleSystemProps) {
	const { gl } = useThree();
	const pointsRef = useRef<THREE.Points>(null);
	const sphereRef = useRef<THREE.Mesh>(null);
	const sphereMaterialRef = useRef<THREE.ShaderMaterial>(null);
	const birthProgressRef = useRef(0); // Tracks entry animation progress

	// More saturated color palette for visible, gem-like particles
	const colorPalette = useMemo(
		() => [
			new THREE.Color(0x4db8cc), // Vibrant teal
			new THREE.Color(0x7ba3d4), // Clear blue
			new THREE.Color(0xb894d4), // Vivid lavender
			new THREE.Color(0xd4a0a0), // Rose pink
			new THREE.Color(0x7dd4b8), // Bright mint
			new THREE.Color(0xd4c490), // Warm gold
			new THREE.Color(0x90d4a8), // Fresh green
			new THREE.Color(0xa0b8e0), // Sky blue
		],
		[],
	);

	// Create GPGPU simulation
	const gpgpu = useMemo(() => {
		const floatType = gl.capabilities.isWebGL2
			? THREE.FloatType
			: gl.extensions.get('OES_texture_float')
				? THREE.FloatType
				: THREE.HalfFloatType;

		const createRenderTarget = () =>
			new THREE.WebGLRenderTarget(FBO_SIZE, FBO_SIZE, {
				minFilter: THREE.NearestFilter,
				magFilter: THREE.NearestFilter,
				format: THREE.RGBAFormat,
				type: floatType,
				depthBuffer: false,
				stencilBuffer: false,
			});

		const positionTargetA = createRenderTarget();
		const positionTargetB = createRenderTarget();

		const positionData = new Float32Array(PARTICLE_COUNT * 4);
		const originalPositionData = new Float32Array(PARTICLE_COUNT * 4);

		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const i4 = i * 4;

			// Spherical shell distribution
			const radius = 10 + Math.random() * 8;
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);

			const x = radius * Math.sin(phi) * Math.cos(theta);
			const y = radius * Math.sin(phi) * Math.sin(theta);
			const z = radius * Math.cos(phi);

			positionData[i4] = x;
			positionData[i4 + 1] = y;
			positionData[i4 + 2] = z;
			positionData[i4 + 3] = Math.random();

			originalPositionData[i4] = x;
			originalPositionData[i4 + 1] = y;
			originalPositionData[i4 + 2] = z;
			originalPositionData[i4 + 3] = Math.random() * Math.PI * 2;
		}

		const positionTexture = new THREE.DataTexture(
			positionData,
			FBO_SIZE,
			FBO_SIZE,
			THREE.RGBAFormat,
			floatType,
		);
		positionTexture.needsUpdate = true;

		const originalPositionTexture = new THREE.DataTexture(
			originalPositionData,
			FBO_SIZE,
			FBO_SIZE,
			THREE.RGBAFormat,
			floatType,
		);
		originalPositionTexture.needsUpdate = true;

		const simulationMaterial = new THREE.ShaderMaterial({
			vertexShader: simulationVertexShader,
			fragmentShader: simulationFragmentShader,
			uniforms: {
				uPositions: { value: positionTexture },
				uOriginalPositions: { value: originalPositionTexture },
				uTime: { value: 0 },
				uBreathPhase: { value: 0 },
				uPhaseType: { value: 0 },
				uExpandedRadius: { value: expandedRadius },
				uContractedRadius: { value: contractedRadius },
				resolution: { value: new THREE.Vector2(FBO_SIZE, FBO_SIZE) },
				// New subtle effect uniforms
				uAnticipation: { value: 0 },
				uOvershoot: { value: 0 },
				uDiaphragmDirection: { value: 0 },
				uCrystallization: { value: 0 },
				uBreathWave: { value: 0 },
				uViewOffset: { value: new THREE.Vector2(0, 0) },
				uPhaseTransitionBlend: { value: 1 },
			},
			defines: {
				resolution: `vec2(${FBO_SIZE}.0, ${FBO_SIZE}.0)`,
			},
		});

		const simulationScene = new THREE.Scene();
		const simulationCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
		const quadGeometry = new THREE.PlaneGeometry(2, 2);
		const quadMesh = new THREE.Mesh(quadGeometry, simulationMaterial);
		simulationScene.add(quadMesh);

		return {
			positionTargetA,
			positionTargetB,
			positionTexture,
			originalPositionTexture,
			simulationMaterial,
			simulationScene,
			simulationCamera,
			currentTarget: 0,
		};
	}, [gl, expandedRadius, contractedRadius]);

	// Create particle geometry
	const { geometry, material } = useMemo(() => {
		const particleGeometry = new THREE.BufferGeometry();

		const references = new Float32Array(PARTICLE_COUNT * 2);
		const sizes = new Float32Array(PARTICLE_COUNT);
		const phases = new Float32Array(PARTICLE_COUNT);
		const colors = new Float32Array(PARTICLE_COUNT * 3);
		const birthDelays = new Float32Array(PARTICLE_COUNT); // NEW: staggered birth

		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const x = (i % FBO_SIZE) / FBO_SIZE;
			const y = Math.floor(i / FBO_SIZE) / FBO_SIZE;

			references[i * 2] = x;
			references[i * 2 + 1] = y;

			sizes[i] = 0.8 + Math.random() * 1.2;
			phases[i] = Math.random();

			// Birth delay: particles closer to center emerge first
			// Creates a wave-like appearance as particles "bloom" outward
			const distFromCenter = Math.sqrt((x - 0.5) ** 2 + (y - 0.5) ** 2);
			birthDelays[i] = distFromCenter * 2.0 + Math.random() * 0.3;

			const color =
				colorPalette[Math.floor(Math.random() * colorPalette.length)];
			colors[i * 3] = color.r;
			colors[i * 3 + 1] = color.g;
			colors[i * 3 + 2] = color.b;
		}

		particleGeometry.setAttribute(
			'aReference',
			new THREE.BufferAttribute(references, 2),
		);
		particleGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
		particleGeometry.setAttribute(
			'aPhase',
			new THREE.BufferAttribute(phases, 1),
		);
		particleGeometry.setAttribute(
			'aColor',
			new THREE.BufferAttribute(colors, 3),
		);
		particleGeometry.setAttribute(
			'aBirthDelay',
			new THREE.BufferAttribute(birthDelays, 1),
		);

		const positions = new Float32Array(PARTICLE_COUNT * 3);
		particleGeometry.setAttribute(
			'position',
			new THREE.BufferAttribute(positions, 3),
		);

		const particleMaterial = new THREE.ShaderMaterial({
			vertexShader: particleVertexShader,
			fragmentShader: particleFragmentShader,
			uniforms: {
				uPositions: { value: gpgpu.positionTexture },
				uTime: { value: 0 },
				uBreathPhase: { value: 0 },
				uPhaseType: { value: 0 },
				uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
				// New subtle effect uniforms
				uColorTemperature: { value: 0 },
				uCrystallization: { value: 0 },
				uBreathWave: { value: 0 },
				uBirthProgress: { value: 0 },
			},
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			depthTest: true,
		});

		return { geometry: particleGeometry, material: particleMaterial };
	}, [gpgpu, colorPalette]);

	// Sphere material
	const sphereMaterial = useMemo(() => {
		return new THREE.ShaderMaterial({
			vertexShader: sphereVertexShader,
			fragmentShader: sphereFragmentShader,
			uniforms: {
				uTime: { value: 0 },
				uBreathPhase: { value: 0 },
				uPhaseType: { value: 0 },
				uColorTemperature: { value: 0 },
				uCrystallization: { value: 0 },
				uColor1: { value: new THREE.Color(0x1a2a3a) },
				uColor2: { value: new THREE.Color(0x2a3a4a) },
			},
			transparent: true,
			side: THREE.FrontSide,
			depthWrite: false,
		});
	}, []);

	// Animation loop
	useFrame((state) => {
		const time = state.clock.elapsedTime;

		// Update birth progress (ramps from 0 to 2 over first 3 seconds)
		// This creates the "blooming" entry animation
		birthProgressRef.current = Math.min(2, time / 1.5);

		// Destructure breath data
		const {
			breathPhase,
			phaseType,
			anticipation,
			overshoot,
			diaphragmDirection,
			colorTemperature,
			crystallization,
			breathWave,
			viewOffset,
			phaseTransitionBlend,
		} = breathData;

		// Update simulation uniforms
		const simUniforms = gpgpu.simulationMaterial.uniforms;
		simUniforms.uTime.value = time;
		simUniforms.uBreathPhase.value = breathPhase;
		simUniforms.uPhaseType.value = phaseType;
		simUniforms.uExpandedRadius.value = expandedRadius;
		simUniforms.uContractedRadius.value = contractedRadius;
		// New subtle effect uniforms
		simUniforms.uAnticipation.value = anticipation;
		simUniforms.uOvershoot.value = overshoot;
		simUniforms.uDiaphragmDirection.value = diaphragmDirection;
		simUniforms.uCrystallization.value = crystallization;
		simUniforms.uBreathWave.value = breathWave;
		simUniforms.uViewOffset.value.set(viewOffset.x, viewOffset.y);
		simUniforms.uPhaseTransitionBlend.value = phaseTransitionBlend;

		const readTarget =
			gpgpu.currentTarget === 0 ? gpgpu.positionTargetA : gpgpu.positionTargetB;
		const writeTarget =
			gpgpu.currentTarget === 0 ? gpgpu.positionTargetB : gpgpu.positionTargetA;

		gpgpu.simulationMaterial.uniforms.uPositions.value =
			gpgpu.currentTarget === 0 && time < 0.1
				? gpgpu.positionTexture
				: readTarget.texture;

		gl.setRenderTarget(writeTarget);
		gl.render(gpgpu.simulationScene, gpgpu.simulationCamera);
		gl.setRenderTarget(null);

		gpgpu.currentTarget = 1 - gpgpu.currentTarget;

		// Update particle material uniforms
		const partUniforms = material.uniforms;
		partUniforms.uPositions.value = writeTarget.texture;
		partUniforms.uTime.value = time;
		partUniforms.uBreathPhase.value = breathPhase;
		partUniforms.uPhaseType.value = phaseType;
		// New subtle effect uniforms
		partUniforms.uColorTemperature.value = colorTemperature;
		partUniforms.uCrystallization.value = crystallization;
		partUniforms.uBreathWave.value = breathWave;
		partUniforms.uBirthProgress.value = birthProgressRef.current;

		// Update sphere with phase-specific colors
		if (sphereMaterialRef.current) {
			const sphereUniforms = sphereMaterialRef.current.uniforms;
			sphereUniforms.uTime.value = time;
			sphereUniforms.uBreathPhase.value = breathPhase;
			sphereUniforms.uPhaseType.value = phaseType;
			sphereUniforms.uColorTemperature.value = colorTemperature;
			sphereUniforms.uCrystallization.value = crystallization;
		}

		// Scale sphere with breathing - MORE expansion on exhale
		// breathPhase: 0 = exhaled (expanded), 1 = inhaled (contracted)
		if (sphereRef.current) {
			// Base contracted size when inhaled
			const minScale = contractedRadius * 0.35;
			// Maximum expanded size when exhaled - significantly larger
			const maxScale = contractedRadius * 0.7;
			// Interpolate: when breathPhase=0 (exhaled) -> maxScale, breathPhase=1 (inhaled) -> minScale
			const sphereScale = minScale + (maxScale - minScale) * (1 - breathPhase);
			sphereRef.current.scale.setScalar(sphereScale);
		}
	});

	return (
		<group>
			{/* Central sphere */}
			<mesh ref={sphereRef}>
				<sphereGeometry args={[1, 48, 48]} />
				<primitive object={sphereMaterial} ref={sphereMaterialRef} />
			</mesh>

			{/* Orbiting particles */}
			<points ref={pointsRef} geometry={geometry} material={material} />
		</group>
	);
}
