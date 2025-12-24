import { PerformanceMonitor } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { Suspense, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import type { BreathState } from '../../hooks/useBreathSync';
import type { PresenceData } from '../../hooks/usePresence';
import type { VisualizationConfig } from '../../lib/visualConfig';
import { Haze, Lines, Sphere } from './nebula';

interface SceneProps {
	breathState: BreathState;
	presence: PresenceData;
	config: VisualizationConfig;
}

/**
 * Scene setup component that configures fog and background for nebula mode
 * Matches the HTML example exactly
 */
function NebulaSceneSetup({ enabled }: { enabled: boolean }) {
	const { scene } = useThree();

	useEffect(() => {
		if (enabled) {
			// Dark background matching HTML example (0x06080c)
			scene.background = new THREE.Color(0x06080c);
			// Exponential fog for depth fading
			scene.fog = new THREE.FogExp2(0x06080c, 0.12);
		} else {
			// Clear for non-nebula modes
			scene.background = null;
			scene.fog = null;
		}

		return () => {
			scene.background = null;
			scene.fog = null;
		};
	}, [enabled, scene]);

	return null;
}

interface BreathingSphereSystemProps {
	breathState: BreathState;
	config: VisualizationConfig;
	userCount: number;
}

/**
 * Combined 3D breathing sphere visualization system
 * Includes main particles, haze layer, and connection lines
 */
function BreathingSphereSystem({
	breathState,
	config,
	userCount,
}: BreathingSphereSystemProps) {
	// Create shared particle positions buffer for connection lines
	const particlePositionsRef = useMemo(() => {
		const count = Math.max(1, Math.min(userCount, 500));
		const expandedRadius = config.sphereExpandedRadius ?? 2.2;
		const positions = new Float32Array(count * 3);

		for (let i = 0; i < count; i++) {
			const phi = Math.acos(1 - (2 * (i + 0.5)) / Math.max(count, 1));
			const theta = Math.PI * (1 + Math.sqrt(5)) * i;
			const baseRadius = expandedRadius * (0.3 + Math.random() * 0.7);

			positions[i * 3] = baseRadius * Math.sin(phi) * Math.cos(theta);
			positions[i * 3 + 1] = baseRadius * Math.sin(phi) * Math.sin(theta);
			positions[i * 3 + 2] = baseRadius * Math.cos(phi);
		}

		return positions;
	}, [userCount, config.sphereExpandedRadius]);

	const particleCount = Math.max(1, Math.min(userCount, 500));

	return (
		<>
			{/* Background haze layer */}
			{config.hazeEnabled ? (
				<Haze breathState={breathState} config={config} userCount={userCount} />
			) : null}

			{/* Main breathing sphere */}
			<Sphere breathState={breathState} config={config} userCount={userCount} />

			{/* Connection lines between nearby particles */}
			{config.connectionEnabled && userCount > 1 && (
				<Lines
					breathState={breathState}
					config={config}
					particlePositions={particlePositionsRef}
					particleCount={particleCount}
				/>
			)}
		</>
	);
}

/**
 * React Three Fiber canvas wrapper for the breathing visualization
 * Renders the 3D breathing sphere with particles representing users
 */
export function Scene({ breathState, presence, config }: SceneProps) {
	const [dpr, setDpr] = useState(1.5);

	// Camera settings for 3D sphere view
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

			{/* Scene setup for nebula mode (fog + dark background) */}
			<NebulaSceneSetup enabled={config.nebulaEnabled ?? false} />

			<Suspense fallback={null}>
				{/* 3D Breathing Sphere visualization */}
				<BreathingSphereSystem
					breathState={breathState}
					config={config}
					userCount={presence.count}
				/>
			</Suspense>

			{/* Post-processing bloom effect */}
			{config.bloomEnabled ? (
				<EffectComposer>
					<Bloom
						luminanceThreshold={config.bloomThreshold}
						luminanceSmoothing={0.9}
						intensity={config.bloomStrength}
						radius={config.bloomRadius}
					/>
				</EffectComposer>
			) : null}
		</Canvas>
	);
}

// Also export with old name for backwards compatibility
export { Scene as BreathingScene };
