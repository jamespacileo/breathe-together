import { Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type * as THREE from 'three';
import type { EnhancedBreathData } from '../../hooks/useEnhancedBreathData';
import {
	createGlowMaterial,
	createSphereMaterial,
	updateGlowMaterialUniforms,
	updateSphereMaterialUniforms,
} from '../../lib/materials';

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
	const sphereMaterialRef = useRef<THREE.ShaderMaterial>(null);
	const glowMaterialRef = useRef<THREE.ShaderMaterial>(null);

	// Create materials using factory
	const sphereMaterial = useMemo(() => createSphereMaterial(), []);
	const glowMaterial = useMemo(() => createGlowMaterial(), []);

	// Animation loop
	useFrame((state) => {
		const time = state.clock.elapsedTime;
		const { breathPhase, phaseType, colorTemperature, crystallization } =
			breathData;

		// Update sphere material using helper
		if (sphereMaterialRef.current) {
			updateSphereMaterialUniforms(
				sphereMaterialRef.current,
				breathPhase,
				phaseType,
				colorTemperature,
				crystallization,
				time,
			);
		}

		// Scale sphere with breathing
		// breathPhase: 0 = exhaled (expanded), 1 = inhaled (contracted)
		if (sphereRef.current) {
			const minScale = contractedRadius * 0.35;
			const maxScale = contractedRadius * 0.7;
			const sphereScale = minScale + (maxScale - minScale) * (1 - breathPhase);
			sphereRef.current.scale.setScalar(sphereScale);

			// Sync glow scale (inner core now handled by shader)
			if (glowRef.current) {
				glowRef.current.scale.setScalar(sphereScale * 1.15);
			}
		}

		// Update glow material using helper
		if (glowMaterialRef.current) {
			updateGlowMaterialUniforms(glowMaterialRef.current, breathPhase, phaseType, time);
		}
	});

	// Base scale for Sparkles
	const sparkleScale = contractedRadius * 0.5 * 1.8;

	return (
		<group>
			{/* Central sphere - soft transparent fill with integrated inner core glow */}
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
