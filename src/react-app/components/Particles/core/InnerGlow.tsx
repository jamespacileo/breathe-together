import { useFrame } from '@react-three/fiber';
import { memo, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SPHERE_PHASE_COLORS } from '../../../lib/colors';

interface InnerGlowProps {
	radius: number;
	breathPhase: number;
	phaseType: number;
	crystallization: number;
}

// Vertex shader - pass position and normal to fragment
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

// Fragment shader - fresnel-based inner glow with phase colors
const fragmentShader = /* glsl */ `
uniform float uTime;
uniform float uBreathPhase;
uniform float uCrystallization;
uniform vec3 uPhaseColor;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
	// Fresnel effect - glow stronger at edges
	vec3 viewDir = normalize(vViewPosition);
	float fresnel = 1.0 - abs(dot(viewDir, vNormal));
	fresnel = pow(fresnel, 2.0);

	// Inner core glow - strongest at center
	float coreGlow = 1.0 - fresnel;
	coreGlow = pow(coreGlow, 1.5);

	// Combine fresnel edge and core glow
	float glowIntensity = fresnel * 0.6 + coreGlow * 0.4;

	// Subtle pulsing during active breathing, steady during holds
	float pulse = 1.0 + sin(uTime * 2.0) * 0.08 * (1.0 - uCrystallization);
	glowIntensity *= pulse;

	// Phase color with breath-responsive intensity
	vec3 color = uPhaseColor;

	// Add subtle white highlight at core
	vec3 coreHighlight = vec3(1.0) * coreGlow * 0.2;
	color = mix(color, color + coreHighlight, coreGlow);

	// Alpha based on glow intensity and breath phase
	float alpha = glowIntensity * (0.35 + uBreathPhase * 0.15);

	gl_FragColor = vec4(color, alpha);
}
`;

/**
 * Inner Glow - Soft fresnel-based inner light
 *
 * Creates a soft atmospheric glow inside the crystal:
 * - Fresnel effect for edge highlighting
 * - Core glow for depth
 * - Phase-specific color tinting
 * - Subtle pulsing animation
 */
export const InnerGlow = memo(
	({ radius, breathPhase, phaseType, crystallization }: InnerGlowProps) => {
		const meshRef = useRef<THREE.Mesh>(null);
		const materialRef = useRef<THREE.ShaderMaterial>(null);

		// Phase colors
		const phaseColors = useMemo(
			() => [
				new THREE.Vector3(
					SPHERE_PHASE_COLORS.inhale.r,
					SPHERE_PHASE_COLORS.inhale.g,
					SPHERE_PHASE_COLORS.inhale.b,
				),
				new THREE.Vector3(
					SPHERE_PHASE_COLORS.holdIn.r,
					SPHERE_PHASE_COLORS.holdIn.g,
					SPHERE_PHASE_COLORS.holdIn.b,
				),
				new THREE.Vector3(
					SPHERE_PHASE_COLORS.exhale.r,
					SPHERE_PHASE_COLORS.exhale.g,
					SPHERE_PHASE_COLORS.exhale.b,
				),
				new THREE.Vector3(
					SPHERE_PHASE_COLORS.holdOut.r,
					SPHERE_PHASE_COLORS.holdOut.g,
					SPHERE_PHASE_COLORS.holdOut.b,
				),
			],
			[],
		);

		// Create shader material
		const material = useMemo(() => {
			return new THREE.ShaderMaterial({
				vertexShader,
				fragmentShader,
				uniforms: {
					uTime: { value: 0 },
					uBreathPhase: { value: 0 },
					uCrystallization: { value: 0 },
					uPhaseColor: { value: new THREE.Vector3(0.42, 0.72, 0.82) },
				},
				transparent: true,
				depthWrite: false,
				blending: THREE.AdditiveBlending,
				side: THREE.FrontSide,
			});
		}, []);

		// Cleanup on unmount
		useEffect(() => {
			return () => {
				material.dispose();
			};
		}, [material]);

		// Calculate scale - slightly smaller than crystal core
		const minScale = radius * 0.32;
		const maxScale = radius * 0.65;
		const currentScale = minScale + (maxScale - minScale) * (1 - breathPhase);

		// Animation loop
		useFrame((state) => {
			if (!materialRef.current || !meshRef.current) return;

			const time = state.clock.elapsedTime;

			// Update uniforms
			materialRef.current.uniforms.uTime.value = time;
			materialRef.current.uniforms.uBreathPhase.value = breathPhase;
			materialRef.current.uniforms.uCrystallization.value = crystallization;

			// Update phase color
			const phaseColor = phaseColors[phaseType] || phaseColors[0];
			materialRef.current.uniforms.uPhaseColor.value.copy(phaseColor);

			// Update scale
			meshRef.current.scale.setScalar(currentScale);
		});

		return (
			<mesh ref={meshRef} renderOrder={2}>
				<sphereGeometry args={[1, 32, 32]} />
				<primitive object={material} ref={materialRef} attach="material" />
			</mesh>
		);
	},
);
