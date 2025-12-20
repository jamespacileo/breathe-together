import { useFrame } from '@react-three/fiber';
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

// Grid vertex shader with organic wave displacement
const gridVertexShader = `
  uniform float time;
  uniform float breathScale;
  uniform float intensity;

  varying float vElevation;
  varying float vDistFromCenter;

  // Simplex noise for organic movement
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

  void main() {
    vec3 pos = position;

    // Distance from center
    float dist = length(pos.xy);
    vDistFromCenter = dist;

    // Scale XY with breathing
    pos.xy *= breathScale;

    // Layered waves
    float t = time * 0.4;

    // Slow undulating base
    float wave1 = snoise(vec3(pos.xy * 0.5, t * 0.3)) * 0.4;

    // Medium detail
    float wave2 = snoise(vec3(pos.xy * 1.2, t * 0.5)) * 0.2;

    // Fine ripples reactive to breath
    float wave3 = snoise(vec3(pos.xy * 2.5, t * 0.8)) * 0.1 * intensity;

    // Radial breathing pulse
    float radialWave = sin(dist * 3.0 - time * 1.5) * 0.15 * intensity;

    // Combine waves
    float totalWave = wave1 + wave2 + wave3 + radialWave;

    // Soft edge fade
    float edgeFade = smoothstep(4.0, 1.5, dist);
    pos.z = totalWave * edgeFade * breathScale;

    vElevation = pos.z;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Line fragment shader
const lineFragmentShader = `
  uniform vec3 color;
  uniform float opacity;
  uniform float time;

  varying float vDistFromCenter;
  varying float vElevation;

  void main() {
    // Edge fade
    float edgeFade = smoothstep(3.5, 1.0, vDistFromCenter);

    // Brighter at wave peaks
    float glow = 0.6 + vElevation * 2.0;

    // Subtle pulse
    float pulse = 0.95 + 0.05 * sin(time * 1.2);

    vec3 finalColor = color * glow * pulse;

    // Highlight peaks
    float highlight = smoothstep(0.2, 0.4, vElevation);
    finalColor = mix(finalColor, vec3(1.0), highlight * 0.4);

    float alpha = opacity * edgeFade;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

const GRID_SIZE = 50;
const GRID_EXTENT = 4.0;

export function WaterGrid({ breathState, config, moodColor }: WaterGridProps) {
	const linesRef = useRef<THREE.LineSegments>(null);
	const lineMaterialRef = useRef<THREE.ShaderMaterial>(null);
	const scaleRef = useRef(1);
	const velocityRef = useRef(0);

	// Create grid line geometry
	const lineGeometry = useMemo(() => {
		const positions: number[] = [];
		const step = (GRID_EXTENT * 2) / GRID_SIZE;
		const half = GRID_EXTENT;

		// Horizontal lines
		for (let i = 0; i <= GRID_SIZE; i++) {
			const y = -half + i * step;
			positions.push(-half, y, 0);
			positions.push(half, y, 0);
		}

		// Vertical lines
		for (let i = 0; i <= GRID_SIZE; i++) {
			const x = -half + i * step;
			positions.push(x, -half, 0);
			positions.push(x, half, 0);
		}

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute(
			'position',
			new THREE.Float32BufferAttribute(positions, 3),
		);

		return geometry;
	}, []);

	// Get color from mood
	const color = useMemo(
		() => new THREE.Color(moodColor || config.primaryColor),
		[moodColor, config.primaryColor],
	);

	// Update color when mood changes
	useEffect(() => {
		if (lineMaterialRef.current) {
			lineMaterialRef.current.uniforms.color.value = color;
		}
	}, [color]);

	// Animation loop
	useFrame((state) => {
		const time = state.clock.elapsedTime;

		// Spring physics for breathing
		const targetScale = calculateTargetScale(breathState, config);
		const stiffness = config.mainSpringTension * 0.0001;
		const damping = config.mainSpringFriction * 0.05;
		const force = (targetScale - scaleRef.current) * stiffness;
		velocityRef.current = velocityRef.current * (1 - damping) + force;
		scaleRef.current += velocityRef.current;

		// More intensity during active breathing
		const isActive = breathState.phase === 'in' || breathState.phase === 'out';
		const intensity = isActive ? 0.8 + breathState.progress * 0.4 : 0.5;

		// Update shader uniforms
		if (lineMaterialRef.current) {
			lineMaterialRef.current.uniforms.time.value = time;
			lineMaterialRef.current.uniforms.breathScale.value = scaleRef.current;
			lineMaterialRef.current.uniforms.intensity.value = intensity;
		}
	});

	return (
		<group rotation={[-0.5, 0, 0]}>
			<lineSegments ref={linesRef} geometry={lineGeometry}>
				<shaderMaterial
					ref={lineMaterialRef}
					vertexShader={gridVertexShader}
					fragmentShader={lineFragmentShader}
					uniforms={{
						color: { value: color },
						opacity: { value: 0.7 },
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
