import { useFrame } from '@react-three/fiber';
import { memo, useMemo, useRef } from 'react';
import * as THREE from 'three';
import CustomShaderMaterial from 'three-custom-shader-material';
import { atmosphericHaloObj, useTheatreRef } from '../../../lib/theatre';
import { useTheatreBreath } from '../TheatreBreathProvider';

interface AtmosphericHaloProps {
	radius: number;
}

// Vertex shader - compute view position for fresnel calculations
// Note: vNormal is provided by CSM, do not redeclare
const vertexShader = /* glsl */ `
varying vec3 vViewPosition;

void main() {
	vViewPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
}
`;

// Fragment shader - soft atmospheric halo
// Note: vNormal is provided by CSM from base material
const fragmentShader = /* glsl */ `
uniform float uTime;
uniform float uBreathPhase;
uniform float uCrystallization;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uPulseAmount;
uniform float uFalloff;

varying vec3 vViewPosition;

void main() {
	// Inverted fresnel - stronger at edges, fading toward center
	vec3 viewDir = normalize(vViewPosition);
	float fresnel = 1.0 - abs(dot(viewDir, vNormal));

	// Soft falloff for atmospheric effect
	float haloIntensity = pow(fresnel, uFalloff);

	// Very soft inner fade
	float innerFade = 1.0 - pow(1.0 - fresnel, 4.0);
	haloIntensity *= innerFade;

	// Subtle breathing pulse
	float pulse = 1.0 + sin(uTime * 1.5) * uPulseAmount * (1.0 - uCrystallization);
	haloIntensity *= pulse;

	// Breath phase influence - slightly more visible on exhale
	float breathInfluence = 0.8 + (1.0 - uBreathPhase) * 0.3;
	haloIntensity *= breathInfluence;

	// Very low base opacity for subtle atmospheric effect
	float alpha = haloIntensity * uOpacity;

	csm_DiffuseColor = vec4(uColor, alpha);
}
`;

/**
 * Atmospheric Halo - Large soft atmospheric glow
 *
 * Creates a subtle atmospheric halo surrounding everything:
 * - Very low opacity for ethereal effect
 * - Additive blending for glow
 * - Subtle breath-synced intensity
 * - Inverted fresnel for edge glow
 * - Driven by Theatre.js for cinematic control
 * - Uses CustomShaderMaterial for consistent pattern with OrbGlow
 */
export const AtmosphericHalo = memo(({ radius }: AtmosphericHaloProps) => {
	const meshRef = useRef<THREE.Mesh>(null);
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	const theatreBreath = useTheatreBreath();

	// Use unified subscription helper (ref-only, no re-renders)
	const theatrePropsRef = useTheatreRef(atmosphericHaloObj);

	// Uniforms
	const uniforms = useMemo(
		() => ({
			uTime: { value: 0 },
			uBreathPhase: { value: 0 },
			uCrystallization: { value: 0 },
			uColor: { value: new THREE.Vector3(0.5, 0.78, 0.88) },
			uOpacity: { value: 0.12 },
			uPulseAmount: { value: 0.1 },
			uFalloff: { value: 3.0 },
		}),
		[],
	);

	// Animation loop
	useFrame((state) => {
		if (!(materialRef.current && meshRef.current)) return;

		const { breathPhase, crystallization } = theatreBreath.current;
		const theatreProps = theatrePropsRef.current;
		const time = state.clock.elapsedTime;

		// Update uniforms from Theatre.js props
		const u = materialRef.current.uniforms;
		u.uTime.value = time;
		u.uBreathPhase.value = breathPhase;
		u.uCrystallization.value = crystallization;
		u.uOpacity.value = theatreProps.opacity;
		u.uPulseAmount.value = theatreProps.pulseAmount;
		u.uFalloff.value = theatreProps.falloff;

		u.uColor.value.set(
			theatreProps.colorR,
			theatreProps.colorG,
			theatreProps.colorB,
		);

		// Update scale
		const minScale = radius * theatreProps.minScale;
		const maxScale = radius * theatreProps.maxScale;
		const currentScale = minScale + (maxScale - minScale) * (1 - breathPhase);
		meshRef.current.scale.setScalar(currentScale);
	});

	return (
		<mesh ref={meshRef} renderOrder={0}>
			<sphereGeometry args={[1, 32, 32]} />
			<CustomShaderMaterial
				ref={materialRef}
				baseMaterial={THREE.MeshBasicMaterial}
				vertexShader={vertexShader}
				fragmentShader={fragmentShader}
				uniforms={uniforms}
				transparent
				depthWrite={false}
				blending={THREE.AdditiveBlending}
				side={THREE.BackSide}
			/>
		</mesh>
	);
});
