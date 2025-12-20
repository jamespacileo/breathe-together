import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { calculateTargetScale } from '../../../hooks/useBreathingSpring';
import type { BreathState } from '../../../hooks/useBreathSync';
import type { VisualizationConfig } from '../../../lib/config';

interface WaterGridProps {
	breathState: BreathState;
	config: VisualizationConfig;
	moodColor: string;
}

// Grid vertex shader with multi-octave noise displacement
const gridVertexShader = `
  uniform float time;
  uniform float breathScale;
  uniform float breathProgress;
  uniform float intensity;

  varying vec2 vUv;
  varying float vElevation;
  varying float vDistFromCenter;

  // Simplex noise functions for organic movement
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
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

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
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

  // Fractal Brownian Motion - layered noise like audio frequencies
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    // 4 octaves - like bass, mid, treble, presence
    for (int i = 0; i < 4; i++) {
      value += amplitude * snoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }

  void main() {
    vUv = uv;

    vec3 pos = position;

    // Distance from center for radial effects
    float dist = length(pos.xy);
    vDistFromCenter = dist;

    // Scale position with breathing
    pos.xy *= breathScale;

    // Multi-layered displacement like audio reactive visuals
    float t = time * 0.5;

    // Base wave - slow, large movement (like bass)
    float wave1 = fbm(vec3(pos.xy * 0.8, t * 0.3)) * 0.3;

    // Mid frequency - medium detail
    float wave2 = snoise(vec3(pos.xy * 1.5, t * 0.5)) * 0.15;

    // High frequency - fine detail (reactive to breath)
    float wave3 = snoise(vec3(pos.xy * 3.0, t * 0.8)) * 0.08 * intensity;

    // Radial pulse from center - synced to breathing
    float radialWave = sin(dist * 4.0 - time * 2.0) * 0.1 * intensity;

    // Combine all layers
    float totalWave = wave1 + wave2 + wave3 + radialWave;

    // Fade out at edges for clean look
    float edgeFade = smoothstep(2.2, 0.8, dist);
    pos.z = totalWave * edgeFade * breathScale;

    vElevation = pos.z;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Grid fragment shader with color gradients based on elevation
const gridFragmentShader = `
  uniform vec3 color;
  uniform vec3 colorHigh;
  uniform vec3 colorLow;
  uniform float opacity;
  uniform float time;
  uniform float intensity;

  varying vec2 vUv;
  varying float vElevation;
  varying float vDistFromCenter;

  void main() {
    // Fade out towards edges
    float edgeFade = smoothstep(2.0, 0.5, vDistFromCenter);

    // Color based on elevation - like audio visualizer coloring
    float elevNorm = vElevation * 3.0 + 0.5; // Normalize to 0-1 range
    vec3 gradientColor = mix(colorLow, colorHigh, clamp(elevNorm, 0.0, 1.0));

    // Add glow at peaks
    float glow = max(0.0, vElevation) * 2.0 * intensity;
    gradientColor += color * glow;

    // Subtle shimmer
    float shimmer = 0.95 + 0.05 * sin(time * 2.0 + vDistFromCenter * 5.0);

    vec3 finalColor = gradientColor * shimmer;

    float alpha = opacity * edgeFade;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// Line vertex shader - same displacement as surface
const lineVertexShader = `
  uniform float time;
  uniform float breathScale;
  uniform float intensity;

  varying float vDistFromCenter;
  varying float vElevation;

  // Same noise functions
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
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

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
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

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 4; i++) {
      value += amplitude * snoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }

  void main() {
    vec3 pos = position;

    float dist = length(pos.xy);
    vDistFromCenter = dist;

    pos.xy *= breathScale;

    float t = time * 0.5;

    float wave1 = fbm(vec3(pos.xy * 0.8, t * 0.3)) * 0.3;
    float wave2 = snoise(vec3(pos.xy * 1.5, t * 0.5)) * 0.15;
    float wave3 = snoise(vec3(pos.xy * 3.0, t * 0.8)) * 0.08 * intensity;
    float radialWave = sin(dist * 4.0 - time * 2.0) * 0.1 * intensity;

    float totalWave = wave1 + wave2 + wave3 + radialWave;
    float edgeFade = smoothstep(2.2, 0.8, dist);
    pos.z = totalWave * edgeFade * breathScale;

    vElevation = pos.z;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Line fragment shader with elevation-based brightness
const lineFragmentShader = `
  uniform vec3 color;
  uniform float opacity;
  uniform float time;
  uniform float intensity;

  varying float vDistFromCenter;
  varying float vElevation;

  void main() {
    float edgeFade = smoothstep(2.0, 0.3, vDistFromCenter);

    // Brighter at peaks - like audio visualizer glow
    float glow = 0.4 + max(0.0, vElevation) * 4.0;

    // Pulse effect
    float pulse = 0.9 + 0.1 * sin(time * 1.5);

    vec3 finalColor = color * glow * pulse;

    // Add white highlights at extreme peaks
    float highlight = smoothstep(0.15, 0.25, vElevation);
    finalColor = mix(finalColor, vec3(1.0), highlight * 0.3 * intensity);

    float alpha = opacity * edgeFade;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

const GRID_SIZE = 64;
const GRID_EXTENT = 2.5;

export function WaterGrid({ breathState, config, moodColor }: WaterGridProps) {
	const meshRef = useRef<THREE.Mesh>(null);
	const linesRef = useRef<THREE.LineSegments>(null);
	const surfaceMaterialRef = useRef<THREE.ShaderMaterial>(null);
	const lineMaterialRef = useRef<THREE.ShaderMaterial>(null);
	const scaleRef = useRef(1);
	const velocityRef = useRef(0);
	const { size } = useThree();

	// Create grid geometry
	const { surfaceGeometry, lineGeometry } = useMemo(() => {
		const surface = new THREE.PlaneGeometry(
			GRID_EXTENT * 2,
			GRID_EXTENT * 2,
			GRID_SIZE,
			GRID_SIZE,
		);

		const linePositions: number[] = [];
		const step = (GRID_EXTENT * 2) / GRID_SIZE;
		const half = GRID_EXTENT;

		// Horizontal lines
		for (let i = 0; i <= GRID_SIZE; i++) {
			const y = -half + i * step;
			linePositions.push(-half, y, 0);
			linePositions.push(half, y, 0);
		}

		// Vertical lines
		for (let i = 0; i <= GRID_SIZE; i++) {
			const x = -half + i * step;
			linePositions.push(x, -half, 0);
			linePositions.push(x, half, 0);
		}

		const lines = new THREE.BufferGeometry();
		lines.setAttribute(
			'position',
			new THREE.Float32BufferAttribute(linePositions, 3),
		);

		return { surfaceGeometry: surface, lineGeometry: lines };
	}, []);

	// Derive colors from mood color
	const colors = useMemo(() => {
		const base = new THREE.Color(moodColor || config.primaryColor);
		const hsl = { h: 0, s: 0, l: 0 };
		base.getHSL(hsl);

		// High color - brighter, slightly shifted hue
		const high = new THREE.Color().setHSL(
			(hsl.h + 0.05) % 1,
			Math.min(1, hsl.s * 1.2),
			Math.min(1, hsl.l * 1.4),
		);

		// Low color - darker, slightly shifted opposite
		const low = new THREE.Color().setHSL(
			(hsl.h - 0.05 + 1) % 1,
			hsl.s * 0.8,
			hsl.l * 0.5,
		);

		return { base, high, low };
	}, [moodColor, config.primaryColor]);

	// Update colors when mood changes
	useEffect(() => {
		if (surfaceMaterialRef.current) {
			surfaceMaterialRef.current.uniforms.color.value = colors.base;
			surfaceMaterialRef.current.uniforms.colorHigh.value = colors.high;
			surfaceMaterialRef.current.uniforms.colorLow.value = colors.low;
		}
		if (lineMaterialRef.current) {
			lineMaterialRef.current.uniforms.color.value = colors.base;
		}
	}, [colors]);

	// Animation loop
	useFrame((state) => {
		const time = state.clock.elapsedTime;

		// Calculate breathing scale with spring physics
		const targetScale = calculateTargetScale(breathState, config);
		const stiffness = config.mainSpringTension * 0.0001;
		const damping = config.mainSpringFriction * 0.05;
		const force = (targetScale - scaleRef.current) * stiffness;
		velocityRef.current = velocityRef.current * (1 - damping) + force;
		scaleRef.current += velocityRef.current;

		// Intensity based on breath phase - more reactive during inhale/exhale
		const isActive = breathState.phase === 'in' || breathState.phase === 'out';
		const intensity = isActive ? 0.8 + breathState.progress * 0.4 : 0.6;

		// Update surface material
		if (surfaceMaterialRef.current) {
			surfaceMaterialRef.current.uniforms.time.value = time;
			surfaceMaterialRef.current.uniforms.breathScale.value = scaleRef.current;
			surfaceMaterialRef.current.uniforms.breathProgress.value =
				breathState.progress;
			surfaceMaterialRef.current.uniforms.intensity.value = intensity;
		}

		// Update line material
		if (lineMaterialRef.current) {
			lineMaterialRef.current.uniforms.time.value = time;
			lineMaterialRef.current.uniforms.breathScale.value = scaleRef.current;
			lineMaterialRef.current.uniforms.intensity.value = intensity;
		}
	});

	const viewportScale = Math.min(size.width, size.height) * 0.001;

	return (
		<group scale={[viewportScale, viewportScale, viewportScale]}>
			{/* Subtle surface fill */}
			<mesh ref={meshRef} geometry={surfaceGeometry}>
				<shaderMaterial
					ref={surfaceMaterialRef}
					vertexShader={gridVertexShader}
					fragmentShader={gridFragmentShader}
					uniforms={{
						color: { value: colors.base },
						colorHigh: { value: colors.high },
						colorLow: { value: colors.low },
						opacity: { value: 0.06 },
						time: { value: 0 },
						breathScale: { value: 1 },
						breathProgress: { value: 0 },
						intensity: { value: 1 },
					}}
					transparent
					depthWrite={false}
					blending={THREE.AdditiveBlending}
					side={THREE.DoubleSide}
				/>
			</mesh>

			{/* Grid lines */}
			<lineSegments ref={linesRef} geometry={lineGeometry}>
				<shaderMaterial
					ref={lineMaterialRef}
					vertexShader={lineVertexShader}
					fragmentShader={lineFragmentShader}
					uniforms={{
						color: { value: colors.base },
						opacity: { value: 0.35 },
						time: { value: 0 },
						breathScale: { value: 1 },
						intensity: { value: 1 },
					}}
					transparent
					depthWrite={false}
					blending={THREE.AdditiveBlending}
				/>
			</lineSegments>
		</group>
	);
}
