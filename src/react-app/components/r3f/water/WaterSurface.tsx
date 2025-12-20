import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { calculateTargetScale } from '../../../hooks/useBreathingSpring';
import type { BreathState } from '../../../hooks/useBreathSync';
import type { VisualizationConfig } from '../../../lib/config';

interface WaterSurfaceProps {
	breathState: BreathState;
	config: VisualizationConfig;
	moodColor: string;
}

// Water surface vertex shader with wave animation
const surfaceVertexShader = `
  varying vec2 vUv;
  varying float vWave;

  uniform float time;
  uniform float breathScale;

  void main() {
    vUv = uv;

    vec3 pos = position;

    // Multiple wave layers for organic water surface
    float wave1 = sin(pos.x * 3.0 + time * 1.5) * 0.02;
    float wave2 = sin(pos.y * 4.0 + time * 1.2) * 0.015;
    float wave3 = sin((pos.x + pos.y) * 2.0 + time * 0.8) * 0.025;

    // Breathing affects wave intensity
    float waveIntensity = 0.5 + breathScale * 0.5;
    pos.z += (wave1 + wave2 + wave3) * waveIntensity;

    vWave = wave1 + wave2 + wave3;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Water surface fragment shader
const surfaceFragmentShader = `
  uniform vec3 color;
  uniform float time;
  uniform float breathScale;
  uniform float opacity;

  varying vec2 vUv;
  varying float vWave;

  void main() {
    vec2 center = vec2(0.5);
    float dist = distance(vUv, center);

    // Radial gradient for depth effect
    float radialFade = smoothstep(0.6, 0.1, dist);

    // Shimmer based on wave height
    float shimmer = 0.8 + vWave * 5.0;

    // Light reflection hotspots
    float reflection = pow(max(0.0, vWave * 10.0), 2.0) * 0.3;

    // Combine color
    vec3 surfaceColor = color * shimmer;
    surfaceColor += vec3(reflection);

    // Edge glow
    float edgeGlow = smoothstep(0.4, 0.5, dist) * smoothstep(0.7, 0.5, dist) * 0.3;
    surfaceColor += color * edgeGlow;

    float alpha = radialFade * opacity;

    gl_FragColor = vec4(surfaceColor, alpha);
  }
`;

export function WaterSurface({
	breathState,
	config,
	moodColor,
}: WaterSurfaceProps) {
	const meshRef = useRef<THREE.Mesh>(null);
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	const scaleRef = useRef(1);
	const velocityRef = useRef(0);
	const { size } = useThree();

	const planeSize = useMemo(() => {
		return Math.min(size.width, size.height) * 0.012;
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

		// Scale mesh with breathing
		meshRef.current.scale.setScalar(scaleRef.current);
	});

	const color = useMemo(
		() => new THREE.Color(moodColor || config.primaryColor),
		[moodColor, config.primaryColor],
	);

	return (
		<mesh ref={meshRef} position={[0, 0, 0]}>
			<planeGeometry args={[planeSize, planeSize, 32, 32]} />
			<shaderMaterial
				ref={materialRef}
				vertexShader={surfaceVertexShader}
				fragmentShader={surfaceFragmentShader}
				uniforms={{
					color: { value: color },
					time: { value: 0 },
					breathScale: { value: 1 },
					opacity: { value: 0.15 },
				}}
				transparent
				depthWrite={false}
				blending={THREE.AdditiveBlending}
				side={THREE.DoubleSide}
			/>
		</mesh>
	);
}
