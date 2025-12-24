import { Stats } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import {
	Bloom,
	EffectComposer,
	Noise,
	Vignette,
} from '@react-three/postprocessing';
import { useControls } from 'leva';
import { BlendFunction } from 'postprocessing';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import type { BreathState } from '../../hooks/useBreathSync';
import {
	applyBreathEasing,
	getAnticipationFactor,
	getBreathWaveIntensity,
	getColorTemperature,
	getCrystallizationFactor,
	getDiaphragmDirection,
	getOvershootFactor,
	getPhaseTransitionBlend,
} from '../../lib/breathEasing';
import { getMoodColorCounts } from '../../lib/colors';
import type { VisualizationConfig } from '../../lib/config';
import { BreathingSphere } from './BreathingSphere';
import { GalaxyBackground } from './GalaxyBackground';
import { PeripheralParticles } from './PeripheralParticles';
import { StarField } from './StarField';
import { UserParticles } from './UserParticles';

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
	phaseTransitionBlend: number; // 0-1, smooths parameter changes at phase boundaries
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

	// Phase transition blend (smooths parameter changes at phase boundaries)
	const phaseTransitionBlend = getPhaseTransitionBlend(progress);

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
		phaseTransitionBlend,
		viewOffset,
	};
}

// Hook to track mouse/touch position for micro-saccade effect
// Uses refs instead of state to avoid re-renders per R3F best practices
function useViewOffset(): React.MutableRefObject<{ x: number; y: number }> {
	const targetRef = useRef({ x: 0, y: 0 });
	const currentRef = useRef({ x: 0, y: 0 });
	const animFrameRef = useRef(0);

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

		// Smooth interpolation via refs (no setState to avoid re-renders)
		const animate = () => {
			currentRef.current.x +=
				(targetRef.current.x - currentRef.current.x) * 0.05;
			currentRef.current.y +=
				(targetRef.current.y - currentRef.current.y) * 0.05;
			animFrameRef.current = requestAnimationFrame(animate);
		};

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('deviceorientation', handleOrientation);
		animFrameRef.current = requestAnimationFrame(animate);

		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('deviceorientation', handleOrientation);
			cancelAnimationFrame(animFrameRef.current);
		};
	}, []);

	return currentRef;
}

function InnerScene({ breathState, config }: GPGPUSceneProps) {
	const viewOffsetRef = useViewOffset();

	// Note: viewOffset is accessed via ref to avoid re-renders per R3F best practices
	// The ref value updates smoothly via requestAnimationFrame in useViewOffset
	const breathData = useMemo(
		() => getEnhancedBreathData(breathState, viewOffsetRef.current),
		[breathState, viewOffsetRef.current], // viewOffsetRef is stable, read its .current value
	);

	const expandedRadius = config.sphereExpandedRadius * PARTICLE_RADIUS_SCALE;
	const contractedRadius =
		config.sphereContractedRadius * PARTICLE_RADIUS_SCALE;

	// Sphere glow radius for Dyson swarm positioning
	// Based on BreathingSphere: minScale = contractedRadius * 0.35, glow = scale * 1.15
	const sphereGlowRadius = contractedRadius * 0.35 * 1.15;

	// Mock color counts for now - will be wired to usePresence
	// Each color represents users with that mood
	const moodColorCounts = useMemo(() => {
		return getMoodColorCounts({
			moment: 5,
			anxious: 3,
			processing: 2,
			preparing: 4,
			grateful: 3,
			celebrating: 2,
			here: 4,
		});
	}, []);

	return (
		<>
			{/* Layer 1: Background atmospheric effects (drei) */}
			<GalaxyBackground breathData={breathData} />
			<StarField breathData={breathData} />
			<PeripheralParticles breathData={breathData} />

			{/* Layer 2: User particles - 1 particle per user with mood color */}
			<UserParticles
				breathData={breathData}
				colorCounts={moodColorCounts}
				sphereRadius={sphereGlowRadius}
			/>

			{/* Layer 3: Central breathing sphere */}
			<BreathingSphere
				breathData={breathData}
				expandedRadius={expandedRadius}
				contractedRadius={contractedRadius}
			/>

			{/* Post-processing effects */}
			<EffectComposer>
				<Bloom
					intensity={0.3}
					luminanceThreshold={0.6}
					luminanceSmoothing={0.9}
					radius={0.8}
				/>
				<Vignette
					darkness={config.vignetteIntensity}
					offset={0.35}
					blendFunction={BlendFunction.NORMAL}
				/>
				<Noise
					premultiply
					blendFunction={BlendFunction.SOFT_LIGHT}
					opacity={config.noiseOpacity}
				/>
			</EffectComposer>
		</>
	);
}

export function GPGPUScene({ breathState, config }: GPGPUSceneProps) {
	const { showStats } = useControls('Debug', {
		showStats: { value: false, label: 'Show FPS' },
	});

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
				style={{ background: config.canvasBackground }}
			>
				<Suspense fallback={null}>
					<InnerScene breathState={breathState} config={config} />
				</Suspense>
				{showStats ? <Stats /> : null}
			</Canvas>
		</div>
	);
}
