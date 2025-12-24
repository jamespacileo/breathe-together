/**
 * Main Particle Scene Component
 * R3F Canvas wrapper for the 50K particle breathing visualization
 */

import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { getTemperatureShift } from '../core/breath/breathPhase';
import { applyEasing } from '../core/breath/easingCurves';
import type { BreathPresetId } from '../core/constants';
import type { BreathState, PhaseType, PhaseTypeNumber } from '../core/types';
import {
	type EnhancedBreathState,
	useBreathPhase,
} from '../hooks/useBreathPhase';
import type { BreathState as LegacyBreathState } from '../hooks/useBreathSync';
import { useParticleSystem } from '../hooks/useParticleSystem';
import { useWordFormation } from '../hooks/useWordFormation';

interface ParticleSceneProps {
	presetId?: BreathPresetId;
	// Optional: accept legacy breath state from existing app
	legacyBreathState?: LegacyBreathState;
}

interface InnerSceneProps {
	breathState: EnhancedBreathState;
}

/**
 * Convert legacy breath state to enhanced breath state
 */
function convertLegacyBreathState(
	legacy: LegacyBreathState,
): EnhancedBreathState {
	// Map legacy phase types to new phase types
	const phaseMap: Record<string, PhaseType> = {
		in: 'inhale',
		'hold-in': 'hold-full',
		out: 'exhale',
		'hold-out': 'hold-empty',
	};

	const phaseTypeMap: Record<string, PhaseTypeNumber> = {
		in: 0,
		'hold-in': 1,
		out: 2,
		'hold-out': 3,
	};

	const phase = phaseMap[legacy.phase] || 'inhale';
	const phaseTypeNumber = phaseTypeMap[legacy.phase] ?? 0;
	const easedProgress = applyEasing(phase, legacy.progress);

	// Create breath state for temperature calculation
	const breathState: BreathState = {
		phase,
		phaseProgress: legacy.progress,
		easedProgress,
		cycleProgress: legacy.cycleProgress,
		phaseTypeNumber,
	};

	return {
		...breathState,
		temperatureShift: getTemperatureShift(breathState),
	};
}

/**
 * Inner scene with particle system
 */
function ParticleMesh({ breathState }: InnerSceneProps) {
	const { system, compute, setTemperatureShift, setSphereConfig } =
		useParticleSystem();
	const { wordState } = useWordFormation(breathState as BreathState, system);
	const pointsRef = useRef(system.getPoints());

	// Set initial sphere config
	useEffect(() => {
		setSphereConfig(1.0, 0.3);
	}, [setSphereConfig]);

	// Animation loop
	useFrame((state) => {
		const time = state.clock.elapsedTime;

		// Convert EnhancedBreathState to BreathState
		const bs: BreathState = {
			phase: breathState.phase,
			phaseProgress: breathState.phaseProgress,
			easedProgress: breathState.easedProgress,
			cycleProgress: breathState.cycleProgress,
			phaseTypeNumber: breathState.phaseTypeNumber,
		};

		// Run simulation
		compute(time, bs, wordState ?? undefined);

		// Update temperature shift for color effects
		setTemperatureShift(breathState.temperatureShift);
	});

	return <primitive object={pointsRef.current} />;
}

/**
 * Background gradient
 */
function Background() {
	return (
		<mesh position={[0, 0, -50]}>
			<planeGeometry args={[200, 200]} />
			<meshBasicMaterial color="#0a0a12" />
		</mesh>
	);
}

/**
 * Inner scene with all elements
 */
function InnerScene({ breathState }: InnerSceneProps) {
	return (
		<>
			<Background />
			<ParticleMesh breathState={breathState} />

			{/* Post-processing */}
			<EffectComposer>
				<Vignette
					darkness={0.4}
					offset={0.35}
					blendFunction={BlendFunction.NORMAL}
				/>
				<Noise
					premultiply
					blendFunction={BlendFunction.SOFT_LIGHT}
					opacity={0.08}
				/>
			</EffectComposer>
		</>
	);
}

/**
 * Main exported component
 */
export function ParticleScene({
	presetId = 'box',
	legacyBreathState,
}: ParticleSceneProps) {
	// Use the new hook or convert legacy state
	const newBreathState = useBreathPhase(presetId);
	const breathState = useMemo(() => {
		if (legacyBreathState) {
			return convertLegacyBreathState(legacyBreathState);
		}
		return newBreathState;
	}, [legacyBreathState, newBreathState]);

	return (
		<div className="w-full h-full">
			<Canvas
				camera={{ position: [0, 0, 4], fov: 50 }}
				gl={{
					antialias: true,
					alpha: false,
					powerPreference: 'high-performance',
				}}
				dpr={[1, 2]}
				style={{ background: '#0a0a12' }}
			>
				<Suspense fallback={null}>
					<InnerScene breathState={breathState} />
				</Suspense>
			</Canvas>
		</div>
	);
}
