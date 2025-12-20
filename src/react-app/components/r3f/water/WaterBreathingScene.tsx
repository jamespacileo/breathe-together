import { Canvas } from '@react-three/fiber';
import { Suspense, useMemo } from 'react';
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
	// Camera settings - angled view looking at the grid
	const cameraSettings = useMemo(
		() => ({
			position: [0, -2, 8] as [number, number, number],
			fov: 50,
			near: 0.1,
			far: 100,
		}),
		[],
	);

	return (
		<Canvas
			dpr={[1, 2]}
			camera={cameraSettings}
			gl={{
				alpha: true,
				antialias: false,
				powerPreference: 'default',
				preserveDrawingBuffer: true,
			}}
			style={{
				position: 'absolute',
				inset: 0,
				background: 'transparent',
			}}
		>
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
