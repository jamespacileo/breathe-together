import { Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SPHERE_PHASE_COLORS } from '../../lib/colors';
import {
	glowFragmentShader,
	glowVertexShader,
	sphereFragmentShader,
	sphereVertexShader,
} from '../../shaders';
import type { EnhancedBreathData } from './GPGPUScene';

interface BreathingSphereProps {
	breathData: EnhancedBreathData;
	expandedRadius: number;
	contractedRadius: number;
}

/**
 * Breathing Sphere
 *
 * Central sphere that expands and contracts with breathing.
 * - Soft transparent sphere with phase-specific coloring
 * - Outer glow mesh with fresnel effect
 * - Scaling synchronized to breathPhase
 */
export function BreathingSphere({
	breathData,
	expandedRadius: _expandedRadius,
	contractedRadius,
}: BreathingSphereProps) {
	const sphereRef = useRef<THREE.Mesh>(null);
	const glowRef = useRef<THREE.Mesh>(null);
	const innerCoreRef = useRef<THREE.Mesh>(null);
	const sphereMaterialRef = useRef<THREE.ShaderMaterial>(null);
	const glowMaterialRef = useRef<THREE.ShaderMaterial>(null);
	const innerCoreMaterialRef = useRef<THREE.MeshBasicMaterial>(null);

	// Track current sphere scale for Sparkles positioning
	const currentScaleRef = useRef(contractedRadius * 0.5);

	// Sphere material with soft transparent shader
	// Uses centralized color palette for phase-specific hues
	const sphereMaterial = useMemo(() => {
		return new THREE.ShaderMaterial({
			vertexShader: sphereVertexShader,
			fragmentShader: sphereFragmentShader,
			uniforms: {
				uTime: { value: 0 },
				uBreathPhase: { value: 0 },
				uPhaseType: { value: 0 },
				uColorTemperature: { value: 0 },
				uCrystallization: { value: 0 },
				uColor1: { value: new THREE.Color(0x1a2a3a) },
				uColor2: { value: new THREE.Color(0x2a3a4a) },
				// Phase-specific hue colors from centralized palette
				// These are darker/muted versions for the sphere fill
				uInhaleHue: { value: new THREE.Color(0.25, 0.42, 0.52) },
				uHoldInHue: { value: new THREE.Color(0.28, 0.45, 0.5) },
				uExhaleHue: { value: new THREE.Color(0.3, 0.42, 0.52) },
				uHoldOutHue: { value: new THREE.Color(0.22, 0.38, 0.48) },
			},
			transparent: true,
			side: THREE.FrontSide,
			depthWrite: false,
		});
	}, []);

	// Outer glow material for soft energy effect
	// Uses extracted shader and centralized colors
	const glowMaterial = useMemo(() => {
		const { inhale, holdIn, exhale, holdOut } = SPHERE_PHASE_COLORS;
		return new THREE.ShaderMaterial({
			vertexShader: glowVertexShader,
			fragmentShader: glowFragmentShader,
			uniforms: {
				uBreathPhase: { value: 0 },
				uPhaseType: { value: 0 },
				uTime: { value: 0 },
				uInhaleColor: { value: new THREE.Color(inhale.r, inhale.g, inhale.b) },
				uHoldInColor: { value: new THREE.Color(holdIn.r, holdIn.g, holdIn.b) },
				uExhaleColor: { value: new THREE.Color(exhale.r, exhale.g, exhale.b) },
				uHoldOutColor: {
					value: new THREE.Color(holdOut.r, holdOut.g, holdOut.b),
				},
			},
			transparent: true,
			side: THREE.BackSide,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
		});
	}, []);

	// Animation loop
	useFrame((state) => {
		const time = state.clock.elapsedTime;
		const { breathPhase, phaseType, colorTemperature, crystallization } =
			breathData;

		// Update sphere material
		if (sphereMaterialRef.current) {
			const sphereUniforms = sphereMaterialRef.current.uniforms;
			sphereUniforms.uTime.value = time;
			sphereUniforms.uBreathPhase.value = breathPhase;
			sphereUniforms.uPhaseType.value = phaseType;
			sphereUniforms.uColorTemperature.value = colorTemperature;
			sphereUniforms.uCrystallization.value = crystallization;
		}

		// Scale sphere with breathing
		// breathPhase: 0 = exhaled (expanded), 1 = inhaled (contracted)
		if (sphereRef.current) {
			// Base contracted size when inhaled
			const minScale = contractedRadius * 0.35;
			// Maximum expanded size when exhaled
			const maxScale = contractedRadius * 0.7;
			// Interpolate: breathPhase=0 (exhaled) -> maxScale, breathPhase=1 (inhaled) -> minScale
			const sphereScale = minScale + (maxScale - minScale) * (1 - breathPhase);
			sphereRef.current.scale.setScalar(sphereScale);
			currentScaleRef.current = sphereScale;

			// Sync glow scale (slightly larger)
			if (glowRef.current) {
				glowRef.current.scale.setScalar(sphereScale * 1.15);
			}

			// Sync inner core scale (smaller, brighter center)
			if (innerCoreRef.current) {
				innerCoreRef.current.scale.setScalar(sphereScale * 0.3);
			}

			// Update inner core opacity based on breath phase
			if (innerCoreMaterialRef.current) {
				innerCoreMaterialRef.current.opacity = 0.12 + breathPhase * 0.08;
			}
		}

		// Update glow material
		if (glowMaterialRef.current) {
			glowMaterialRef.current.uniforms.uBreathPhase.value = breathPhase;
			glowMaterialRef.current.uniforms.uPhaseType.value = phaseType;
			glowMaterialRef.current.uniforms.uTime.value = time;
		}
	});

	// Base scale for Sparkles (use average scale)
	const sparkleScale = contractedRadius * 0.5 * 1.8;

	return (
		<group>
			{/* Inner luminous core - creates depth perception */}
			<mesh ref={innerCoreRef}>
				<sphereGeometry args={[1, 24, 24]} />
				<meshBasicMaterial
					ref={innerCoreMaterialRef}
					color="#c0e8f0"
					transparent
					opacity={0.12}
				/>
			</mesh>

			{/* Central sphere - soft transparent fill */}
			<mesh ref={sphereRef}>
				<sphereGeometry args={[1, 48, 48]} />
				<primitive object={sphereMaterial} ref={sphereMaterialRef} />
			</mesh>

			{/* Outer glow - soft energy aura */}
			<mesh ref={glowRef}>
				<sphereGeometry args={[1, 32, 32]} />
				<primitive object={glowMaterial} ref={glowMaterialRef} />
			</mesh>

			{/* Sparkles aura - twinkling magical particles */}
			<Sparkles
				count={40}
				scale={sparkleScale}
				size={1.2}
				speed={0.3 * (1 - breathData.crystallization)}
				opacity={0.5 + breathData.breathPhase * 0.3}
				color="#7ec8d4"
				noise={0.15}
			/>
		</group>
	);
}
