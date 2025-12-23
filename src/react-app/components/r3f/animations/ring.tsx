import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { calculateTargetScale } from '../../../hooks/useBreathingSpring';
import type { ParticleAnimationProps } from './types';

const vertexShader = `
  attribute float size;
  attribute float opacity;
  varying float vOpacity;

  void main() {
    vOpacity = opacity;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform vec3 color;
  varying float vOpacity;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.1, dist) * vOpacity;
    gl_FragColor = vec4(color, alpha);
  }
`;

/**
 * Simple ring animation using WebGL points.
 * A classic circular particle distribution with wobble.
 */
export function RingAnimation({
	breathState,
	config,
	moodColor,
}: ParticleAnimationProps) {
	const pointsRef = useRef<THREE.Points>(null);
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	const scaleRef = useRef(1);
	const velocityRef = useRef(0);

	const particleData = useMemo(() => {
		const count = config.particleCount;
		const positions = new Float32Array(count * 3);
		const sizes = new Float32Array(count);
		const opacities = new Float32Array(count);
		const baseAngles = new Float32Array(count);
		const radiusMultipliers = new Float32Array(count);
		const phaseOffsets = new Float32Array(count);

		for (let i = 0; i < count; i++) {
			const angle = (i / count) * Math.PI * 2;
			baseAngles[i] = angle;
			radiusMultipliers[i] =
				config.radiusVarianceMin +
				Math.random() * (config.radiusVarianceMax - config.radiusVarianceMin);
			phaseOffsets[i] = Math.random() * Math.PI * 2;

			positions[i * 3] = Math.cos(angle) * radiusMultipliers[i];
			positions[i * 3 + 1] = Math.sin(angle) * radiusMultipliers[i];
			positions[i * 3 + 2] = 0;

			sizes[i] =
				config.particleMinSize +
				Math.random() * (config.particleMaxSize - config.particleMinSize);
			opacities[i] =
				config.particleMinOpacity +
				Math.random() * (config.particleMaxOpacity - config.particleMinOpacity);
		}

		return {
			positions,
			sizes,
			opacities,
			baseAngles,
			radiusMultipliers,
			phaseOffsets,
			count,
		};
	}, [
		config.particleCount,
		config.radiusVarianceMin,
		config.radiusVarianceMax,
		config.particleMinSize,
		config.particleMaxSize,
		config.particleMinOpacity,
		config.particleMaxOpacity,
	]);

	useFrame((state) => {
		if (!pointsRef.current) return;

		const time = state.clock.elapsedTime * 1000;
		const targetScale = calculateTargetScale(breathState, config);

		const stiffness = config.mainSpringTension * 0.0001;
		const damping = config.mainSpringFriction * 0.05;
		const force = (targetScale - scaleRef.current) * stiffness;
		velocityRef.current = velocityRef.current * (1 - damping) + force;
		scaleRef.current += velocityRef.current;

		const positions = pointsRef.current.geometry.attributes.position
			.array as Float32Array;
		const { baseAngles, radiusMultipliers, phaseOffsets, count } = particleData;

		for (let i = 0; i < count; i++) {
			const wobble =
				Math.sin(time * config.wobbleSpeed + phaseOffsets[i]) *
				config.wobbleAmount;
			const angle = baseAngles[i] + wobble;
			const radius = scaleRef.current * radiusMultipliers[i];

			positions[i * 3] = Math.cos(angle) * radius;
			positions[i * 3 + 1] = Math.sin(angle) * radius;
		}

		pointsRef.current.geometry.attributes.position.needsUpdate = true;
	});

	const color = useMemo(
		() => new THREE.Color(moodColor || config.primaryColor),
		[moodColor, config.primaryColor],
	);

	return (
		<points ref={pointsRef}>
			<bufferGeometry>
				<bufferAttribute
					attach="attributes-position"
					args={[particleData.positions, 3]}
				/>
				<bufferAttribute
					attach="attributes-size"
					args={[particleData.sizes, 1]}
				/>
				<bufferAttribute
					attach="attributes-opacity"
					args={[particleData.opacities, 1]}
				/>
			</bufferGeometry>
			<shaderMaterial
				ref={materialRef}
				vertexShader={vertexShader}
				fragmentShader={fragmentShader}
				uniforms={{ color: { value: color } }}
				transparent
				depthWrite={false}
				blending={THREE.AdditiveBlending}
			/>
		</points>
	);
}
