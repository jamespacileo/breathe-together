import { Stats } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useControls } from 'leva';
import { Suspense, memo, useMemo } from 'react';
import { GlobalUniformsProvider } from '../../hooks/useGlobalUniforms';
import { getMoodColorCounts } from '../../lib/colors';
import type { VisualizationConfig } from '../../lib/config';
import { CAMERA, PARTICLE_RADIUS_SCALE } from '../../lib/layers';
import { NebulaBackground } from './background/NebulaBackground';
import { PeripheralParticles } from './background/PeripheralParticles';
import { StarField } from './background/StarField';
import { BreathingSphere } from './core/BreathingSphere';
import { UserParticles } from './core/UserParticles';
import { PostProcessingEffects } from './effects/PostProcessingEffects';

interface GPGPUSceneProps {
	config: VisualizationConfig;
}

// Mock color counts - will be wired to usePresence
const MOCK_MOOD_COUNTS = {
	moment: 5,
	anxious: 3,
	processing: 2,
	preparing: 4,
	grateful: 3,
	celebrating: 2,
	here: 4,
};

const InnerScene = memo(({ config }: { config: VisualizationConfig }) => {
	const contractedRadius = config.sphereContractedRadius * PARTICLE_RADIUS_SCALE;

	// Pass sphere's max scale (exhale size) for particle orbit alignment
	// Sphere scales from 0.35 to 0.7 of contractedRadius
	const sphereMaxScale = contractedRadius * 0.7;

	// TODO: Replace with real presence data from usePresence hook
	// When updating, change deps array from [] to [presenceData]
	const moodColorCounts = useMemo(
		() => getMoodColorCounts(MOCK_MOOD_COUNTS),
		[],
	);

	return (
		<>
			{/* Layer 1: Background atmospheric effects */}
			<NebulaBackground />
			<StarField />
			<PeripheralParticles />

			{/* Layer 2: User particles - 1 particle per user with mood color */}
			<UserParticles
				colorCounts={moodColorCounts}
				sphereRadius={sphereMaxScale}
			/>

			{/* Layer 3: Central breathing sphere */}
			<BreathingSphere contractedRadius={contractedRadius} />

			{/* Post-processing effects */}
			<PostProcessingEffects config={config} />
		</>
	);
});

export const GPGPUScene = memo(({ config }: GPGPUSceneProps) => {
	const { showStats } = useControls('Debug', {
		showStats: { value: false, label: 'Show FPS' },
	});

	const cameraProps = useMemo(
		() => ({
			position: [0, 0, CAMERA.POSITION_Z] as [number, number, number],
			fov: CAMERA.FOV,
		}),
		[],
	);

	const glProps = useMemo(
		() => ({
			antialias: true,
			alpha: false,
			powerPreference: 'high-performance' as const,
		}),
		[],
	);

	return (
		<div className="w-full h-full">
			<Canvas
				camera={cameraProps}
				gl={glProps}
				dpr={[1, 2]}
				style={{ background: config.canvasBackground }}
			>
				{/* Background color outside Suspense to prevent blackouts during loading */}
				<color attach="background" args={[config.canvasBackground]} />

				<Suspense fallback={null}>
					<GlobalUniformsProvider>
						<InnerScene config={config} />
					</GlobalUniformsProvider>
				</Suspense>
				{showStats ? <Stats /> : null}
			</Canvas>
		</div>
	);
});
