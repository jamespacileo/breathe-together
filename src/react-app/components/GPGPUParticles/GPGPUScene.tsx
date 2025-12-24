import { Canvas } from '@react-three/fiber';
import { EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { BreathState } from '../../hooks/useBreathSync';
import {
	applyBreathEasing,
	getAnticipationFactor,
	getBreathWaveIntensity,
	getColorTemperature,
	getCrystallizationFactor,
	getDiaphragmDirection,
	getOvershootFactor,
} from '../../lib/breathEasing';
import type { VisualizationConfig } from '../../lib/config';
import { GPGPUParticleSystem } from './GPGPUParticleSystem';
import { PeripheralParticles } from './PeripheralParticles';
import { StarField } from './StarField';

interface GPGPUSceneProps {
	breathState: BreathState;
	config: VisualizationConfig;
}

// Scale factor to convert config sphere radius to particle system units
const PARTICLE_RADIUS_SCALE = 10;

// Enhanced breath data with all subtle effects
export interface EnhancedBreathData {
	breathPhase: number;
	phaseType: number;
	rawProgress: number;
	easedProgress: number;
	anticipation: number;
	overshoot: number;
	diaphragmDirection: number;
	colorTemperature: number;
	crystallization: number;
	breathWave: number;
	viewOffset: { x: number; y: number };
}

// Calculate enhanced breath data from state
function getEnhancedBreathData(
	state: BreathState,
	viewOffset: { x: number; y: number },
): EnhancedBreathData {
	const { phase, progress } = state;

	// Apply physiological easing
	const easedProgress = applyBreathEasing(progress, phase);

	// Get anticipation (peaks at end of phase)
	const anticipation = getAnticipationFactor(progress);

	// Get overshoot (peaks at start of phase)
	const overshoot = getOvershootFactor(progress);

	// Diaphragmatic direction
	const diaphragmDirection = getDiaphragmDirection(phase);

	// Color temperature
	const colorTemperature = getColorTemperature(phase, progress);

	// Crystallization for holds
	const crystallization = getCrystallizationFactor(phase, progress);

	// Breath wave visualization
	const breathWave = getBreathWaveIntensity(progress, phase);

	// Calculate breathPhase (0-1 where 1 = fully inhaled/contracted)
	let breathPhase: number;
	let phaseType: number;

	switch (phase) {
		case 'in':
			breathPhase = easedProgress;
			phaseType = 0;
			break;
		case 'hold-in':
			breathPhase = 1;
			phaseType = 1;
			break;
		case 'out':
			breathPhase = 1 - easedProgress;
			phaseType = 2;
			break;
		case 'hold-out':
			breathPhase = 0;
			phaseType = 3;
			break;
		default:
			breathPhase = 0;
			phaseType = 0;
	}

	return {
		breathPhase,
		phaseType,
		rawProgress: progress,
		easedProgress,
		anticipation,
		overshoot,
		diaphragmDirection,
		colorTemperature,
		crystallization,
		breathWave,
		viewOffset,
	};
}

// Hook to track mouse/touch position for micro-saccade effect
function useViewOffset(): { x: number; y: number } {
	const [offset, setOffset] = useState({ x: 0, y: 0 });
	const targetRef = useRef({ x: 0, y: 0 });
	const currentRef = useRef({ x: 0, y: 0 });

	useEffect(() => {
		// Mouse movement
		const handleMouseMove = (e: MouseEvent) => {
			const x = (e.clientX / window.innerWidth - 0.5) * 2;
			const y = (e.clientY / window.innerHeight - 0.5) * 2;
			targetRef.current = { x: x * 0.02, y: y * 0.02 }; // Very subtle
		};

		// Device orientation (mobile gyroscope)
		const handleOrientation = (e: DeviceOrientationEvent) => {
			if (e.gamma !== null && e.beta !== null) {
				const x = (e.gamma / 90) * 0.02; // -1 to 1, scaled to subtle
				const y = (e.beta / 90) * 0.02;
				targetRef.current = { x, y };
			}
		};

		// Smooth interpolation
		const animate = () => {
			currentRef.current.x +=
				(targetRef.current.x - currentRef.current.x) * 0.05;
			currentRef.current.y +=
				(targetRef.current.y - currentRef.current.y) * 0.05;
			setOffset({ ...currentRef.current });
			requestAnimationFrame(animate);
		};

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('deviceorientation', handleOrientation);
		const animId = requestAnimationFrame(animate);

		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('deviceorientation', handleOrientation);
			cancelAnimationFrame(animId);
		};
	}, []);

	return offset;
}

function InnerScene({ breathState, config }: GPGPUSceneProps) {
	const viewOffset = useViewOffset();

	const breathData = useMemo(
		() => getEnhancedBreathData(breathState, viewOffset),
		[breathState, viewOffset],
	);

	const expandedRadius = config.sphereExpandedRadius * PARTICLE_RADIUS_SCALE;
	const contractedRadius =
		config.sphereContractedRadius * PARTICLE_RADIUS_SCALE;

	return (
		<>
			{/* Distant star field for depth */}
			<StarField breathPhase={breathData.breathPhase} count={200} />

			{/* Peripheral ambient particles (almost invisible, felt not seen) */}
			<PeripheralParticles breathData={breathData} />

			{/* Main particle system with central sphere */}
			<GPGPUParticleSystem
				breathData={breathData}
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
