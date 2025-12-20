import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { calculateTargetScale } from '../../../hooks/useBreathingSpring';
import type { BreathState } from '../../../hooks/useBreathSync';
import type { VisualizationConfig } from '../../../lib/config';

interface WaterBubblesProps {
	breathState: BreathState;
	config: VisualizationConfig;
	moodColor: string;
}

// Bubble vertex shader
const bubbleVertexShader = `
  attribute float size;
  attribute float opacity;
  attribute float phase;

  uniform float time;
  uniform float breathScale;

  varying float vOpacity;
  varying float vPhase;

  void main() {
    vOpacity = opacity;
    vPhase = phase;

    vec3 pos = position;

    // Bubbles rise upward, looping when they reach the top
    float riseSpeed = 0.15 + phase * 0.1;
    float yOffset = mod(time * riseSpeed + phase * 10.0, 4.0) - 2.0;
    pos.y += yOffset;

    // Gentle side-to-side sway as bubbles rise
    float swayAmount = 0.1 + phase * 0.05;
    float swaySpeed = 1.5 + phase * 0.5;
    pos.x += sin(time * swaySpeed + phase * 6.28) * swayAmount * breathScale;

    // Slight wobble
    pos.x += sin(time * 3.0 + phase * 12.0) * 0.02;
    pos.y += cos(time * 2.5 + phase * 8.0) * 0.015;

    // Fade at edges of view
    float edgeFade = smoothstep(-2.0, -1.5, pos.y) * smoothstep(2.0, 1.5, pos.y);
    vOpacity *= edgeFade;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = size * breathScale * (250.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Bubble fragment shader - creates sphere-like appearance
const bubbleFragmentShader = `
  uniform vec3 color;
  uniform float time;

  varying float vOpacity;
  varying float vPhase;

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    if (dist > 0.5) discard;

    // Create bubble edge (darker ring)
    float edge = smoothstep(0.35, 0.5, dist);

    // Inner highlight (light reflection)
    vec2 highlightPos = center + vec2(0.15, -0.15);
    float highlight = 1.0 - smoothstep(0.0, 0.2, length(highlightPos));

    // Secondary smaller highlight
    vec2 highlight2Pos = center + vec2(-0.1, 0.2);
    float highlight2 = (1.0 - smoothstep(0.0, 0.1, length(highlight2Pos))) * 0.5;

    // Combine for bubble look
    float alpha = (1.0 - dist * 1.5) * vOpacity;
    alpha *= 0.4 + edge * 0.3; // Semi-transparent with visible edge

    // Shimmer effect
    float shimmer = 0.9 + 0.1 * sin(time * 3.0 + vPhase * 20.0);

    vec3 bubbleColor = color * shimmer;
    bubbleColor += vec3(highlight * 0.5); // Add highlight
    bubbleColor += vec3(highlight2 * 0.3);

    // Iridescent effect - slight color shift
    float iridescence = sin(dist * 10.0 + time * 2.0 + vPhase * 5.0) * 0.1;
    bubbleColor.r += iridescence;
    bubbleColor.b -= iridescence;

    gl_FragColor = vec4(bubbleColor, alpha);
  }
`;

const BUBBLE_COUNT = 60;

export function WaterBubbles({
	breathState,
	config,
	moodColor,
}: WaterBubblesProps) {
	const pointsRef = useRef<THREE.Points>(null);
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	const scaleRef = useRef(1);
	const velocityRef = useRef(0);
	const { size } = useThree();

	// Generate bubble data
	const bubbleData = useMemo(() => {
		const positions = new Float32Array(BUBBLE_COUNT * 3);
		const sizes = new Float32Array(BUBBLE_COUNT);
		const opacities = new Float32Array(BUBBLE_COUNT);
		const phases = new Float32Array(BUBBLE_COUNT);

		const viewportScale = Math.min(size.width, size.height) * 0.002;

		for (let i = 0; i < BUBBLE_COUNT; i++) {
			// Spread bubbles in a circular area
			const angle = Math.random() * Math.PI * 2;
			const radius = Math.random() * 1.5 * viewportScale;

			positions[i * 3] = Math.cos(angle) * radius;
			positions[i * 3 + 1] = (Math.random() - 0.5) * 3; // Vertical spread
			positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5; // Small depth variation

			// Varied bubble sizes - mix of small and larger bubbles
			const sizeRand = Math.random();
			sizes[i] = sizeRand < 0.7 ? 2 + sizeRand * 4 : 5 + sizeRand * 8;

			opacities[i] = 0.3 + Math.random() * 0.4;
			phases[i] = Math.random();
		}

		return { positions, sizes, opacities, phases };
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
		if (!pointsRef.current || !materialRef.current) return;

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
					args={[bubbleData.positions, 3]}
				/>
				<bufferAttribute
					attach="attributes-size"
					args={[bubbleData.sizes, 1]}
				/>
				<bufferAttribute
					attach="attributes-opacity"
					args={[bubbleData.opacities, 1]}
				/>
				<bufferAttribute
					attach="attributes-phase"
					args={[bubbleData.phases, 1]}
				/>
			</bufferGeometry>
			<shaderMaterial
				ref={materialRef}
				vertexShader={bubbleVertexShader}
				fragmentShader={bubbleFragmentShader}
				uniforms={{
					color: { value: color },
					time: { value: 0 },
					breathScale: { value: 1 },
				}}
				transparent
				depthWrite={false}
				blending={THREE.NormalBlending}
			/>
		</points>
	);
}
