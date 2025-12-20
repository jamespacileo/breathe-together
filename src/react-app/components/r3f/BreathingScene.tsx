import { PerformanceMonitor } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useMemo, useState } from 'react';
import * as THREE from 'three';
import type { BreathState } from '../../hooks/useBreathSync';
import type { PresenceData } from '../../hooks/usePresence';
import type { VisualizationConfig } from '../../lib/config';
import type { UserIdentity } from '../../stores/appStore';
import { ANIMATIONS } from './animations';
import { GlowEffect } from './GlowEffect';
import { PresenceParticles } from './PresenceParticles';

interface BreathingSceneProps {
	breathState: BreathState;
	presence: PresenceData;
	config: VisualizationConfig;
	moodColor: string;
	currentUser?: UserIdentity | null;
}

/**
 * React Three Fiber canvas wrapper for the breathing visualization
 * Contains particle system, glow effects, and presence indicators
 */
export function BreathingScene({
	breathState,
	presence,
	config,
	moodColor,
	currentUser,
}: BreathingSceneProps) {
	const [dpr, setDpr] = useState(1.5);

	// Camera settings for 2D-like view
	const cameraSettings = useMemo(
		() => ({
			position: [0, 0, 5] as [number, number, number],
			fov: 75,
			near: 0.1,
			far: 100,
		}),
		[],
	);

	// Get the selected animation component from registry
	const AnimationComponent = ANIMATIONS[config.animationType].component;

	return (
		<Canvas
			dpr={dpr}
			camera={cameraSettings}
			gl={{
				alpha: true,
				antialias: true,
				toneMapping: THREE.NoToneMapping,
			}}
			style={{
				position: 'absolute',
				inset: 0,
				background: 'transparent',
			}}
		>
			{/* Performance monitor to auto-adjust quality */}
			<PerformanceMonitor
				onIncline={() => setDpr(Math.min(2, dpr + 0.5))}
				onDecline={() => setDpr(Math.max(1, dpr - 0.5))}
				flipflops={3}
				onFallback={() => setDpr(1)}
			/>

			<Suspense fallback={null}>
				{/* Main glow effect (behind particles) */}
				<GlowEffect
					breathState={breathState}
					config={config}
					moodColor={moodColor}
				/>

				{/* Central particle animation (selected by config) */}
				<AnimationComponent
					breathState={breathState}
					config={config}
					moodColor={moodColor}
				/>

				{/* Presence particles (orbital ring) */}
				<PresenceParticles
					breathState={breathState}
					presence={presence}
					config={config}
					currentUser={currentUser}
				/>
			</Suspense>
		</Canvas>
	);
}
