import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

// GLSL Shaders - refined for subtle, elegant motion
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

  // Gentle orbital rotation - consistent speed
  float orbitSpeed = 0.15 + phase * 0.05;
  float orbit = uTime * orbitSpeed;
  float cosOrbit = cos(orbit);
  float sinOrbit = sin(orbit);

  // Rotate around Y axis
  targetPos = vec3(
    targetPos.x * cosOrbit + targetPos.z * sinOrbit,
    targetPos.y,
    -targetPos.x * sinOrbit + targetPos.z * cosOrbit
  );

  // Very subtle displacement - much reduced from before
  float noiseVal = noise(origPos * 0.1 + uTime * 0.05 + phase) - 0.5;
  float displacementStrength = mix(0.3, 0.1, uBreathPhase); // Less movement when contracted
  targetPos += dir * noiseVal * displacementStrength;

  // Gentle vertical bobbing
  float bobAmount = mix(0.15, 0.05, uBreathPhase);
  targetPos.y += sin(uTime * 0.4 + phase * 6.28) * bobAmount;

  // Smooth spring interpolation
  float springStrength = 0.06;
  vec3 velocity = (targetPos - pos) * springStrength;

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
varying float vPhase;
varying float vBreathPhase;
varying float vSparkle;

void main() {
  vec4 posData = texture2D(uPositions, aReference);
  vec3 pos = posData.xyz;

  vPosition = pos;
  vPhase = aPhase;
  vBreathPhase = uBreathPhase;
  vColor = aColor;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vDistance = -mvPosition.z;

  // Consistent small size - fine particles
  float distanceAttenuation = 250.0 / max(vDistance, 1.0);
  float baseSize = aSize * 0.7 * distanceAttenuation;

  // Very subtle sparkle - random bright moments
  float sparkleTime = uTime * 3.0 + aPhase * 100.0;
  float sparkle = pow(max(0.0, sin(sparkleTime) * sin(sparkleTime * 1.7) * sin(sparkleTime * 2.3)), 8.0);
  vSparkle = sparkle;

  // Slight size boost during sparkle
  baseSize *= (1.0 + sparkle * 0.3);

  gl_PointSize = baseSize * uPixelRatio;
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
varying float vPhase;
varying float vBreathPhase;
varying float vSparkle;

void main() {
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);

  // Sharp circle with soft edge
  float alpha = 1.0 - smoothstep(0.3, 0.5, dist);

  if (alpha < 0.01) discard;

  // Base color with subtle breathing modulation
  vec3 color = vColor;

  // Gentle brightness variation - NOT too bright
  float brightness = 0.7 + vBreathPhase * 0.15;
  color *= brightness;

  // Very subtle sparkle glint - barely noticeable white highlight
  if (vSparkle > 0.5) {
    float sparkleIntensity = (vSparkle - 0.5) * 2.0;
    color = mix(color, vec3(1.0, 0.98, 0.95), sparkleIntensity * 0.4);
  }

  // Soft center glow
  float centerBright = exp(-dist * 6.0) * 0.2;
  color += vec3(1.0, 0.95, 0.9) * centerBright;

  // Moderate base alpha - particles should be visible but not overwhelming
  float baseAlpha = 0.5 + vBreathPhase * 0.2;
  alpha *= baseAlpha;

  // Distance fade for depth
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
	phaseType: _phaseType,
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
