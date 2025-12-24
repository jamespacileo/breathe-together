import { PerformanceMonitor } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { BreathState } from '../../hooks/useBreathSync';
import type { PresenceData } from '../../hooks/usePresence';
import { getBreathValue } from '../../lib/breathUtils';
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
		// Dark background matching reference
		scene.background = new THREE.Color(0x0a0a12);
		// Subtle fog for depth
		scene.fog = new THREE.FogExp2(0x0a0a12, 0.06);

		return () => {
			scene.background = null;
			scene.fog = null;
		};
	}, [scene]);

	return null;
}

/**
 * Central glow sphere that pulses with breathing
 */
function GlowSphere({ breathState }: { breathState: BreathState }) {
	const meshRef = useRef<THREE.Mesh>(null);
	const materialRef = useRef<THREE.MeshBasicMaterial>(null);
	const breathStateRef = useRef(breathState);
	breathStateRef.current = breathState;

	useFrame(() => {
		if (!(meshRef.current && materialRef.current)) return;

		const breathPhase = getBreathValue(breathStateRef.current);

		// Glow sphere grows brighter and slightly larger when inhaled
		const glowScale = 0.2 + breathPhase * 0.2;
		meshRef.current.scale.set(glowScale, glowScale, glowScale);
		materialRef.current.opacity = 0.02 + breathPhase * 0.08;
	});

	return (
		<mesh ref={meshRef}>
			<sphereGeometry args={[1, 32, 32]} />
			<meshBasicMaterial
				ref={materialRef}
				color={0xffffff}
				transparent
				opacity={0.05}
			/>
		</mesh>
	);
}

/**
 * React Three Fiber canvas wrapper for the breathing visualization
 * Floating particles that compress on inhale and expand on exhale
 */
export function BreathingScene({
	breathState,
	presence,
	config,
}: BreathingSceneProps) {
	const [dpr, setDpr] = useState(1.5);

	// Camera settings - positioned to see the full particle sphere
	const cameraSettings = useMemo(
		() => ({
			position: [0, 0, 5] as [number, number, number],
			fov: 60,
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
				{/* Central glow sphere */}
				<GlowSphere breathState={breathState} />

				{/* Main particle system */}
				<BreathingSphere
					breathState={breathState}
					config={config}
					userCount={presence.count}
				/>
			</Suspense>
		</Canvas>
	);
}
