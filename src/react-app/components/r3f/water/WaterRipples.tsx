import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { calculateTargetScale } from '../../../hooks/useBreathingSpring';
import type { BreathState } from '../../../hooks/useBreathSync';
import type { VisualizationConfig } from '../../../lib/config';

interface WaterRipplesProps {
	breathState: BreathState;
	config: VisualizationConfig;
	moodColor: string;
}

// Ripple ring vertex shader
const rippleVertexShader = `
  attribute float ringIndex;
  attribute float baseRadius;

  uniform float time;
  uniform float breathScale;
  uniform float rippleSpeed;
  uniform float rippleCount;

  varying float vRingIndex;
  varying float vAlpha;
  varying vec2 vUv;

  void main() {
    vRingIndex = ringIndex;
    vUv = uv;

    // Each ring expands outward over time, creating ripple effect
    float ringOffset = ringIndex / rippleCount;
    float ripplePhase = mod(time * rippleSpeed + ringOffset, 1.0);

    // Ripples expand as they travel outward
    float expandedRadius = baseRadius * (0.3 + ripplePhase * 1.5) * breathScale;

    // Fade out as ripples expand
    vAlpha = (1.0 - ripplePhase) * 0.6;

    // Apply wave distortion
    float waveAngle = atan(position.y, position.x);
    float wave = sin(waveAngle * 6.0 + time * 2.0) * 0.02 * breathScale;

    vec3 pos = position;
    pos.xy = normalize(pos.xy) * (expandedRadius + wave);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Ripple ring fragment shader
const rippleFragmentShader = `
  uniform vec3 color;
  uniform float ringWidth;

  varying float vRingIndex;
  varying float vAlpha;
  varying vec2 vUv;

  void main() {
    // Soft edge falloff for ring
    float edgeFade = smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
    float alpha = vAlpha * edgeFade;

    // Add subtle shimmer
    float shimmer = 0.8 + 0.2 * sin(vUv.x * 20.0 + vRingIndex * 3.14159);

    gl_FragColor = vec4(color * shimmer, alpha);
  }
`;

const RING_COUNT = 5;
const SEGMENTS = 128;

export function WaterRipples({
	breathState,
	config,
	moodColor,
}: WaterRipplesProps) {
	const groupRef = useRef<THREE.Group>(null);
	const materialsRef = useRef<THREE.ShaderMaterial[]>([]);
	const scaleRef = useRef(1);
	const velocityRef = useRef(0);
	const { size } = useThree();

	const baseSize = useMemo(() => {
		return Math.min(size.width, size.height) * 0.004;
	}, [size]);

	// Create ring geometries
	const rings = useMemo(() => {
		const ringData: {
			id: string;
			geometry: THREE.BufferGeometry;
			uniforms: Record<string, THREE.IUniform>;
		}[] = [];

		for (let r = 0; r < RING_COUNT; r++) {
			const geometry = new THREE.BufferGeometry();
			const positions: number[] = [];
			const uvs: number[] = [];
			const ringIndices: number[] = [];
			const baseRadii: number[] = [];

			const innerRadius = 0.95;
			const outerRadius = 1.0;

			// Create ring as triangle strip
			for (let i = 0; i <= SEGMENTS; i++) {
				const angle = (i / SEGMENTS) * Math.PI * 2;
				const cos = Math.cos(angle);
				const sin = Math.sin(angle);

				// Inner vertex
				positions.push(cos * innerRadius, sin * innerRadius, 0);
				uvs.push(i / SEGMENTS, 0);
				ringIndices.push(r);
				baseRadii.push(baseSize);

				// Outer vertex
				positions.push(cos * outerRadius, sin * outerRadius, 0);
				uvs.push(i / SEGMENTS, 1);
				ringIndices.push(r);
				baseRadii.push(baseSize);
			}

			// Create indices for triangle strip
			const indices: number[] = [];
			for (let i = 0; i < SEGMENTS; i++) {
				const base = i * 2;
				indices.push(base, base + 1, base + 2);
				indices.push(base + 1, base + 3, base + 2);
			}

			geometry.setAttribute(
				'position',
				new THREE.Float32BufferAttribute(positions, 3),
			);
			geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
			geometry.setAttribute(
				'ringIndex',
				new THREE.Float32BufferAttribute(ringIndices, 1),
			);
			geometry.setAttribute(
				'baseRadius',
				new THREE.Float32BufferAttribute(baseRadii, 1),
			);
			geometry.setIndex(indices);

			const uniforms = {
				time: { value: 0 },
				breathScale: { value: 1 },
				rippleSpeed: { value: 0.15 },
				rippleCount: { value: RING_COUNT },
				color: { value: new THREE.Color(moodColor || config.primaryColor) },
				ringWidth: { value: 0.05 },
			};

			ringData.push({ id: `ring-${r}`, geometry, uniforms });
		}

		return ringData;
	}, [baseSize, moodColor, config.primaryColor]);

	// Animation loop
	useFrame((state) => {
		if (!groupRef.current) return;

		const time = state.clock.elapsedTime;

		// Calculate breathing scale with spring physics
		const targetScale = calculateTargetScale(breathState, config);
		const stiffness = config.mainSpringTension * 0.0001;
		const damping = config.mainSpringFriction * 0.05;
		const force = (targetScale - scaleRef.current) * stiffness;
		velocityRef.current = velocityRef.current * (1 - damping) + force;
		scaleRef.current += velocityRef.current;

		// Update all ring materials
		materialsRef.current.forEach((material, index) => {
			if (material) {
				material.uniforms.time.value = time + index * 0.2;
				material.uniforms.breathScale.value = scaleRef.current;
			}
		});
	});

	return (
		<group ref={groupRef} position={[0, 0, -0.05]}>
			{rings.map((ring, idx) => (
				<mesh key={ring.id} geometry={ring.geometry}>
					<shaderMaterial
						ref={(mat) => {
							if (mat) materialsRef.current[idx] = mat;
						}}
						vertexShader={rippleVertexShader}
						fragmentShader={rippleFragmentShader}
						uniforms={ring.uniforms}
						transparent
						depthWrite={false}
						blending={THREE.AdditiveBlending}
						side={THREE.DoubleSide}
					/>
				</mesh>
			))}
		</group>
	);
}
