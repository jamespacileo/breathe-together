import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { calculateTargetScale } from '../../../hooks/useBreathingSpring';
import type { BreathState } from '../../../hooks/useBreathSync';
import type { VisualizationConfig } from '../../../lib/config';

interface WaterGridProps {
	breathState: BreathState;
	config: VisualizationConfig;
	moodColor: string;
}

// Simplified vertex shader - just sin waves, no complex noise
const gridVertexShader = `
  uniform float time;
  uniform float breathScale;
  uniform float intensity;

  varying float vElevation;
  varying float vDistFromCenter;

  void main() {
    vec3 pos = position;

    // Distance from center
    float dist = length(pos.xy);
    vDistFromCenter = dist;

    // Scale XY with breathing
    pos.xy *= breathScale;

    // Simple layered sine waves
    float wave1 = sin(pos.x * 0.8 + time * 0.5) * sin(pos.y * 0.8 + time * 0.3) * 0.3;
    float wave2 = sin(pos.x * 1.5 - time * 0.4) * sin(pos.y * 1.2 + time * 0.6) * 0.15;
    float wave3 = sin(dist * 2.0 - time * 1.5) * 0.2 * intensity;

    // Combine waves
    float totalWave = wave1 + wave2 + wave3;

    // Soft edge fade
    float edgeFade = smoothstep(4.5, 1.0, dist);
    pos.z = totalWave * edgeFade * breathScale;

    vElevation = pos.z;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Line fragment shader
const lineFragmentShader = `
  uniform vec3 color;
  uniform float opacity;
  uniform float time;

  varying float vDistFromCenter;
  varying float vElevation;

  void main() {
    // Edge fade
    float edgeFade = smoothstep(4.0, 0.5, vDistFromCenter);

    // Brighter at wave peaks
    float glow = 0.7 + vElevation * 1.5;

    // Subtle pulse
    float pulse = 0.95 + 0.05 * sin(time * 1.2);

    vec3 finalColor = color * glow * pulse;

    // Highlight peaks
    float highlight = smoothstep(0.15, 0.35, vElevation);
    finalColor = mix(finalColor, vec3(1.0), highlight * 0.3);

    float alpha = opacity * edgeFade;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

const GRID_SIZE = 40;
const GRID_EXTENT = 5.0;

export function WaterGrid({ breathState, config, moodColor }: WaterGridProps) {
	const linesRef = useRef<THREE.LineSegments>(null);
	const lineMaterialRef = useRef<THREE.ShaderMaterial>(null);
	const scaleRef = useRef(1);
	const velocityRef = useRef(0);

	// Create grid line geometry
	const lineGeometry = useMemo(() => {
		const positions: number[] = [];
		const step = (GRID_EXTENT * 2) / GRID_SIZE;
		const half = GRID_EXTENT;

		// Horizontal lines
		for (let i = 0; i <= GRID_SIZE; i++) {
			const y = -half + i * step;
			positions.push(-half, y, 0);
			positions.push(half, y, 0);
		}

		// Vertical lines
		for (let i = 0; i <= GRID_SIZE; i++) {
			const x = -half + i * step;
			positions.push(x, -half, 0);
			positions.push(x, half, 0);
		}

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute(
			'position',
			new THREE.Float32BufferAttribute(positions, 3),
		);

		return geometry;
	}, []);

	// Get color from mood
	const color = useMemo(
		() => new THREE.Color(moodColor || config.primaryColor),
		[moodColor, config.primaryColor],
	);

	// Update color when mood changes
	useEffect(() => {
		if (lineMaterialRef.current) {
			lineMaterialRef.current.uniforms.color.value = color;
		}
	}, [color]);

	// Animation loop
	useFrame((state) => {
		const time = state.clock.elapsedTime;

		// Spring physics for breathing
		const targetScale = calculateTargetScale(breathState, config);
		const stiffness = config.mainSpringTension * 0.0001;
		const damping = config.mainSpringFriction * 0.05;
		const force = (targetScale - scaleRef.current) * stiffness;
		velocityRef.current = velocityRef.current * (1 - damping) + force;
		scaleRef.current += velocityRef.current;

		// More intensity during active breathing
		const isActive = breathState.phase === 'in' || breathState.phase === 'out';
		const intensity = isActive ? 0.7 + breathState.progress * 0.5 : 0.4;

		// Update shader uniforms
		if (lineMaterialRef.current) {
			lineMaterialRef.current.uniforms.time.value = time;
			lineMaterialRef.current.uniforms.breathScale.value = scaleRef.current;
			lineMaterialRef.current.uniforms.intensity.value = intensity;
		}
	});

	return (
		<group rotation={[-0.6, 0, 0]}>
			<lineSegments ref={linesRef} geometry={lineGeometry}>
				<shaderMaterial
					ref={lineMaterialRef}
					vertexShader={gridVertexShader}
					fragmentShader={lineFragmentShader}
					uniforms={{
						color: { value: color },
						opacity: { value: 0.8 },
						time: { value: 0 },
						breathScale: { value: 1 },
						intensity: { value: 1 },
					}}
					transparent
					depthWrite={false}
					blending={THREE.AdditiveBlending}
				/>
			</lineSegments>
		</group>
	);
}
