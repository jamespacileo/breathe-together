import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

// GLSL Shaders inline for Vite compatibility
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
uniform float uDeltaTime;
uniform float uBreathPhase;
uniform float uPhaseType;
uniform float uExpandedRadius;
uniform float uContractedRadius;

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
  vec3 dir = origDist > 0.001 ? normalize(origPos) : vec3(0.0, 1.0, 0.0);

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
  float cosOrbit = cos(orbit * 0.3);
  float sinOrbit = sin(orbit * 0.3);
  vec3 rotatedTarget = vec3(
    targetPos.x * cosOrbit + targetPos.z * sinOrbit,
    targetPos.y,
    -targetPos.x * sinOrbit + targetPos.z * cosOrbit
  );
  targetPos = rotatedTarget;

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
`;

const particleVertexShader = `
precision highp float;

uniform sampler2D uPositions;
uniform float uTime;
uniform float uBreathPhase;
uniform float uPixelRatio;

attribute vec2 aReference;
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;

varying vec3 vColor;
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
  vColor = aColor;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vDistance = -mvPosition.z;

  // Dynamic size based on breath phase and distance
  float breathSize = 1.0 + uBreathPhase * 0.5;
  float distanceAttenuation = 300.0 / max(vDistance, 1.0);
  float baseSize = aSize * breathSize * distanceAttenuation;

  // Add subtle pulsing
  float pulse = 1.0 + sin(uTime * 2.0 + aPhase * 6.28) * 0.1;

  vSize = baseSize * pulse;
  gl_PointSize = vSize * uPixelRatio;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const particleFragmentShader = `
precision highp float;

uniform float uTime;
uniform float uBreathPhase;

varying vec3 vColor;
varying vec3 vPosition;
varying float vDistance;
varying float vSize;
varying float vPhase;
varying float vBreathPhase;

// RGB to HSL conversion
vec3 rgb2hsl(vec3 c) {
  float maxC = max(max(c.r, c.g), c.b);
  float minC = min(min(c.r, c.g), c.b);
  float l = (maxC + minC) / 2.0;
  float s = 0.0;
  float h = 0.0;

  if (maxC != minC) {
    float d = maxC - minC;
    s = l > 0.5 ? d / (2.0 - maxC - minC) : d / (maxC + minC);

    if (maxC == c.r) {
      h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
    } else if (maxC == c.g) {
      h = (c.b - c.r) / d + 2.0;
    } else {
      h = (c.r - c.g) / d + 4.0;
    }
    h /= 6.0;
  }

  return vec3(h, s, l);
}

// HSL to RGB conversion
float hue2rgb(float p, float q, float t) {
  if (t < 0.0) t += 1.0;
  if (t > 1.0) t -= 1.0;
  if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
  if (t < 1.0/2.0) return q;
  if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
  return p;
}

vec3 hsl2rgb(vec3 hsl) {
  float h = hsl.x;
  float s = hsl.y;
  float l = hsl.z;

  if (s == 0.0) {
    return vec3(l);
  }

  float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
  float p = 2.0 * l - q;

  return vec3(
    hue2rgb(p, q, h + 1.0/3.0),
    hue2rgb(p, q, h),
    hue2rgb(p, q, h - 1.0/3.0)
  );
}

void main() {
  // Distance from center of point
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);

  // Soft circle with glow
  float alpha = 1.0 - smoothstep(0.0, 0.5, dist);

  // Add glow halo
  float glow = exp(-dist * 4.0) * 0.5;
  alpha += glow;

  if (alpha < 0.01) discard;

  // Use the assigned color
  vec3 baseColor = vColor;

  // Convert to HSL for breathing-based adjustments
  vec3 hsl = rgb2hsl(baseColor);

  // Hue shift based on breath phase
  float hueShift = (vBreathPhase - 0.5) * 0.05;
  hsl.x = mod(hsl.x + hueShift + 1.0, 1.0);

  // Saturation boost during inhale
  hsl.y = clamp(hsl.y + vBreathPhase * 0.15, 0.0, 1.0);

  // Lightness boost during inhale
  hsl.z = clamp(hsl.z + vBreathPhase * 0.1, 0.0, 1.0);

  vec3 color = hsl2rgb(hsl);

  // Add brightness based on breath phase
  float brightness = 1.0 + vBreathPhase * 0.4;
  color *= brightness;

  // Add subtle color variation based on time
  float colorPulse = sin(uTime + vPhase * 6.28) * 0.08;
  color += colorPulse * vec3(0.1, 0.05, 0.12);

  // Core glow (brighter center)
  float coreGlow = exp(-dist * 8.0) * vBreathPhase * 0.6;
  color += vec3(1.0, 0.95, 0.9) * coreGlow;

  // Fade based on breath phase (more opaque when inhaled)
  float baseAlpha = 0.5 + vBreathPhase * 0.4;
  alpha *= baseAlpha;

  // Distance fade
  float distanceFade = 1.0 - smoothstep(30.0, 80.0, vDistance);
  alpha *= distanceFade;

  gl_FragColor = vec4(color, alpha);
}
`;

interface GPGPUParticleSystemProps {
	breathPhase: number;
	phaseType: number;
	expandedRadius: number;
	contractedRadius: number;
}

// FBO size (texture resolution) - number of particles = size^2
const FBO_SIZE = 64; // 4096 particles
const PARTICLE_COUNT = FBO_SIZE * FBO_SIZE;

export function GPGPUParticleSystem({
	breathPhase,
	phaseType,
	expandedRadius,
	contractedRadius,
}: GPGPUParticleSystemProps) {
	const { gl } = useThree();
	const pointsRef = useRef<THREE.Points>(null);

	// Color palette
	const colorPalette = useMemo(
		() => [
			new THREE.Color(0x4ecdc4), // Teal
			new THREE.Color(0xff6b6b), // Coral
			new THREE.Color(0xffe66d), // Yellow
			new THREE.Color(0x95e1d3), // Mint
			new THREE.Color(0xf38181), // Salmon
			new THREE.Color(0xaa96da), // Lavender
			new THREE.Color(0xfcbad3), // Pink
			new THREE.Color(0xa8d8ea), // Sky blue
			new THREE.Color(0xf9f871), // Lemon
			new THREE.Color(0x88d8b0), // Seafoam
			new THREE.Color(0xffaaa5), // Peach
			new THREE.Color(0xb5e2fa), // Light blue
			new THREE.Color(0xdcedc2), // Pale green
			new THREE.Color(0xffd3b5), // Apricot
			new THREE.Color(0xc9b1ff), // Lilac
		],
		[],
	);

	// Create GPGPU simulation textures and materials
	const gpgpu = useMemo(() => {
		// Check for float texture support
		const floatType = gl.capabilities.isWebGL2
			? THREE.FloatType
			: gl.extensions.get('OES_texture_float')
				? THREE.FloatType
				: THREE.HalfFloatType;

		// Create render targets for ping-pong simulation
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

		// Create initial position data texture
		const positionData = new Float32Array(PARTICLE_COUNT * 4);
		const originalPositionData = new Float32Array(PARTICLE_COUNT * 4);

		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const i4 = i * 4;

			// Random spherical distribution
			const radius = 8 + Math.random() * 12;
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);

			const x = radius * Math.sin(phi) * Math.cos(theta);
			const y = radius * Math.sin(phi) * Math.sin(theta);
			const z = radius * Math.cos(phi);

			positionData[i4] = x;
			positionData[i4 + 1] = y;
			positionData[i4 + 2] = z;
			positionData[i4 + 3] = Math.random(); // Phase

			originalPositionData[i4] = x;
			originalPositionData[i4 + 1] = y;
			originalPositionData[i4 + 2] = z;
			originalPositionData[i4 + 3] = Math.random() * Math.PI * 2; // Phase offset
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

		// Simulation material
		const simulationMaterial = new THREE.ShaderMaterial({
			vertexShader: simulationVertexShader,
			fragmentShader: simulationFragmentShader,
			uniforms: {
				uPositions: { value: positionTexture },
				uOriginalPositions: { value: originalPositionTexture },
				uTime: { value: 0 },
				uDeltaTime: { value: 0.016 },
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

		// Fullscreen quad for simulation
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

	// Create particle geometry with attributes
	const { geometry, material } = useMemo(() => {
		const particleGeometry = new THREE.BufferGeometry();

		// Reference coordinates (UV for texture lookup)
		const references = new Float32Array(PARTICLE_COUNT * 2);
		const sizes = new Float32Array(PARTICLE_COUNT);
		const phases = new Float32Array(PARTICLE_COUNT);
		const colors = new Float32Array(PARTICLE_COUNT * 3);

		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const x = (i % FBO_SIZE) / FBO_SIZE;
			const y = Math.floor(i / FBO_SIZE) / FBO_SIZE;

			references[i * 2] = x;
			references[i * 2 + 1] = y;

			sizes[i] = 0.5 + Math.random() * 1.5;
			phases[i] = Math.random();

			// Assign random color from palette
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

		// Dummy position attribute (required by Three.js)
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
				uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
			},
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			depthTest: true,
		});

		return { geometry: particleGeometry, material: particleMaterial };
	}, [gpgpu, colorPalette]);

	// Animation loop
	useFrame((state, delta) => {
		const time = state.clock.elapsedTime;

		// Update simulation uniforms
		gpgpu.simulationMaterial.uniforms.uTime.value = time;
		gpgpu.simulationMaterial.uniforms.uDeltaTime.value = delta;
		gpgpu.simulationMaterial.uniforms.uBreathPhase.value = breathPhase;
		gpgpu.simulationMaterial.uniforms.uPhaseType.value = phaseType;
		gpgpu.simulationMaterial.uniforms.uExpandedRadius.value = expandedRadius;
		gpgpu.simulationMaterial.uniforms.uContractedRadius.value =
			contractedRadius;

		// Ping-pong between render targets
		const readTarget =
			gpgpu.currentTarget === 0 ? gpgpu.positionTargetA : gpgpu.positionTargetB;
		const writeTarget =
			gpgpu.currentTarget === 0 ? gpgpu.positionTargetB : gpgpu.positionTargetA;

		// Set input texture (read from previous frame or initial)
		gpgpu.simulationMaterial.uniforms.uPositions.value =
			gpgpu.currentTarget === 0 && time < 0.1
				? gpgpu.positionTexture
				: readTarget.texture;

		// Render simulation
		gl.setRenderTarget(writeTarget);
		gl.render(gpgpu.simulationScene, gpgpu.simulationCamera);
		gl.setRenderTarget(null);

		// Swap targets
		gpgpu.currentTarget = 1 - gpgpu.currentTarget;

		// Update particle material with new positions
		material.uniforms.uPositions.value = writeTarget.texture;
		material.uniforms.uTime.value = time;
		material.uniforms.uBreathPhase.value = breathPhase;
	});

	return <points ref={pointsRef} geometry={geometry} material={material} />;
}
