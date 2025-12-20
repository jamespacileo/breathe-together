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

// Simple, elegant radial glow shader
const glowVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glowFragmentShader = `
  uniform vec3 color;
  uniform float intensity;

  varying vec2 vUv;

  void main() {
    vec2 center = vec2(0.5);
    float dist = distance(vUv, center);

    // Simple smooth radial falloff - like a soft light source
    float glow = smoothstep(0.5, 0.0, dist);

    // Cubic falloff for more natural light decay
    glow = glow * glow * (3.0 - 2.0 * glow);

    float alpha = glow * intensity;

    gl_FragColor = vec4(color, alpha);
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

	// Single color based on mood
	const glowColor = useMemo(() => {
		return new THREE.Color(moodColor || config.primaryColor);
	}, [moodColor, config.primaryColor]);

	// Update color when mood changes
	useEffect(() => {
		if (materialRef.current) {
			materialRef.current.uniforms.color.value.copy(glowColor);
		}
	}, [glowColor]);

	useFrame(() => {
		if (!meshRef.current || !materialRef.current) return;

		// Calculate target scale with spring physics
		const targetScale = calculateTargetScale(breathState, config);

		// Manual spring simulation
		const stiffness = config.mainSpringTension * 0.0001;
		const damping = config.mainSpringFriction * 0.05;
		const force = (targetScale - scaleRef.current) * stiffness;
		velocityRef.current = velocityRef.current * (1 - damping) + force;
		scaleRef.current += velocityRef.current;

		// Apply scale
		const glowScale = scaleRef.current * config.glowRadius;
		meshRef.current.scale.setScalar(glowScale);

		// Subtle intensity variation with breathing
		const normalizedScale =
			(scaleRef.current - config.breatheInScale) /
			(config.breatheOutScale - config.breatheInScale);
		const breathFactor = Math.max(0, Math.min(1, normalizedScale));
		const dynamicIntensity = config.glowIntensity * (0.6 + breathFactor * 0.4);
		materialRef.current.uniforms.intensity.value = dynamicIntensity;
	});

	return (
		<mesh ref={meshRef} position={[0, 0, -0.1]}>
			<planeGeometry args={[baseSize / 50, baseSize / 50]} />
			<shaderMaterial
				ref={materialRef}
				vertexShader={glowVertexShader}
				fragmentShader={glowFragmentShader}
				uniforms={{
					color: { value: glowColor },
					intensity: { value: config.glowIntensity },
				}}
				transparent
				depthWrite={false}
				blending={THREE.AdditiveBlending}
			/>
		</mesh>
	);
}
