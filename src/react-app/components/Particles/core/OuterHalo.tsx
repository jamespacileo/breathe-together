import { useFrame } from '@react-three/fiber';
import { memo, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

interface OuterHaloProps {
	radius: number;
	breathPhase: number;
	phaseType: number;
	crystallization: number;
}

// Vertex shader - pass UV and position
const vertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
	vNormal = normalize(normalMatrix * normal);
	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
	vViewPosition = -mvPosition.xyz;
	gl_Position = projectionMatrix * mvPosition;
}
`;

// Fragment shader - soft atmospheric halo
const fragmentShader = /* glsl */ `
uniform float uTime;
uniform float uBreathPhase;
uniform float uCrystallization;
uniform vec3 uColor;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
	// Inverted fresnel - stronger at edges, fading toward center
	vec3 viewDir = normalize(vViewPosition);
	float fresnel = 1.0 - abs(dot(viewDir, vNormal));

	// Soft falloff for atmospheric effect
	float haloIntensity = pow(fresnel, 3.0);

	// Very soft inner fade
	float innerFade = 1.0 - pow(1.0 - fresnel, 4.0);
	haloIntensity *= innerFade;

	// Subtle breathing pulse
	float pulse = 1.0 + sin(uTime * 1.5) * 0.1 * (1.0 - uCrystallization);
	haloIntensity *= pulse;

	// Breath phase influence - slightly more visible on exhale
	float breathInfluence = 0.8 + (1.0 - uBreathPhase) * 0.3;
	haloIntensity *= breathInfluence;

	// Very low base opacity for subtle atmospheric effect
	float alpha = haloIntensity * 0.12;

	gl_FragColor = vec4(uColor, alpha);
}
`;

/**
 * Outer Halo - Large soft atmospheric glow
 *
 * Creates a subtle atmospheric halo surrounding everything:
 * - Very low opacity for ethereal effect
 * - Additive blending for glow
 * - Subtle breath-synced intensity
 * - Inverted fresnel for edge glow
 */
export const OuterHalo = memo(
	({ radius, breathPhase, phaseType, crystallization }: OuterHaloProps) => {
		const meshRef = useRef<THREE.Mesh>(null);
		const materialRef = useRef<THREE.ShaderMaterial>(null);

		// Create shader material
		const material = useMemo(() => {
			return new THREE.ShaderMaterial({
				vertexShader,
				fragmentShader,
				uniforms: {
					uTime: { value: 0 },
					uBreathPhase: { value: 0 },
					uCrystallization: { value: 0 },
					uColor: { value: new THREE.Vector3(0.5, 0.78, 0.88) }, // Soft cyan-blue
				},
				transparent: true,
				depthWrite: false,
				blending: THREE.AdditiveBlending,
				side: THREE.BackSide, // Render inside of sphere for halo effect
			});
		}, []);

		// Cleanup on unmount
		useEffect(() => {
			return () => {
				material.dispose();
			};
		}, [material]);

		// Calculate scale - larger than other elements
		const minScale = radius * 1.5;
		const maxScale = radius * 2.2;
		const currentScale = minScale + (maxScale - minScale) * (1 - breathPhase);

		// Animation loop
		useFrame((state) => {
			if (!materialRef.current || !meshRef.current) return;

			const time = state.clock.elapsedTime;

			// Update uniforms
			materialRef.current.uniforms.uTime.value = time;
			materialRef.current.uniforms.uBreathPhase.value = breathPhase;
			materialRef.current.uniforms.uCrystallization.value = crystallization;

			// Update scale
			meshRef.current.scale.setScalar(currentScale);
		});

		return (
			<mesh ref={meshRef} renderOrder={0}>
				<sphereGeometry args={[1, 32, 32]} />
				<primitive object={material} ref={materialRef} attach="material" />
			</mesh>
		);
	},
);
