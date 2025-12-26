import { Stats } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useControls } from 'leva';
import { Suspense } from 'react';
import type { BreathState } from '../../hooks/useBreathSync';
import { useEnhancedBreathData } from '../../hooks/useEnhancedBreathData';
import { getMoodColorCounts } from '../../lib/colors';
import type { VisualizationConfig } from '../../lib/config';
import { CAMERA, PARTICLE_RADIUS_SCALE } from '../../lib/layers';
import { BreathingSphere } from './BreathingSphere';
import { GalaxyBackground } from './GalaxyBackground';
import { PeripheralParticles } from './PeripheralParticles';
import { PostProcessingEffects } from './PostProcessingEffects';
import { StarField } from './StarField';
import { UserParticles } from './UserParticles';

interface GPGPUSceneProps {
	breathState: BreathState;
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

function InnerScene({ breathState, config }: GPGPUSceneProps) {
	const breathData = useEnhancedBreathData(breathState);

	const expandedRadius = config.sphereExpandedRadius * PARTICLE_RADIUS_SCALE;
	const contractedRadius = config.sphereContractedRadius * PARTICLE_RADIUS_SCALE;

	// Sphere glow radius for Dyson swarm positioning
	const sphereGlowRadius = contractedRadius * 0.35 * 1.15;

	const moodColorCounts = getMoodColorCounts(MOCK_MOOD_COUNTS);

	return (
		<>
			{/* Layer 1: Background atmospheric effects */}
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
			<PostProcessingEffects config={config} />
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
				camera={{ position: [0, 0, CAMERA.POSITION_Z], fov: CAMERA.FOV }}
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
