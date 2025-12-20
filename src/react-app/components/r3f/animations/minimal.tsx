import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { calculateTargetScale } from '../../../hooks/useBreathingSpring';
import type { ParticleAnimationProps } from './types';

const vertexShader = `
  uniform float scale;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position * scale;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 color;
  uniform float breathProgress;
  varying vec2 vUv;

  void main() {
    vec2 center = vec2(0.5);
    float dist = distance(vUv, center);

    // Soft breathing ring
    float ringWidth = 0.08;
    float ringRadius = 0.35 + breathProgress * 0.05;
    float ring = smoothstep(ringRadius + ringWidth, ringRadius, dist) *
                 smoothstep(ringRadius - ringWidth * 2.0, ringRadius - ringWidth, dist);

    // Soft core glow
    float core = smoothstep(0.3, 0.0, dist) * 0.3;

    float alpha = ring * 0.6 + core;
    gl_FragColor = vec4(color, alpha);
  }
`;

/**
 * Minimal zen animation - a single breathing circle.
 * Clean, simple, distraction-free.
 */
export function MinimalAnimation({
	breathState,
	config,
	moodColor,
}: ParticleAnimationProps) {
	const meshRef = useRef<THREE.Mesh>(null);
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	const scaleRef = useRef(1);
	const velocityRef = useRef(0);

	const color = useMemo(
		() => new THREE.Color(moodColor || config.primaryColor),
		[moodColor, config.primaryColor],
	);

	useFrame(() => {
		if (!meshRef.current || !materialRef.current) return;

		const targetScale = calculateTargetScale(breathState, config);
		const stiffness = config.mainSpringTension * 0.0001;
		const damping = config.mainSpringFriction * 0.05;
		const force = (targetScale - scaleRef.current) * stiffness;
		velocityRef.current = velocityRef.current * (1 - damping) + force;
		scaleRef.current += velocityRef.current;

		materialRef.current.uniforms.scale.value = scaleRef.current * 2;
		materialRef.current.uniforms.breathProgress.value = breathState.progress;
		materialRef.current.uniforms.color.value = color;
	});

	return (
		<mesh ref={meshRef}>
			<planeGeometry args={[3, 3]} />
			<shaderMaterial
				ref={materialRef}
				vertexShader={vertexShader}
				fragmentShader={fragmentShader}
				uniforms={{
					color: { value: color },
					scale: { value: 1 },
					breathProgress: { value: 0 },
				}}
				transparent
				depthWrite={false}
				blending={THREE.AdditiveBlending}
			/>
		</mesh>
	);
}
