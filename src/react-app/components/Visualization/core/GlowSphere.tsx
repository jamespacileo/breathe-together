import { useFrame } from '@react-three/fiber';
import { memo, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SPHERE_PHASE_COLORS } from '../../../lib/colors';
import { useTheatreBreath } from '../TheatreBreathProvider';

interface GlowSphereProps {
	radius: number;
	theatreObject: any; // Theatre.js object
	side?: THREE.Side;
	renderOrder?: number;
	isInnerGlow?: boolean;
}

const PHASE_COLORS = [
	new THREE.Color(SPHERE_PHASE_COLORS.inhale.r, SPHERE_PHASE_COLORS.inhale.g, SPHERE_PHASE_COLORS.inhale.b),
	new THREE.Color(SPHERE_PHASE_COLORS.holdIn.r, SPHERE_PHASE_COLORS.holdIn.g, SPHERE_PHASE_COLORS.holdIn.b),
	new THREE.Color(SPHERE_PHASE_COLORS.exhale.r, SPHERE_PHASE_COLORS.exhale.g, SPHERE_PHASE_COLORS.exhale.b),
	new THREE.Color(SPHERE_PHASE_COLORS.holdOut.r, SPHERE_PHASE_COLORS.holdOut.g, SPHERE_PHASE_COLORS.holdOut.b),
];

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

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform float uBreathPhase;
uniform float uCrystallization;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uPulseAmount;
uniform float uFresnelPower;
uniform float uFalloff;
uniform bool uIsInnerGlow;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
	vec3 viewDir = normalize(vViewPosition);
	float dotProduct = abs(dot(viewDir, vNormal));
	
	float intensity;
	if (uIsInnerGlow) {
		// Inner glow: stronger at center, or fresnel-based
		float fresnel = 1.0 - dotProduct;
		intensity = pow(fresnel, uFresnelPower);
		
		// Add core glow
		float coreGlow = pow(1.0 - fresnel, 2.0);
		intensity = mix(intensity, intensity + coreGlow * 0.4, 0.5);
	} else {
		// Outer halo: stronger at edges, fading out
		float fresnel = 1.0 - dotProduct;
		intensity = pow(fresnel, uFalloff);
		
		// Soft inner fade for halo
		float innerFade = 1.0 - pow(1.0 - fresnel, 4.0);
		intensity *= innerFade;
	}

	// Breathing pulse
	float pulse = 1.0 + sin(uTime * 1.5) * uPulseAmount * (1.0 - uCrystallization);
	intensity *= pulse;

	// Breath phase influence
	float breathInfluence = 0.8 + (1.0 - uBreathPhase) * 0.3;
	intensity *= breathInfluence;

	gl_FragColor = vec4(uColor, intensity * uOpacity);
}
`;

export const GlowSphere = memo(({ 
	radius, 
	theatreObject, 
	side = THREE.FrontSide, 
	renderOrder = 0,
	isInnerGlow = false 
}: GlowSphereProps) => {
	const meshRef = useRef<THREE.Mesh>(null);
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	const theatreBreath = useTheatreBreath();
	const theatrePropsRef = useRef(theatreObject.value);

	useMemo(() => {
		theatreObject.onValuesChange((v: any) => {
			theatrePropsRef.current = v;
		});
	}, [theatreObject]);

	const uniforms = useMemo(() => ({
		uTime: { value: 0 },
		uBreathPhase: { value: 0 },
		uCrystallization: { value: 0 },
		uColor: { value: new THREE.Color() },
		uOpacity: { value: 1.0 },
		uPulseAmount: { value: 0.1 },
		uFresnelPower: { value: 2.0 },
		uFalloff: { value: 3.0 },
		uIsInnerGlow: { value: isInnerGlow }
	}), [isInnerGlow]);

	useFrame((state) => {
		if (!materialRef.current || !meshRef.current) return;

		const { breathPhase, phaseType, crystallization } = theatreBreath.current;
		const props = theatrePropsRef.current;
		const time = state.clock.elapsedTime;

		const u = materialRef.current.uniforms;
		u.uTime.value = time;
		u.uBreathPhase.value = breathPhase;
		u.uCrystallization.value = crystallization;
		u.uOpacity.value = props.opacity ?? props.glowIntensity ?? 1.0;
		u.uPulseAmount.value = props.pulseAmount ?? 0.1;
		u.uFresnelPower.value = props.fresnelPower ?? 2.0;
		u.uFalloff.value = props.falloff ?? 3.0;
		
		// Color logic
		const theatreColor = tempColor.setRGB(props.colorR, props.colorG, props.colorB);
		if (isInnerGlow) {
			const phaseColor = PHASE_COLORS[phaseType] || PHASE_COLORS[0];
			u.uColor.value.copy(phaseColor).lerp(theatreColor, 0.3);
		} else {
			u.uColor.value.copy(theatreColor);
		}

		// Scale
		const minS = props.minScale ?? props.scale ?? 1.0;
		const maxS = props.maxScale ?? (props.scale ? props.scale * 2 : 1.5);
		const currentScale = radius * (minS + (maxS - minS) * (1 - breathPhase));
		meshRef.current.scale.setScalar(currentScale);
	});

	return (
		<mesh ref={meshRef} renderOrder={renderOrder}>
			<sphereGeometry args={[1, 32, 32]} />
			<shaderMaterial
				ref={materialRef}
				vertexShader={vertexShader}
				fragmentShader={fragmentShader}
				uniforms={uniforms}
				transparent
				depthWrite={false}
				blending={THREE.AdditiveBlending}
				side={side}
			/>
		</mesh>
	);
});

const tempColor = new THREE.Color();

