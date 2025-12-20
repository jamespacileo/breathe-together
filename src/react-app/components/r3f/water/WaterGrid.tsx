import { useFrame, useThree } from '@react-three/fiber';
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

// Grid vertex shader - creates wave distortion on a flat plane
const gridVertexShader = `
  uniform float time;
  uniform float breathScale;
  uniform float waveAmplitude;
  uniform float waveFrequency;

  varying vec2 vUv;
  varying float vElevation;
  varying float vDistFromCenter;

  void main() {
    vUv = uv;

    vec3 pos = position;

    // Distance from center for radial effects
    float dist = length(pos.xy);
    vDistFromCenter = dist;

    // Scale position with breathing
    pos.xy *= breathScale;

    // Multiple wave layers for organic movement
    float wave1 = sin(dist * waveFrequency - time * 1.2) * waveAmplitude;
    float wave2 = sin(dist * waveFrequency * 1.5 + time * 0.8) * waveAmplitude * 0.5;
    float wave3 = cos(pos.x * 2.0 + pos.y * 2.0 + time) * waveAmplitude * 0.3;

    // Combine waves - stronger in center, fading at edges
    float edgeFade = smoothstep(2.0, 0.5, dist);
    pos.z = (wave1 + wave2 + wave3) * edgeFade * breathScale;

    vElevation = pos.z;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Grid fragment shader - ethereal glow effect
const gridFragmentShader = `
  uniform vec3 color;
  uniform float opacity;
  uniform float time;

  varying vec2 vUv;
  varying float vElevation;
  varying float vDistFromCenter;

  void main() {
    // Fade out towards edges
    float edgeFade = smoothstep(1.8, 0.3, vDistFromCenter);

    // Glow based on wave elevation
    float glow = 0.5 + vElevation * 3.0;

    // Subtle pulse
    float pulse = 0.9 + 0.1 * sin(time * 0.5);

    // Final color with ethereal glow
    vec3 finalColor = color * glow * pulse;

    // Add slight highlight at peaks
    finalColor += vec3(0.1) * max(0.0, vElevation * 5.0);

    float alpha = opacity * edgeFade;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// Line vertex shader for grid lines
const lineVertexShader = `
  uniform float time;
  uniform float breathScale;
  uniform float waveAmplitude;
  uniform float waveFrequency;

  varying float vDistFromCenter;
  varying float vElevation;

  void main() {
    vec3 pos = position;

    float dist = length(pos.xy);
    vDistFromCenter = dist;

    // Scale with breathing
    pos.xy *= breathScale;

    // Same wave pattern as surface
    float wave1 = sin(dist * waveFrequency - time * 1.2) * waveAmplitude;
    float wave2 = sin(dist * waveFrequency * 1.5 + time * 0.8) * waveAmplitude * 0.5;
    float wave3 = cos(pos.x * 2.0 + pos.y * 2.0 + time) * waveAmplitude * 0.3;

    float edgeFade = smoothstep(2.0, 0.5, dist);
    pos.z = (wave1 + wave2 + wave3) * edgeFade * breathScale;

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
    float edgeFade = smoothstep(1.8, 0.2, vDistFromCenter);

    // Brighter at wave peaks
    float glow = 0.6 + vElevation * 4.0;

    vec3 finalColor = color * glow;

    float alpha = opacity * edgeFade;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

const GRID_SIZE = 48;
const GRID_EXTENT = 2.0;

export function WaterGrid({ breathState, config, moodColor }: WaterGridProps) {
	const meshRef = useRef<THREE.Mesh>(null);
	const linesRef = useRef<THREE.LineSegments>(null);
	const surfaceMaterialRef = useRef<THREE.ShaderMaterial>(null);
	const lineMaterialRef = useRef<THREE.ShaderMaterial>(null);
	const scaleRef = useRef(1);
	const velocityRef = useRef(0);
	const { size } = useThree();

	// Create grid geometry
	const { surfaceGeometry, lineGeometry } = useMemo(() => {
		// Surface mesh
		const surface = new THREE.PlaneGeometry(
			GRID_EXTENT * 2,
			GRID_EXTENT * 2,
			GRID_SIZE,
			GRID_SIZE,
		);

		// Create line geometry for grid wireframe
		const linePositions: number[] = [];

		const step = (GRID_EXTENT * 2) / GRID_SIZE;
		const half = GRID_EXTENT;

		// Horizontal lines
		for (let i = 0; i <= GRID_SIZE; i++) {
			const y = -half + i * step;
			linePositions.push(-half, y, 0);
			linePositions.push(half, y, 0);
		}

		// Vertical lines
		for (let i = 0; i <= GRID_SIZE; i++) {
			const x = -half + i * step;
			linePositions.push(x, -half, 0);
			linePositions.push(x, half, 0);
		}

		const lines = new THREE.BufferGeometry();
		lines.setAttribute(
			'position',
			new THREE.Float32BufferAttribute(linePositions, 3),
		);

		return { surfaceGeometry: surface, lineGeometry: lines };
	}, []);

	// Update colors when mood changes
	useEffect(() => {
		const color = new THREE.Color(moodColor || config.primaryColor);
		if (surfaceMaterialRef.current) {
			surfaceMaterialRef.current.uniforms.color.value = color;
		}
		if (lineMaterialRef.current) {
			lineMaterialRef.current.uniforms.color.value = color;
		}
	}, [moodColor, config.primaryColor]);

	// Animation loop
	useFrame((state) => {
		const time = state.clock.elapsedTime;

		// Calculate breathing scale with spring physics
		const targetScale = calculateTargetScale(breathState, config);
		const stiffness = config.mainSpringTension * 0.0001;
		const damping = config.mainSpringFriction * 0.05;
		const force = (targetScale - scaleRef.current) * stiffness;
		velocityRef.current = velocityRef.current * (1 - damping) + force;
		scaleRef.current += velocityRef.current;

		// Update surface material
		if (surfaceMaterialRef.current) {
			surfaceMaterialRef.current.uniforms.time.value = time;
			surfaceMaterialRef.current.uniforms.breathScale.value = scaleRef.current;
		}

		// Update line material
		if (lineMaterialRef.current) {
			lineMaterialRef.current.uniforms.time.value = time;
			lineMaterialRef.current.uniforms.breathScale.value = scaleRef.current;
		}
	});

	const color = useMemo(
		() => new THREE.Color(moodColor || config.primaryColor),
		[moodColor, config.primaryColor],
	);

	const viewportScale = Math.min(size.width, size.height) * 0.0012;

	return (
		<group scale={[viewportScale, viewportScale, viewportScale]}>
			{/* Subtle surface fill */}
			<mesh ref={meshRef} geometry={surfaceGeometry}>
				<shaderMaterial
					ref={surfaceMaterialRef}
					vertexShader={gridVertexShader}
					fragmentShader={gridFragmentShader}
					uniforms={{
						color: { value: color },
						opacity: { value: 0.08 },
						time: { value: 0 },
						breathScale: { value: 1 },
						waveAmplitude: { value: 0.15 },
						waveFrequency: { value: 3.0 },
					}}
					transparent
					depthWrite={false}
					blending={THREE.AdditiveBlending}
					side={THREE.DoubleSide}
				/>
			</mesh>

			{/* Grid lines */}
			<lineSegments ref={linesRef} geometry={lineGeometry}>
				<shaderMaterial
					ref={lineMaterialRef}
					vertexShader={lineVertexShader}
					fragmentShader={lineFragmentShader}
					uniforms={{
						color: { value: color },
						opacity: { value: 0.25 },
						time: { value: 0 },
						breathScale: { value: 1 },
						waveAmplitude: { value: 0.15 },
						waveFrequency: { value: 3.0 },
					}}
					transparent
					depthWrite={false}
					blending={THREE.AdditiveBlending}
				/>
			</lineSegments>
		</group>
	);
}
