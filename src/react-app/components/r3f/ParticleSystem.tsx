import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { calculateTargetScale } from '../../hooks/useBreathingSpring';
import type { BreathState } from '../../hooks/useBreathSync';
import type { PresenceData } from '../../hooks/usePresence';
import type { VisualizationConfig } from '../../lib/config';

interface ParticleSystemProps {
	breathState: BreathState;
	presence: PresenceData;
	config: VisualizationConfig;
	moodColor: string;
}

// Custom shader material for soft particles
const particleVertexShader = `
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

const particleFragmentShader = `
  uniform vec3 color;
  varying float vOpacity;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    float alpha = smoothstep(0.5, 0.1, dist) * vOpacity;
    gl_FragColor = vec4(color, alpha);
  }
`;

export function ParticleSystem({
	breathState,
	config,
	moodColor,
}: ParticleSystemProps) {
	const pointsRef = useRef<THREE.Points>(null);
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	const scaleRef = useRef(1);
	const velocityRef = useRef(0);

	// Generate particle data
	const particleData = useMemo(() => {
		const count = config.particleCount;
		const positions = new Float32Array(count * 3);
		const sizes = new Float32Array(count);
		const opacities = new Float32Array(count);
		const baseAngles = new Float32Array(count);
		const radiusMultipliers = new Float32Array(count);
		const angleOffsets = new Float32Array(count);
		const phaseOffsets = new Float32Array(count);

		for (let i = 0; i < count; i++) {
			// Initial position on a circle
			const angle = (i / count) * Math.PI * 2;
			baseAngles[i] = angle;
			radiusMultipliers[i] =
				config.radiusVarianceMin +
				Math.random() * (config.radiusVarianceMax - config.radiusVarianceMin);
			angleOffsets[i] = (Math.random() - 0.5) * config.angleOffsetRange;
			phaseOffsets[i] = Math.random() * Math.PI * 2;

			// Start at unit circle, will be scaled
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
			angleOffsets,
			phaseOffsets,
			count,
		};
	}, [config.particleCount]);

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
		if (!pointsRef.current) return;

		const time = state.clock.elapsedTime * 1000;

		// Calculate target scale with spring physics
		const targetScale = calculateTargetScale(breathState, config);

		// Manual spring simulation (stiffness and damping)
		const stiffness = config.mainSpringTension * 0.0001;
		const damping = config.mainSpringFriction * 0.05;
		const force = (targetScale - scaleRef.current) * stiffness;
		velocityRef.current = velocityRef.current * (1 - damping) + force;
		scaleRef.current += velocityRef.current;

		// Update particle positions
		const positions = pointsRef.current.geometry.attributes.position
			.array as Float32Array;
		const { baseAngles, radiusMultipliers, angleOffsets, phaseOffsets, count } =
			particleData;

		for (let i = 0; i < count; i++) {
			const wobble =
				Math.sin(time * config.wobbleSpeed + phaseOffsets[i]) *
				config.wobbleAmount;
			const angle = baseAngles[i] + angleOffsets[i] + wobble;
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
				vertexShader={particleVertexShader}
				fragmentShader={particleFragmentShader}
				uniforms={{
					color: { value: color },
				}}
				transparent
				depthWrite={false}
				blending={THREE.AdditiveBlending}
			/>
		</points>
	);
}
