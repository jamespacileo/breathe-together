import { PerformanceMonitor } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useMemo, useState } from 'react';
import * as THREE from 'three';
import type { BreathState } from '../../../hooks/useBreathSync';
import type { PresenceData } from '../../../hooks/usePresence';
import type { VisualizationConfig } from '../../../lib/config';
import type { UserIdentity } from '../../../stores/appStore';
import { PresenceParticles } from '../PresenceParticles';
import { WaterBubbles } from './WaterBubbles';
import { WaterCaustics } from './WaterCaustics';
import { WaterGlow } from './WaterGlow';
import { WaterRipples } from './WaterRipples';
import { WaterSurface } from './WaterSurface';

interface WaterBreathingSceneProps {
	breathState: BreathState;
	presence: PresenceData;
	config: VisualizationConfig;
	moodColor: string;
	currentUser?: UserIdentity | null;
}

/**
 * React Three Fiber canvas for the water breathing visualization
 * Combines ripples, bubbles, caustics, and surface effects
 */
export function WaterBreathingScene({
	breathState,
	presence,
	config,
	moodColor,
	currentUser,
}: WaterBreathingSceneProps) {
	const [dpr, setDpr] = useState(1.5);

	// Camera settings for underwater view
	const cameraSettings = useMemo(
		() => ({
			position: [0, 0, 5] as [number, number, number],
			fov: 75,
			near: 0.1,
			far: 100,
		}),
		[],
	);

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
				{/* Caustic light patterns (deepest layer) */}
				<WaterCaustics
					breathState={breathState}
					config={config}
					moodColor={moodColor}
				/>

				{/* Central water glow (behind ripples) */}
				<WaterGlow
					breathState={breathState}
					config={config}
					moodColor={moodColor}
				/>

				{/* Expanding ripple rings */}
				<WaterRipples
					breathState={breathState}
					config={config}
					moodColor={moodColor}
				/>

				{/* Animated water surface */}
				<WaterSurface
					breathState={breathState}
					config={config}
					moodColor={moodColor}
				/>

				{/* Rising bubbles */}
				<WaterBubbles
					breathState={breathState}
					config={config}
					moodColor={moodColor}
				/>

				{/* Presence particles (orbital ring with other users) */}
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
