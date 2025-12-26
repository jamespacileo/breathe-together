import { useFrame } from '@react-three/fiber';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { SPHERE_PHASE_COLORS } from '../../../lib/colors';
import { innerGlowObj } from '../../../lib/theatre';
import type { InnerGlowProps as TheatreGlowProps } from '../../../lib/theatre/types';
import { useTheatreBreath } from '../TheatreBreathProvider';

interface InnerGlowProps {
	radius: number;
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
uniform float uGlowIntensity;
uniform float uPulseAmount;
uniform float uFresnelPower;
uniform float uCoreGlowPower;
uniform float uEdgeHighlightPower;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
	// Fresnel effect - glow stronger at edges
	vec3 viewDir = normalize(vViewPosition);
	float fresnel = 1.0 - abs(dot(viewDir, vNormal));
	fresnel = pow(fresnel, uFresnelPower);

	// Inner core glow - strongest at center
	float coreGlow = 1.0 - fresnel;
	coreGlow = pow(coreGlow, uCoreGlowPower);

	// Combine fresnel edge and core glow
	float glowIntensity = fresnel * uEdgeHighlightPower + coreGlow * 0.4;

	// Subtle pulsing during active breathing, steady during holds
	float pulse = 1.0 + sin(uTime * 2.0) * uPulseAmount * (1.0 - uCrystallization);
	glowIntensity *= pulse;

	// Phase color with breath-responsive intensity
	vec3 color = uPhaseColor;

	// Add subtle white highlight at core
	vec3 coreHighlight = vec3(1.0) * coreGlow * 0.2;
	color = mix(color, color + coreHighlight, coreGlow);

	// Alpha based on glow intensity and breath phase
	float alpha = glowIntensity * uGlowIntensity * (0.35 + uBreathPhase * 0.15);

	gl_FragColor = vec4(color, alpha);
}
`;

/**
 * Inner Glow - Soft fresnel-based inner light
 *
 * Creates a soft atmospheric glow inside the crystal:
 * - Driven by Theatre.js for cinematic control
 * - Fresnel effect for edge highlighting
 * - Core glow for depth
 * - Phase-specific color tinting
 * - Subtle pulsing animation
 */
export const InnerGlow = memo(({ radius }: InnerGlowProps) => {
	const meshRef = useRef<THREE.Mesh>(null);
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	const theatreBreath = useTheatreBreath();
	const [theatreProps, setTheatreProps] = useState<TheatreGlowProps>(
		innerGlowObj.value,
	);

	// Subscribe to Theatre.js object changes
	useEffect(() => {
		const unsubscribe = innerGlowObj.onValuesChange((values) => {
			setTheatreProps(values);
		});
		return unsubscribe;
	}, []);

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
				uGlowIntensity: { value: 0.6 },
				uPulseAmount: { value: 0.08 },
				uFresnelPower: { value: 2.0 },
				uCoreGlowPower: { value: 1.5 },
				uEdgeHighlightPower: { value: 0.6 },
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

	// Animation loop
	useFrame((state) => {
		if (!(materialRef.current && meshRef.current)) return;

		const { breathPhase, phaseType, crystallization } = theatreBreath.current;
		const time = state.clock.elapsedTime;

		// Update uniforms from Theatre.js props
		materialRef.current.uniforms.uTime.value = time;
		materialRef.current.uniforms.uBreathPhase.value = breathPhase;
		materialRef.current.uniforms.uCrystallization.value = crystallization;
		materialRef.current.uniforms.uGlowIntensity.value =
			theatreProps.glowIntensity;
		materialRef.current.uniforms.uPulseAmount.value = theatreProps.pulseAmount;
		materialRef.current.uniforms.uFresnelPower.value =
			theatreProps.fresnelPower;
		materialRef.current.uniforms.uCoreGlowPower.value =
			theatreProps.coreGlowPower;
		materialRef.current.uniforms.uEdgeHighlightPower.value =
			theatreProps.edgeHighlightPower;

		// Update phase color (mix Theatre.js color with phase color)
		const phaseColor = phaseColors[phaseType] || phaseColors[0];
		const theatreColor = new THREE.Vector3(
			theatreProps.colorR,
			theatreProps.colorG,
			theatreProps.colorB,
		);
		// Blend phase color with Theatre.js base color
		materialRef.current.uniforms.uPhaseColor.value
			.copy(phaseColor)
			.lerp(theatreColor, 0.3);

		// Update scale
		const minScale = radius * theatreProps.scale;
		const maxScale = radius * theatreProps.scale * 2;
		const currentScale = minScale + (maxScale - minScale) * (1 - breathPhase);
		meshRef.current.scale.setScalar(currentScale);
	});

	return (
		<mesh ref={meshRef} renderOrder={2}>
			<sphereGeometry args={[1, 32, 32]} />
			<primitive object={material} ref={materialRef} attach="material" />
		</mesh>
	);
});
