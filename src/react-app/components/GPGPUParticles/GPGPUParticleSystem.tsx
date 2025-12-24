import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

// GLSL Shaders - refined for subtle, elegant motion with phase-specific behaviors
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

  // === PHASE-SPECIFIC BEHAVIORS ===

  // Base orbit speed varies by phase
  float baseOrbitSpeed = 0.15 + phase * 0.05;
  float orbitSpeedMultiplier = 1.0;
  float displacementStrength = 0.2;
  float bobAmount = 0.1;
  float springStrength = 0.06;
  float spiralStrength = 0.0;

  if (uPhaseType == 0) {
    // INHALE: Particles spiral inward with faster orbit, gathering energy
    orbitSpeedMultiplier = 1.4;
    displacementStrength = 0.15;
    bobAmount = 0.08;
    springStrength = 0.08; // Faster response
    spiralStrength = 0.3;  // Inward spiral
  } else if (uPhaseType == 1) {
    // HOLD-IN: Calm settling, minimal motion, gentle pulsing
    orbitSpeedMultiplier = 0.6;
    displacementStrength = 0.05; // Very subtle
    bobAmount = 0.03;
    springStrength = 0.04; // Slower, settled
    // Add gentle pulsing effect
    float pulse = sin(uTime * 2.0) * 0.02;
    particleTargetRadius *= (1.0 + pulse);
  } else if (uPhaseType == 2) {
    // EXHALE: Particles drift outward gracefully, releasing
    orbitSpeedMultiplier = 0.9;
    displacementStrength = 0.35; // More free movement
    bobAmount = 0.15;
    springStrength = 0.05; // Slower, floaty
    spiralStrength = -0.2; // Outward drift
  } else {
    // HOLD-OUT: Peaceful floating, dreamy drift
    orbitSpeedMultiplier = 0.5;
    displacementStrength = 0.25;
    bobAmount = 0.12;
    springStrength = 0.04;
    // Gentle wandering motion
    float wander = noise(origPos * 0.05 + uTime * 0.1) * 0.3;
    particleTargetRadius *= (1.0 + wander * 0.05);
  }

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
    float cosSp = cos(spiralAngle);
    float sinSp = sin(spiralAngle);
    // Add vertical spiral component
    targetPos.y += sin(spiralAngle + phase * 6.28) * spiralStrength * 0.5;
  }

  // Noise-based displacement with phase-specific strength
  float noiseVal = noise(origPos * 0.1 + uTime * 0.05 + phase) - 0.5;
  targetPos += dir * noiseVal * displacementStrength;

  // Vertical bobbing with phase-specific amplitude
  targetPos.y += sin(uTime * 0.4 + phase * 6.28) * bobAmount;

  // Smooth spring interpolation with phase-specific strength
  vec3 velocity = (targetPos - pos) * springStrength;
  vec3 newPos = pos + velocity;

  // Store velocity magnitude in w for trail effect (approximated)
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

attribute vec2 aReference;
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;

varying vec3 vColor;
varying vec3 vPosition;
varying float vDistance;
varying float vPhase;
varying float vBreathPhase;
varying float vSparkle;
varying float vVelocity;
varying float vDepthFactor;
varying float vPhaseType;

void main() {
  vec4 posData = texture2D(uPositions, aReference);
  vec3 pos = posData.xyz;
  float velocity = posData.w; // Velocity magnitude from simulation

  vPosition = pos;
  vPhase = aPhase;
  vBreathPhase = uBreathPhase;
  vVelocity = velocity;
  vPhaseType = float(uPhaseType);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vDistance = -mvPosition.z;

  // === ENHANCED DEPTH-BASED SIZE VARIATION ===
  // Particles closer to camera are larger and more prominent
  float depthFromCamera = vDistance;
  float minDepth = 30.0;
  float maxDepth = 70.0;
  vDepthFactor = 1.0 - smoothstep(minDepth, maxDepth, depthFromCamera);

  // Enhanced distance attenuation with stronger depth effect
  float distanceAttenuation = 280.0 / max(vDistance, 1.0);

  // Front particles get size boost, back particles get reduced
  float depthSizeMultiplier = 0.7 + vDepthFactor * 0.6; // 0.7 to 1.3 range

  float baseSize = aSize * 0.7 * distanceAttenuation * depthSizeMultiplier;

  // === PHASE-SPECIFIC SIZE PULSING ===
  float sizePulse = 1.0;
  if (uPhaseType == 0) {
    // Inhale: particles slightly shrink as they gather
    sizePulse = 1.0 - uBreathPhase * 0.15;
  } else if (uPhaseType == 1) {
    // Hold-in: gentle size pulsing
    sizePulse = 1.0 + sin(uTime * 2.5 + aPhase * 6.28) * 0.08;
  } else if (uPhaseType == 2) {
    // Exhale: particles grow as they release
    sizePulse = 1.0 + (1.0 - uBreathPhase) * 0.2;
  } else {
    // Hold-out: relaxed, slightly larger
    sizePulse = 1.1 + sin(uTime * 1.5 + aPhase * 6.28) * 0.05;
  }
  baseSize *= sizePulse;

  // === TRAIL EFFECT: Stretch particles based on velocity ===
  // Higher velocity = slightly larger particles (motion blur simulation)
  float trailStretch = 1.0 + velocity * 8.0; // Velocity-based size increase
  baseSize *= min(trailStretch, 1.5); // Cap at 1.5x

  // Very subtle sparkle - random bright moments (increased frequency)
  float sparkleTime = uTime * 4.0 + aPhase * 100.0;
  float sparkle = pow(max(0.0, sin(sparkleTime) * sin(sparkleTime * 1.7) * sin(sparkleTime * 2.3)), 6.0);
  vSparkle = sparkle;

  // Slight size boost during sparkle
  baseSize *= (1.0 + sparkle * 0.35);

  gl_PointSize = baseSize * uPixelRatio;
  gl_Position = projectionMatrix * mvPosition;

  // === COLOR TEMPERATURE SHIFT ===
  // Apply warm/cool shift to base color
  vec3 warmShift = vec3(0.08, 0.02, -0.05); // Warmer: more red/yellow, less blue
  vec3 coolShift = vec3(-0.03, 0.02, 0.06); // Cooler: more blue, less red

  // Inhale = cooler (energizing), Exhale = warmer (relaxing)
  float warmth = 0.0;
  if (uPhaseType == 0) {
    warmth = -0.5; // Cool during inhale
  } else if (uPhaseType == 1) {
    warmth = 0.0; // Neutral during hold-in
  } else if (uPhaseType == 2) {
    warmth = 0.7; // Warm during exhale
  } else {
    warmth = 0.3; // Slightly warm during hold-out (relaxed)
  }

  vec3 colorShift = warmth > 0.0 ? warmShift * warmth : coolShift * abs(warmth);
  vColor = aColor + colorShift;
  vColor = clamp(vColor, 0.0, 1.0);
}
`;

const particleFragmentShader = `
precision highp float;

uniform float uTime;
uniform float uBreathPhase;
uniform int uPhaseType;

varying vec3 vColor;
varying vec3 vPosition;
varying float vDistance;
varying float vPhase;
varying float vBreathPhase;
varying float vSparkle;
varying float vVelocity;
varying float vDepthFactor;
varying float vPhaseType;

void main() {
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);

  // === TRAIL EFFECT: Elongate particles based on velocity ===
  // Create motion blur by stretching the circle into an ellipse
  float trailAmount = min(vVelocity * 5.0, 0.4);
  // Stretch vertically for upward/downward motion feel
  vec2 stretchedCoord = center;
  stretchedCoord.y *= (1.0 - trailAmount * 0.3);
  float stretchedDist = length(stretchedCoord);

  // Sharp circle with soft edge (using stretched coordinates for trail)
  float alpha = 1.0 - smoothstep(0.3, 0.5, stretchedDist);

  if (alpha < 0.01) discard;

  // Base color (already shifted by temperature in vertex shader)
  vec3 color = vColor;

  // === PHASE-SPECIFIC BRIGHTNESS ===
  float brightness = 0.7;
  int phaseType = int(vPhaseType + 0.5);

  if (phaseType == 0) {
    // Inhale: gradually brighten as energy gathers
    brightness = 0.65 + vBreathPhase * 0.25;
  } else if (phaseType == 1) {
    // Hold-in: peak brightness with gentle pulse
    brightness = 0.85 + sin(uTime * 3.0) * 0.05;
  } else if (phaseType == 2) {
    // Exhale: warm glow that softens
    brightness = 0.9 - vBreathPhase * 0.15;
  } else {
    // Hold-out: soft, relaxed brightness
    brightness = 0.7 + sin(uTime * 2.0) * 0.03;
  }

  color *= brightness;

  // === ENHANCED DEPTH-BASED BRIGHTNESS ===
  // Front particles are brighter, back particles are dimmer
  float depthBrightness = 0.7 + vDepthFactor * 0.4; // 0.7 to 1.1 range
  color *= depthBrightness;

  // === MOTION TRAIL GLOW ===
  // Add subtle glow trail during movement
  if (vVelocity > 0.01) {
    float trailGlow = vVelocity * 3.0;
    // Add warm trail color during exhale, cool during inhale
    vec3 trailColor = phaseType == 2 ? vec3(1.0, 0.9, 0.8) : vec3(0.8, 0.9, 1.0);
    color = mix(color, trailColor, trailGlow * 0.15);
  }

  // Very subtle sparkle glint - slightly more noticeable
  if (vSparkle > 0.4) {
    float sparkleIntensity = (vSparkle - 0.4) * 1.67;
    vec3 sparkleColor = vec3(1.0, 0.98, 0.95);
    // Warmer sparkle during exhale
    if (phaseType == 2 || phaseType == 3) {
      sparkleColor = vec3(1.0, 0.95, 0.88);
    }
    color = mix(color, sparkleColor, sparkleIntensity * 0.5);
  }

  // Soft center glow (warmer during exhale)
  float centerBright = exp(-dist * 6.0) * 0.25;
  vec3 glowColor = phaseType == 2 ? vec3(1.0, 0.92, 0.85) : vec3(1.0, 0.95, 0.9);
  color += glowColor * centerBright;

  // === ALPHA MODULATION ===
  // Base alpha varies by phase
  float baseAlpha = 0.55;
  if (phaseType == 0) {
    baseAlpha = 0.5 + vBreathPhase * 0.25; // Become more solid during inhale
  } else if (phaseType == 1) {
    baseAlpha = 0.75; // Most solid during hold-in
  } else if (phaseType == 2) {
    baseAlpha = 0.7 - vBreathPhase * 0.15; // Fade during exhale
  } else {
    baseAlpha = 0.55; // Soft during hold-out
  }
  alpha *= baseAlpha;

  // === ENHANCED DEPTH FADE ===
  // Stronger fade for back particles, creating depth
  float depthFade = 0.3 + vDepthFactor * 0.7; // Back particles more transparent
  alpha *= depthFade;

  // Standard distance fade
  float distanceFade = 1.0 - smoothstep(35.0, 70.0, vDistance);
  alpha *= distanceFade;

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

  // Subtle breathing color shift
  baseColor = mix(baseColor, uColor2, uBreathPhase * 0.2);

  // Edge glow
  vec3 edgeColor = vec3(0.6, 0.8, 0.9);
  vec3 color = mix(baseColor, edgeColor, fresnel * 0.6);

  // Very subtle surface shimmer
  float shimmer = sin(vPosition.x * 20.0 + uTime) * sin(vPosition.y * 20.0 + uTime * 1.3) * 0.02;
  color += shimmer;

  // Soft alpha with fresnel
  float alpha = 0.15 + fresnel * 0.25 + uBreathPhase * 0.1;

  gl_FragColor = vec4(color, alpha);
}
`;

interface GPGPUParticleSystemProps {
	breathPhase: number;
	phaseType: number;
	expandedRadius: number;
	contractedRadius: number;
}

// FBO size - number of particles = size^2
const FBO_SIZE = 56; // ~3136 particles - slightly fewer for better performance
const PARTICLE_COUNT = FBO_SIZE * FBO_SIZE;

export function GPGPUParticleSystem({
	breathPhase,
	phaseType,
	expandedRadius,
	contractedRadius,
}: GPGPUParticleSystemProps) {
	const { gl } = useThree();
	const pointsRef = useRef<THREE.Points>(null);
	const sphereRef = useRef<THREE.Mesh>(null);
	const sphereMaterialRef = useRef<THREE.ShaderMaterial>(null);

	// Softer, more cohesive color palette
	const colorPalette = useMemo(
		() => [
			new THREE.Color(0x7ec8d9), // Soft teal
			new THREE.Color(0xb8d4e3), // Pale blue
			new THREE.Color(0xd4c4e3), // Soft lavender
			new THREE.Color(0xe3d4d4), // Blush
			new THREE.Color(0xc9e4de), // Mint
			new THREE.Color(0xe8dfd8), // Cream
			new THREE.Color(0xd1e3dd), // Sage
			new THREE.Color(0xdde3f0), // Periwinkle
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

		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const x = (i % FBO_SIZE) / FBO_SIZE;
			const y = Math.floor(i / FBO_SIZE) / FBO_SIZE;

			references[i * 2] = x;
			references[i * 2 + 1] = y;

			sizes[i] = 0.8 + Math.random() * 1.2;
			phases[i] = Math.random();

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

		// Update simulation
		gpgpu.simulationMaterial.uniforms.uTime.value = time;
		gpgpu.simulationMaterial.uniforms.uBreathPhase.value = breathPhase;
		gpgpu.simulationMaterial.uniforms.uPhaseType.value = phaseType;
		gpgpu.simulationMaterial.uniforms.uExpandedRadius.value = expandedRadius;
		gpgpu.simulationMaterial.uniforms.uContractedRadius.value =
			contractedRadius;

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

		// Update particle material
		material.uniforms.uPositions.value = writeTarget.texture;
		material.uniforms.uTime.value = time;
		material.uniforms.uBreathPhase.value = breathPhase;
		material.uniforms.uPhaseType.value = phaseType;

		// Update sphere
		if (sphereMaterialRef.current) {
			sphereMaterialRef.current.uniforms.uTime.value = time;
			sphereMaterialRef.current.uniforms.uBreathPhase.value = breathPhase;
		}

		// Scale sphere with breathing
		if (sphereRef.current) {
			const sphereScale =
				contractedRadius * 0.4 +
				(expandedRadius - contractedRadius) * 0.2 * (1 - breathPhase);
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
