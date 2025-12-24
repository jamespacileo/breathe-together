import { PerformanceMonitor } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import type { BreathState } from '../../hooks/useBreathSync';
import type { PresenceData } from '../../hooks/usePresence';
import type { VisualizationConfig } from '../../lib/config';
import { BreathingSphere } from './nebula';

interface BreathingSceneProps {
	breathState: BreathState;
	presence: PresenceData;
	config: VisualizationConfig;
}

/**
 * Scene setup component that configures fog and background
 */
function SceneSetup() {
	const { scene } = useThree();

	useEffect(() => {
		// Dark background
		scene.background = new THREE.Color(0x06080c);
		// Subtle fog for depth
		scene.fog = new THREE.FogExp2(0x06080c, 0.08);

		return () => {
			scene.background = null;
			scene.fog = null;
		};
	}, [scene]);

	return null;
}

/**
 * React Three Fiber canvas wrapper for the breathing visualization
 * Simple floating particles that compress on inhale and expand on exhale
 */
export function BreathingScene({
	breathState,
	presence,
	config,
}: BreathingSceneProps) {
	const [dpr, setDpr] = useState(1.5);

	// Camera settings
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

			<SceneSetup />

			<Suspense fallback={null}>
				<BreathingSphere
					breathState={breathState}
					config={config}
					userCount={presence.count}
				/>
			</Suspense>
		</Canvas>
	);
}
