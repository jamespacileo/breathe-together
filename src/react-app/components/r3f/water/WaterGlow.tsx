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

// Simple ethereal glow shader
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
  uniform float time;

  varying vec2 vUv;

  void main() {
    vec2 center = vec2(0.5);
    float dist = distance(vUv, center);

    // Simple soft radial glow
    float glow = smoothstep(0.5, 0.0, dist) * intensity;

    // Subtle breathing pulse
    float pulse = 0.9 + 0.1 * sin(time * 0.8);
    glow *= pulse;

    gl_FragColor = vec4(color, glow);
  }
`;

export function WaterGlow({ breathState, config, moodColor }: WaterGlowProps) {
	const meshRef = useRef<THREE.Mesh>(null);
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	const scaleRef = useRef(1);
	const velocityRef = useRef(0);
	const { size } = useThree();

	const baseSize = useMemo(() => {
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

	useFrame((state) => {
		if (!meshRef.current || !materialRef.current) return;

		const time = state.clock.elapsedTime;

		// Calculate target scale with spring physics
		const targetScale = calculateTargetScale(breathState, config);

		const stiffness = config.mainSpringTension * 0.0001;
		const damping = config.mainSpringFriction * 0.05;
		const force = (targetScale - scaleRef.current) * stiffness;
		velocityRef.current = velocityRef.current * (1 - damping) + force;
		scaleRef.current += velocityRef.current;

		materialRef.current.uniforms.time.value = time;

		// Scale glow with breathing
		meshRef.current.scale.setScalar(scaleRef.current * config.glowRadius);
	});

	const color = useMemo(
		() => new THREE.Color(moodColor || config.primaryColor),
		[moodColor, config.primaryColor],
	);

	return (
		<mesh ref={meshRef} position={[0, 0, -0.5]}>
			<planeGeometry args={[baseSize, baseSize]} />
			<shaderMaterial
				ref={materialRef}
				vertexShader={glowVertexShader}
				fragmentShader={glowFragmentShader}
				uniforms={{
					color: { value: color },
					intensity: { value: 0.15 },
					time: { value: 0 },
				}}
				transparent
				depthWrite={false}
				blending={THREE.AdditiveBlending}
			/>
		</mesh>
	);
}
