import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { calculateTargetScale } from '../../hooks/useBreathingSpring';
import type { BreathState } from '../../hooks/useBreathSync';
import type { PresenceData } from '../../hooks/usePresence';
import type { VisualizationConfig } from '../../lib/config';
import { generateShapePositions } from '../../lib/shapes';

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

/**
 * Calculate the target shape blend based on breath phase
 * Returns 0 for circle (exhaled/relaxed), 1 for shape (inhaled/formed)
 */
function calculateShapeBlend(breathState: BreathState): number {
	const { phase, progress } = breathState;

	switch (phase) {
		case 'in':
			// Breathing in: transition from circle (0) to shape (1)
			// Use easeInOutCubic for smooth transition
			return easeInOutCubic(progress);
		case 'hold-in':
			// Holding after inhale: stay in shape
			return 1;
		case 'out':
			// Breathing out: transition from shape (1) to circle (0)
			return 1 - easeInOutCubic(progress);
		case 'hold-out':
			// Holding after exhale: stay in circle
			return 0;
		default:
			return 0;
	}
}

/**
 * Easing function for smooth transitions
 */
function easeInOutCubic(t: number): number {
	return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function ParticleSystem({
	breathState,
	config,
	moodColor,
}: ParticleSystemProps) {
	const pointsRef = useRef<THREE.Points>(null);
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	const scaleRef = useRef(1);
	const velocityRef = useRef(0);

	// Per-particle velocity for shape spring physics
	const particleVelocitiesRef = useRef<Float32Array | null>(null);
	// Current particle positions (x, y for each)
	const currentPositionsRef = useRef<Float32Array | null>(null);

	// Generate circle positions (relaxed state)
	const circlePositions = useMemo(() => {
		const count = config.particleCount;
		const positions = new Float32Array(count * 2);
		for (let i = 0; i < count; i++) {
			const angle = (i / count) * Math.PI * 2;
			positions[i * 2] = Math.cos(angle);
			positions[i * 2 + 1] = Math.sin(angle);
		}
		return positions;
	}, [config.particleCount]);

	// Generate shape positions (formed state)
	const shapePositions = useMemo(() => {
		return generateShapePositions(config.shapeName, config.particleCount);
	}, [config.shapeName, config.particleCount]);

	// Generate particle data
	const particleData = useMemo(() => {
		const count = config.particleCount;
		const positions = new Float32Array(count * 3);
		const sizes = new Float32Array(count);
		const opacities = new Float32Array(count);
		const radiusMultipliers = new Float32Array(count);
		const phaseOffsets = new Float32Array(count);

		for (let i = 0; i < count; i++) {
			// Initial position on a circle
			const angle = (i / count) * Math.PI * 2;
			radiusMultipliers[i] =
				config.radiusVarianceMin +
				Math.random() * (config.radiusVarianceMax - config.radiusVarianceMin);
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

	// Initialize per-particle tracking arrays
	useEffect(() => {
		const count = config.particleCount;
		particleVelocitiesRef.current = new Float32Array(count * 2);
		currentPositionsRef.current = new Float32Array(count * 2);

		// Initialize current positions to circle
		for (let i = 0; i < count; i++) {
			currentPositionsRef.current[i * 2] = circlePositions[i * 2];
			currentPositionsRef.current[i * 2 + 1] = circlePositions[i * 2 + 1];
		}
	}, [config.particleCount, circlePositions]);

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
		if (!(particleVelocitiesRef.current && currentPositionsRef.current)) return;

		const time = state.clock.elapsedTime * 1000;

		// Calculate target scale with spring physics (for breathing size)
		const targetScale = calculateTargetScale(breathState, config);

		// Main breathing spring simulation
		const stiffness = config.mainSpringTension * 0.0001;
		const damping = config.mainSpringFriction * 0.05;
		const force = (targetScale - scaleRef.current) * stiffness;
		velocityRef.current = velocityRef.current * (1 - damping) + force;
		scaleRef.current += velocityRef.current;

		// Calculate shape blend (0 = circle, 1 = shape)
		const shapeBlend = config.shapeEnabled
			? calculateShapeBlend(breathState) * config.shapeFormationStrength
			: 0;

		// Shape spring physics parameters
		const shapeStiffness = config.shapeSpringTension * 0.0001;
		const shapeDamping = config.shapeSpringFriction * 0.05;

		// Update particle positions
		const positions = pointsRef.current.geometry.attributes.position
			.array as Float32Array;
		const { radiusMultipliers, phaseOffsets, count } = particleData;
		const velocities = particleVelocitiesRef.current;
		const currentPos = currentPositionsRef.current;

		for (let i = 0; i < count; i++) {
			// Calculate target position by interpolating between circle and shape
			const circleX = circlePositions[i * 2];
			const circleY = circlePositions[i * 2 + 1];
			const shapeX = shapePositions[i * 2];
			const shapeY = shapePositions[i * 2 + 1];

			// Lerp between circle and shape based on blend
			let targetX = circleX + (shapeX - circleX) * shapeBlend;
			let targetY = circleY + (shapeY - circleY) * shapeBlend;

			// Add subtle wobble
			const wobbleAmount =
				breathState.phase === 'hold-in'
					? config.shapeHoldWobble
					: config.wobbleAmount;
			const wobble =
				Math.sin(time * config.wobbleSpeed + phaseOffsets[i]) * wobbleAmount;

			// Apply wobble perpendicular to the shape
			const angle = Math.atan2(targetY, targetX);
			targetX += Math.cos(angle + Math.PI / 2) * wobble;
			targetY += Math.sin(angle + Math.PI / 2) * wobble;

			// Spring physics for smooth transitions
			const forceX = (targetX - currentPos[i * 2]) * shapeStiffness;
			const forceY = (targetY - currentPos[i * 2 + 1]) * shapeStiffness;

			velocities[i * 2] = velocities[i * 2] * (1 - shapeDamping) + forceX;
			velocities[i * 2 + 1] =
				velocities[i * 2 + 1] * (1 - shapeDamping) + forceY;

			currentPos[i * 2] += velocities[i * 2];
			currentPos[i * 2 + 1] += velocities[i * 2 + 1];

			// Apply global breathing scale and radius variance
			const scale = scaleRef.current * radiusMultipliers[i];
			positions[i * 3] = currentPos[i * 2] * scale;
			positions[i * 3 + 1] = currentPos[i * 2 + 1] * scale;
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
