import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { calculateTargetScale } from '../../../hooks/useBreathingSpring';
import type { BreathState } from '../../../hooks/useBreathSync';
import type { VisualizationConfig } from '../../../lib/config';

interface WaterGlowProps {
	breathState: BreathState;
	config: VisualizationConfig;
	moodColor: string;
}

// Water glow shader - soft underwater light effect
const waterGlowVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const waterGlowFragmentShader = `
  uniform vec3 color;
  uniform float intensity;
  uniform float coreIntensity;
  uniform float coreSize;
  uniform float time;
  uniform float breathScale;

  varying vec2 vUv;

  void main() {
    vec2 center = vec2(0.5);
    float dist = distance(vUv, center);

    // Animated underwater light rays
    float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
    float rays = sin(angle * 8.0 + time * 0.5) * 0.5 + 0.5;
    rays = pow(rays, 3.0) * 0.3;

    // Outer glow with water caustic-like variation
    float causticNoise = sin(dist * 20.0 - time * 2.0) * 0.1;
    float outerGlow = smoothstep(0.5 + causticNoise, 0.0, dist) * intensity;

    // Add light ray effect
    outerGlow += rays * smoothstep(0.5, 0.2, dist) * 0.2;

    // Core glow (brighter center)
    float coreGlow = smoothstep(coreSize, 0.0, dist) * coreIntensity;

    // Breathing pulse on core
    float pulse = 0.8 + 0.2 * sin(time * 1.5);
    coreGlow *= pulse;

    float alpha = outerGlow + coreGlow;

    // Slight color shift for underwater feel
    vec3 glowColor = color;
    glowColor.b += 0.1 * smoothstep(0.3, 0.0, dist); // More blue in center

    gl_FragColor = vec4(glowColor, alpha);
  }
`;

export function WaterGlow({ breathState, config, moodColor }: WaterGlowProps) {
	const meshRef = useRef<THREE.Mesh>(null);
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	const scaleRef = useRef(1);
	const velocityRef = useRef(0);
	const { size } = useThree();

	// Calculate base size from viewport
	const baseSize = useMemo(() => {
		return Math.min(size.width, size.height) * 0.8;
	}, [size]);

	// Update color when mood changes
	useEffect(() => {
		if (materialRef.current) {
			materialRef.current.uniforms.color.value.set(
				moodColor || config.primaryColor,
			);
		}
	}, [moodColor, config.primaryColor]);

	// Update intensity
	useEffect(() => {
		if (materialRef.current) {
			materialRef.current.uniforms.intensity.value = config.glowIntensity;
			materialRef.current.uniforms.coreIntensity.value = config.coreOpacity;
			materialRef.current.uniforms.coreSize.value = config.coreRadius / 100;
		}
	}, [config.glowIntensity, config.coreOpacity, config.coreRadius]);

	useFrame((state) => {
		if (!meshRef.current || !materialRef.current) return;

		const time = state.clock.elapsedTime;

		// Calculate target scale with spring physics
		const targetScale = calculateTargetScale(breathState, config);

		// Manual spring simulation
		const stiffness = config.mainSpringTension * 0.0001;
		const damping = config.mainSpringFriction * 0.05;
		const force = (targetScale - scaleRef.current) * stiffness;
		velocityRef.current = velocityRef.current * (1 - damping) + force;
		scaleRef.current += velocityRef.current;

		// Update time uniform
		materialRef.current.uniforms.time.value = time;
		materialRef.current.uniforms.breathScale.value = scaleRef.current;

		// Apply scale
		const glowScale = scaleRef.current * config.glowRadius;
		meshRef.current.scale.setScalar(glowScale);
	});

	const color = useMemo(
		() => new THREE.Color(moodColor || config.primaryColor),
		[moodColor, config.primaryColor],
	);

	return (
		<mesh ref={meshRef} position={[0, 0, -0.15]}>
			<planeGeometry args={[baseSize / 50, baseSize / 50]} />
			<shaderMaterial
				ref={materialRef}
				vertexShader={waterGlowVertexShader}
				fragmentShader={waterGlowFragmentShader}
				uniforms={{
					color: { value: color },
					intensity: { value: config.glowIntensity },
					coreIntensity: { value: config.coreOpacity },
					coreSize: { value: config.coreRadius / 100 },
					time: { value: 0 },
					breathScale: { value: 1 },
				}}
				transparent
				depthWrite={false}
				blending={THREE.AdditiveBlending}
			/>
		</mesh>
	);
}
