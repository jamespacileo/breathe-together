import { PerformanceMonitor } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useMemo, useState } from 'react';
import * as THREE from 'three';
import type { BreathState } from '../../../hooks/useBreathSync';
import type { PresenceData } from '../../../hooks/usePresence';
import type { VisualizationConfig } from '../../../lib/config';
import type { UserIdentity } from '../../../stores/appStore';
import { WaterGrid } from './WaterGrid';

interface WaterBreathingSceneProps {
	breathState: BreathState;
	presence: PresenceData;
	config: VisualizationConfig;
	moodColor: string;
	currentUser?: UserIdentity | null;
}

/**
 * React Three Fiber canvas for the water breathing visualization
 * Uses a simple 3D grid that expands/contracts like fabric
 */
export function WaterBreathingScene({
	breathState,
	config,
	moodColor,
}: WaterBreathingSceneProps) {
	const [dpr, setDpr] = useState(1.5);

	// Camera settings - angled view looking at the grid
	const cameraSettings = useMemo(
		() => ({
			position: [0, -2, 5] as [number, number, number],
			fov: 50,
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
				{/* Main breathing grid - ethereal fabric effect */}
				<WaterGrid
					breathState={breathState}
					config={config}
					moodColor={moodColor}
				/>
			</Suspense>
		</Canvas>
	);
}
