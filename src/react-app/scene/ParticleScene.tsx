/**
 * ParticleScene - Main React Three Fiber Canvas wrapper
 * Renders 50K breathing particles with post-processing
 */
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Suspense } from 'react';
import type { BreathState } from '../core/breath';
import { Background } from './Background';
import { ParticleMesh } from './ParticleMesh';

interface ParticleSceneProps {
	breathState: BreathState;
}

function InnerScene({ breathState }: ParticleSceneProps) {
	return (
		<>
			{/* Background gradient */}
			<Background />

			{/* Main 50K particle system */}
			<ParticleMesh breathState={breathState} />

			{/* Post-processing effects */}
			<EffectComposer>
				<Vignette
					darkness={0.4}
					offset={0.35}
					blendFunction={BlendFunction.NORMAL}
				/>
				<Noise
					premultiply
					blendFunction={BlendFunction.SOFT_LIGHT}
					opacity={0.06}
				/>
			</EffectComposer>
		</>
	);
}

export function ParticleScene({ breathState }: ParticleSceneProps) {
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
