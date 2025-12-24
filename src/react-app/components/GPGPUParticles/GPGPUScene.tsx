import { Canvas } from '@react-three/fiber';
import { EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Suspense, useMemo } from 'react';
import type { BreathState } from '../../hooks/useBreathSync';
import type { VisualizationConfig } from '../../lib/config';
import { GPGPUParticleSystem } from './GPGPUParticleSystem';
import { StarField } from './StarField';

interface GPGPUSceneProps {
	breathState: BreathState;
	config: VisualizationConfig;
}

// Scale factor to convert config sphere radius to particle system units
const PARTICLE_RADIUS_SCALE = 10;

// Easing function for smooth breathing
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

// Calculate breath data from state
function getBreathData(state: BreathState): {
	breathPhase: number;
	phaseType: number;
} {
	const { phase, progress } = state;

	switch (phase) {
		case 'in':
			return { breathPhase: easeInOutSine(progress), phaseType: 0 };
		case 'hold-in':
			return { breathPhase: 1, phaseType: 1 };
		case 'out':
			return { breathPhase: 1 - easeInOutSine(progress), phaseType: 2 };
		case 'hold-out':
			return { breathPhase: 0, phaseType: 3 };
		default:
			return { breathPhase: 0, phaseType: 0 };
	}
}

function InnerScene({ breathState, config }: GPGPUSceneProps) {
	const { breathPhase, phaseType } = useMemo(
		() => getBreathData(breathState),
		[breathState],
	);

	const expandedRadius = config.sphereExpandedRadius * PARTICLE_RADIUS_SCALE;
	const contractedRadius =
		config.sphereContractedRadius * PARTICLE_RADIUS_SCALE;

	return (
		<>
			{/* Distant star field for depth */}
			<StarField breathPhase={breathPhase} count={200} />

			{/* Main particle system with central sphere */}
			<GPGPUParticleSystem
				breathPhase={breathPhase}
				phaseType={phaseType}
				expandedRadius={expandedRadius}
				contractedRadius={contractedRadius}
			/>

			{/* Minimal post-processing - no bloom */}
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

export function GPGPUScene({ breathState, config }: GPGPUSceneProps) {
	return (
		<div className="w-full h-full">
			<Canvas
				camera={{ position: [0, 0, 50], fov: 60 }}
				gl={{
					antialias: true,
					alpha: false,
					powerPreference: 'high-performance',
				}}
				dpr={[1, 2]}
				style={{ background: '#0a0a12' }}
			>
				<Suspense fallback={null}>
					<InnerScene breathState={breathState} config={config} />
				</Suspense>
			</Canvas>
		</div>
	);
}
