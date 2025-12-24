import { Canvas } from '@react-three/fiber';
import {
	Bloom,
	ChromaticAberration,
	EffectComposer,
	Noise,
	Vignette,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import type { BreathState } from '../../hooks/useBreathSync';
import type { VisualizationConfig } from '../../lib/config';
import { GPGPUParticleSystem } from './GPGPUParticleSystem';
import { NebulaBackground } from './NebulaBackground';
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

function AmbientGlow({ breathPhase }: { breathPhase: number }) {
	const glowScale = 1 + breathPhase * 1.5;
	const glowOpacity = 0.02 + breathPhase * 0.03;

	return (
		<mesh
			scale={[glowScale * 3, glowScale * 3, glowScale * 3]}
			renderOrder={-1}
		>
			<sphereGeometry args={[1, 32, 32]} />
			<meshBasicMaterial
				color={0x4080a0}
				transparent
				opacity={glowOpacity}
				blending={THREE.AdditiveBlending}
				depthWrite={false}
			/>
		</mesh>
	);
}

function InnerScene({ breathState, config }: GPGPUSceneProps) {
	const { breathPhase, phaseType } = useMemo(
		() => getBreathData(breathState),
		[breathState],
	);

	const expandedRadius = config.sphereExpandedRadius * PARTICLE_RADIUS_SCALE;
	const contractedRadius =
		config.sphereContractedRadius * PARTICLE_RADIUS_SCALE;

	// Dynamic bloom intensity based on breath phase
	const bloomIntensity = useMemo(() => {
		return 0.8 + breathPhase * 0.6;
	}, [breathPhase]);

	// Dynamic chromatic aberration based on breath phase
	const chromaticOffset = useMemo(() => {
		const intensity = 0.0003 + breathPhase * 0.0005;
		return new THREE.Vector2(intensity, intensity);
	}, [breathPhase]);

	return (
		<>
			{/* Nebula background */}
			<NebulaBackground breathPhase={breathPhase} />

			{/* Star field */}
			<StarField breathPhase={breathPhase} count={400} />

			{/* Main particle system */}
			<GPGPUParticleSystem
				breathPhase={breathPhase}
				phaseType={phaseType}
				expandedRadius={expandedRadius}
				contractedRadius={contractedRadius}
			/>

			{/* Ambient glow sphere */}
			<AmbientGlow breathPhase={breathPhase} />

			{/* Post-processing effects */}
			<EffectComposer>
				<Bloom
					intensity={bloomIntensity}
					luminanceThreshold={0.2}
					luminanceSmoothing={0.9}
					radius={0.8}
					mipmapBlur
				/>
				<ChromaticAberration
					offset={chromaticOffset}
					radialModulation={false}
					modulationOffset={0}
					blendFunction={BlendFunction.NORMAL}
				/>
				<Vignette
					darkness={0.5}
					offset={0.3}
					blendFunction={BlendFunction.NORMAL}
				/>
				<Noise
					premultiply
					blendFunction={BlendFunction.SOFT_LIGHT}
					opacity={0.15}
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
