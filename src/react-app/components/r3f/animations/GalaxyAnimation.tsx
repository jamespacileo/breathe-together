import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { calculateTargetScale } from '../../../hooks/useBreathingSpring';
import type { AnimationProps } from './types';

/**
 * Galaxy/Nebula animation (placeholder)
 * TODO: Implement with three-nebula library
 *
 * For now, renders a simple spiral pattern as proof of concept.
 * Will be replaced with proper nebula particle system.
 */
export function GalaxyAnimation({
	breathState,
	config,
	moodColor,
}: AnimationProps) {
	const pointsRef = useRef<THREE.Points>(null);
	const scaleRef = useRef(1);
	const velocityRef = useRef(0);

	// Generate spiral galaxy particles
	const particleData = useMemo(() => {
		const count = config.particleCount * 2;
		const positions = new Float32Array(count * 3);
		const sizes = new Float32Array(count);
		const opacities = new Float32Array(count);
		const colors = new Float32Array(count * 3);

		const numArms = 3;
		const baseColor = new THREE.Color(moodColor || config.primaryColor);

		for (let i = 0; i < count; i++) {
			const armIndex = i % numArms;
			const armOffset = (armIndex / numArms) * Math.PI * 2;
			const progress = (i / count) * 2;

			// Logarithmic spiral
			const theta = progress * Math.PI * 4 + armOffset;
			const radius = 0.1 + progress * 0.4;
			const spread = (Math.random() - 0.5) * 0.15;

			positions[i * 3] = Math.cos(theta) * (radius + spread);
			positions[i * 3 + 1] = Math.sin(theta) * (radius + spread);
			positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

			sizes[i] =
				config.particleMinSize +
				Math.random() * (config.particleMaxSize - config.particleMinSize);
			opacities[i] =
				config.particleMinOpacity +
				Math.random() * (config.particleMaxOpacity - config.particleMinOpacity);

			// Vary colors slightly
			const hueShift = (Math.random() - 0.5) * 0.1;
			const color = baseColor.clone();
			color.offsetHSL(hueShift, 0, (Math.random() - 0.5) * 0.2);
			colors[i * 3] = color.r;
			colors[i * 3 + 1] = color.g;
			colors[i * 3 + 2] = color.b;
		}

		return { positions, sizes, opacities, colors, count };
	}, [config.particleCount, moodColor, config.primaryColor]);

	useFrame((state) => {
		if (!pointsRef.current) return;

		const time = state.clock.elapsedTime;
		const targetScale = calculateTargetScale(breathState, config);

		// Spring physics
		const stiffness = config.mainSpringTension * 0.0001;
		const damping = config.mainSpringFriction * 0.05;
		const force = (targetScale - scaleRef.current) * stiffness;
		velocityRef.current = velocityRef.current * (1 - damping) + force;
		scaleRef.current += velocityRef.current;

		// Rotate galaxy slowly
		pointsRef.current.rotation.z = time * 0.05;
		pointsRef.current.scale.setScalar(scaleRef.current);
	});

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
				<bufferAttribute
					attach="attributes-color"
					args={[particleData.colors, 3]}
				/>
			</bufferGeometry>
			<shaderMaterial
				vertexShader={`
					attribute float size;
					attribute float opacity;
					attribute vec3 color;
					varying float vOpacity;
					varying vec3 vColor;

					void main() {
						vOpacity = opacity;
						vColor = color;
						vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
						gl_PointSize = size * (300.0 / -mvPosition.z);
						gl_Position = projectionMatrix * mvPosition;
					}
				`}
				fragmentShader={`
					varying float vOpacity;
					varying vec3 vColor;

					void main() {
						float dist = length(gl_PointCoord - vec2(0.5));
						if (dist > 0.5) discard;
						float alpha = smoothstep(0.5, 0.0, dist) * vOpacity;
						gl_FragColor = vec4(vColor, alpha);
					}
				`}
				transparent
				depthWrite={false}
				blending={THREE.AdditiveBlending}
			/>
		</points>
	);
}
