import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { calculateTargetScale } from '../../hooks/useBreathingSpring';
import type { BreathState } from '../../hooks/useBreathSync';
import type { VisualizationConfig } from '../../lib/config';

interface GlowEffectProps {
	breathState: BreathState;
	config: VisualizationConfig;
	moodColor: string;
}

// Nebula glow shader with multiple color layers
const glowVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glowFragmentShader = `
  uniform vec3 color1;
  uniform vec3 color2;
  uniform vec3 color3;
  uniform float intensity;
  uniform float coreIntensity;
  uniform float coreSize;
  uniform float time;
  uniform float diffuseFactor;

  varying vec2 vUv;

  // Simple noise function for nebula effect
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 center = vec2(0.5);
    float dist = distance(vUv, center);

    // Animated distortion for nebula effect
    vec2 offset = vec2(
      sin(time * 0.3 + vUv.y * 4.0) * 0.02,
      cos(time * 0.2 + vUv.x * 4.0) * 0.02
    ) * diffuseFactor;
    float distortedDist = distance(vUv + offset, center);

    // Multiple glow layers with different colors
    float layer1 = smoothstep(0.5, 0.0, distortedDist) * intensity;
    float layer2 = smoothstep(0.35, 0.05, distortedDist) * intensity * 0.7;
    float layer3 = smoothstep(0.25, 0.0, distortedDist) * intensity * 0.5;

    // Core glow (brighter center)
    float coreGlow = smoothstep(coreSize, 0.0, dist) * coreIntensity;

    // Blend colors based on distance
    vec3 nebulaColor = mix(color1, color2, smoothstep(0.0, 0.3, distortedDist));
    nebulaColor = mix(nebulaColor, color3, smoothstep(0.2, 0.5, distortedDist));

    // Add subtle noise texture
    float n = noise(vUv * 50.0 + time * 0.1) * 0.1 * diffuseFactor;

    float alpha = (layer1 + layer2 * 0.5 + layer3 * 0.3 + coreGlow) * (1.0 + n);

    gl_FragColor = vec4(nebulaColor, alpha);
  }
`;

export function GlowEffect({
	breathState,
	config,
	moodColor,
}: GlowEffectProps) {
	const meshRef = useRef<THREE.Mesh>(null);
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	const scaleRef = useRef(1);
	const velocityRef = useRef(0);
	const { size } = useThree();

	// Calculate base size from viewport
	const baseSize = useMemo(() => {
		return Math.min(size.width, size.height) * 0.8;
	}, [size]);

	// Nebula colors - cosmic palette
	const nebulaColors = useMemo(() => {
		const moodCol = new THREE.Color(moodColor || config.primaryColor);
		return {
			color1: new THREE.Color('#9B7EBD').lerp(moodCol, 0.3), // Purple blend
			color2: new THREE.Color('#7EB5C1').lerp(moodCol, 0.2), // Teal blend
			color3: new THREE.Color('#C17EB5').lerp(moodCol, 0.2), // Pink blend
		};
	}, [moodColor, config.primaryColor]);

	// Update colors when mood changes
	useEffect(() => {
		if (materialRef.current) {
			materialRef.current.uniforms.color1.value.copy(nebulaColors.color1);
			materialRef.current.uniforms.color2.value.copy(nebulaColors.color2);
			materialRef.current.uniforms.color3.value.copy(nebulaColors.color3);
		}
	}, [nebulaColors]);

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

		// Calculate target scale with spring physics
		const targetScale = calculateTargetScale(breathState, config);

		// Manual spring simulation
		const stiffness = config.mainSpringTension * 0.0001;
		const damping = config.mainSpringFriction * 0.05;
		const force = (targetScale - scaleRef.current) * stiffness;
		velocityRef.current = velocityRef.current * (1 - damping) + force;
		scaleRef.current += velocityRef.current;

		// Calculate diffuse factor for nebula animation
		const normalizedScale =
			(scaleRef.current - config.breatheInScale) /
			(config.breatheOutScale - config.breatheInScale);
		const diffuseFactor = Math.max(0, Math.min(1, normalizedScale));

		// Apply scale - larger when diffuse
		const glowScale =
			scaleRef.current * config.glowRadius * (1 + diffuseFactor * 0.3);
		meshRef.current.scale.setScalar(glowScale);

		// Update time and diffuse uniforms
		materialRef.current.uniforms.time.value = state.clock.elapsedTime;
		materialRef.current.uniforms.diffuseFactor.value = diffuseFactor;

		// Animate intensity based on breathing
		const breathingIntensity =
			config.glowIntensity * (0.8 + diffuseFactor * 0.4);
		materialRef.current.uniforms.intensity.value = breathingIntensity;
	});

	return (
		<mesh ref={meshRef} position={[0, 0, -0.1]}>
			<planeGeometry args={[baseSize / 50, baseSize / 50]} />
			<shaderMaterial
				ref={materialRef}
				vertexShader={glowVertexShader}
				fragmentShader={glowFragmentShader}
				uniforms={{
					color1: { value: nebulaColors.color1 },
					color2: { value: nebulaColors.color2 },
					color3: { value: nebulaColors.color3 },
					intensity: { value: config.glowIntensity },
					coreIntensity: { value: config.coreOpacity },
					coreSize: { value: config.coreRadius / 100 },
					time: { value: 0 },
					diffuseFactor: { value: 0 },
				}}
				transparent
				depthWrite={false}
				blending={THREE.AdditiveBlending}
			/>
		</mesh>
	);
}
