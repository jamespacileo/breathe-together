/**
 * Main Particle Scene Component
 * React Three Fiber canvas wrapper for the 50K particle breathing visualization
 * Integrates with existing BreathState and VisualizationConfig interfaces
 */

import { Canvas } from '@react-three/fiber';
import { EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Suspense, useMemo } from 'react';
import { applyEasing } from '../core/breath/easingCurves';
import { SPHERE } from '../core/constants';
import type { BreathState as CoreBreathState, PhaseType } from '../core/types';
import type { BreathState } from '../hooks/useBreathSync';
import type { VisualizationConfig } from '../lib/config';
import { ParticleMesh } from './ParticleMesh';
import { useParticleSystem } from './useParticleSystem';
import { useWordFormation } from './useWordFormation';

interface ParticleSceneProps {
	breathState: BreathState;
	config: VisualizationConfig;
	className?: string;
}

/**
 * Convert existing BreathState to core BreathState format
 */
function convertBreathState(state: BreathState): CoreBreathState {
	const phaseMap: Record<string, PhaseType> = {
		in: 'inhale',
		'hold-in': 'hold-full',
		out: 'exhale',
		'hold-out': 'hold-empty',
	};

	const phaseIndexMap: Record<string, 0 | 1 | 2 | 3> = {
		in: 0,
		'hold-in': 1,
		out: 2,
		'hold-out': 3,
	};

	const phase = phaseMap[state.phase] || 'inhale';
	const phaseIndex = phaseIndexMap[state.phase] ?? 0;
	const easedProgress = applyEasing(phase, state.progress);

	return {
		phase,
		phaseIndex,
		phaseProgress: state.progress,
		easedProgress,
		cycleProgress: state.cycleProgress,
	};
}

/**
 * Inner scene content - must be inside Canvas
 * Note: config is available for future use (sphere radius, colors, etc.)
 */
function InnerScene({ breathState, config: _config }: ParticleSceneProps) {
	const { system, isReady } = useParticleSystem();

	// Convert to core breath state format
	const coreBreathState = useMemo(
		() => convertBreathState(breathState),
		[breathState],
	);

	// Word formation (optional feature)
	useWordFormation(coreBreathState, system, { enabled: true });

	if (!(isReady && system)) {
		return null;
	}

	return (
		<>
			<ParticleMesh system={system} breathState={coreBreathState} />

			{/* Post-processing effects to match existing scene */}
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
 * Loading fallback
 */
function LoadingFallback() {
	return (
		<mesh>
			<sphereGeometry args={[0.5, 16, 16]} />
			<meshBasicMaterial color="#1a2a4a" wireframe />
		</mesh>
	);
}

/**
 * Main 50K particle scene with Canvas setup
 * Drop-in replacement for GPGPUScene
 */
export function ParticleScene({
	breathState,
	config,
	className,
}: ParticleSceneProps) {
	return (
		<div className={`w-full h-full ${className || ''}`}>
			<Canvas
				camera={{
					position: [0, 0, SPHERE.CAMERA_DISTANCE],
					fov: SPHERE.FOV,
					near: 0.1,
					far: 100,
				}}
				gl={{
					antialias: true,
					alpha: false,
					powerPreference: 'high-performance',
				}}
				dpr={[1, 2]}
				style={{ background: '#0a0a12' }}
			>
				<Suspense fallback={<LoadingFallback />}>
					<InnerScene breathState={breathState} config={config} />
				</Suspense>
			</Canvas>
		</div>
	);
}
