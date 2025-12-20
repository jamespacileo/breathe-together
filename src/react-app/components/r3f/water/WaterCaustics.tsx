import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { calculateTargetScale } from '../../../hooks/useBreathingSpring';
import type { BreathState } from '../../../hooks/useBreathSync';
import type { VisualizationConfig } from '../../../lib/config';

interface WaterCausticsProps {
	breathState: BreathState;
	config: VisualizationConfig;
	moodColor: string;
}

// Caustics vertex shader
const causticsVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Caustics fragment shader - creates animated light refraction pattern
const causticsFragmentShader = `
  uniform vec3 color;
  uniform float time;
  uniform float breathScale;
  uniform float intensity;

  varying vec2 vUv;

  // Simplex noise functions for organic caustic patterns
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                            + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                            dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Voronoi for caustic cell patterns
  float voronoi(vec2 x) {
    vec2 p = floor(x);
    vec2 f = fract(x);
    float res = 8.0;
    for(int j = -1; j <= 1; j++) {
      for(int i = -1; i <= 1; i++) {
        vec2 b = vec2(float(i), float(j));
        vec2 r = b - f + 0.5 + 0.5 * sin(time * 0.5 + 6.2831 * vec2(
          snoise(p + b),
          snoise(p + b + vec2(100.0))
        ));
        float d = dot(r, r);
        res = min(res, d);
      }
    }
    return sqrt(res);
  }

  void main() {
    vec2 center = vec2(0.5);
    vec2 uv = vUv - center;

    // Distance from center for radial fade
    float dist = length(uv);

    // Scale UV by breath
    vec2 scaledUv = uv / breathScale;

    // Create animated caustic pattern
    float scale1 = 4.0;
    float scale2 = 6.0;

    // Layer 1: Primary caustic cells
    vec2 uv1 = scaledUv * scale1 + vec2(time * 0.1, time * 0.05);
    float caustic1 = voronoi(uv1);
    caustic1 = pow(caustic1, 1.5);

    // Layer 2: Secondary caustic pattern (finer detail)
    vec2 uv2 = scaledUv * scale2 + vec2(-time * 0.08, time * 0.12);
    float caustic2 = voronoi(uv2);
    caustic2 = pow(caustic2, 1.5);

    // Layer 3: Soft noise overlay
    float noise = snoise(scaledUv * 3.0 + time * 0.1) * 0.5 + 0.5;

    // Combine caustic layers
    float caustics = caustic1 * 0.5 + caustic2 * 0.3 + noise * 0.2;

    // Create light concentration points (bright spots)
    float bright = 1.0 - caustics;
    bright = pow(bright, 2.0) * 2.0;

    // Radial fade - caustics visible in center area
    float radialFade = smoothstep(0.7, 0.2, dist);

    // Breathing pulse effect on intensity
    float breathPulse = 0.8 + 0.2 * sin(time * 0.5);

    // Final intensity
    float alpha = bright * radialFade * intensity * breathPulse;

    // Color variation based on caustic pattern
    vec3 causticColor = color;
    causticColor += vec3(0.1, 0.15, 0.2) * (caustic1 - 0.5);

    gl_FragColor = vec4(causticColor, alpha);
  }
`;

export function WaterCaustics({
	breathState,
	config,
	moodColor,
}: WaterCausticsProps) {
	const meshRef = useRef<THREE.Mesh>(null);
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	const scaleRef = useRef(1);
	const velocityRef = useRef(0);
	const { size } = useThree();

	const planeSize = useMemo(() => {
		return Math.min(size.width, size.height) * 0.015;
	}, [size]);

	// Update color when mood changes
	useEffect(() => {
		if (materialRef.current) {
			materialRef.current.uniforms.color.value.set(
				moodColor || config.primaryColor,
			);
		}
	}, [moodColor, config.primaryColor]);

	// Animation loop
	useFrame((state) => {
		if (!meshRef.current || !materialRef.current) return;

		const time = state.clock.elapsedTime;

		// Calculate breathing scale with spring physics
		const targetScale = calculateTargetScale(breathState, config);
		const stiffness = config.mainSpringTension * 0.0001;
		const damping = config.mainSpringFriction * 0.05;
		const force = (targetScale - scaleRef.current) * stiffness;
		velocityRef.current = velocityRef.current * (1 - damping) + force;
		scaleRef.current += velocityRef.current;

		materialRef.current.uniforms.time.value = time;
		materialRef.current.uniforms.breathScale.value = scaleRef.current;

		// Scale the mesh with breathing
		const meshScale = scaleRef.current * 1.5;
		meshRef.current.scale.setScalar(meshScale);
	});

	const color = useMemo(
		() => new THREE.Color(moodColor || config.primaryColor),
		[moodColor, config.primaryColor],
	);

	return (
		<mesh ref={meshRef} position={[0, 0, -0.2]}>
			<planeGeometry args={[planeSize, planeSize]} />
			<shaderMaterial
				ref={materialRef}
				vertexShader={causticsVertexShader}
				fragmentShader={causticsFragmentShader}
				uniforms={{
					color: { value: color },
					time: { value: 0 },
					breathScale: { value: 1 },
					intensity: { value: 0.3 },
				}}
				transparent
				depthWrite={false}
				blending={THREE.AdditiveBlending}
			/>
		</mesh>
	);
}
