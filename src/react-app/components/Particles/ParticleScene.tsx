import { Stats } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { memo, Suspense, useEffect, useMemo, useState } from 'react';
import { getMoodColorCounts } from '../../lib/colors';
import { CAMERA } from '../../lib/layers';
import { sceneObj } from '../../lib/theatre';
import type { SceneProps } from '../../lib/theatre/types';
import { NebulaBackground } from './background/NebulaBackground';
import { PeripheralParticles } from './background/PeripheralParticles';
import { StarField } from './background/StarField';
import { BreathingSphere } from './core/BreathingSphere';
import { UserParticlesInstanced } from './core/UserParticlesInstanced';
import { PostProcessingEffects } from './effects/PostProcessingEffects';
import { TheatreBreathProvider } from './TheatreBreathProvider';

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

const InnerScene = memo(() => {
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
			<UserParticlesInstanced colorCounts={moodColorCounts} />

			{/* Layer 3: Central breathing sphere */}
			<BreathingSphere />

			{/* Post-processing effects */}
			<PostProcessingEffects />
		</>
	);
});

/**
 * Helper to convert RGBA object to CSS color string
 */
function rgbaToCss(rgba: {
	r: number;
	g: number;
	b: number;
	a: number;
}): string {
	return `rgba(${Math.round(rgba.r * 255)}, ${Math.round(rgba.g * 255)}, ${Math.round(rgba.b * 255)}, ${rgba.a})`;
}

export const ParticleScene = memo(() => {
	// Stats toggle - can be controlled via Theatre.js Studio or keyboard shortcut
	const [showStats, setShowStats] = useState(false);
	const [theatreProps, setTheatreProps] = useState<SceneProps>(sceneObj.value);

	// Subscribe to Theatre.js object changes
	useEffect(() => {
		const unsubscribe = sceneObj.onValuesChange((values) => {
			setTheatreProps(values);
		});
		return unsubscribe;
	}, []);

	// Toggle stats with keyboard shortcut (Shift+S)
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.shiftKey && e.key === 'S') {
				setShowStats((prev) => !prev);
			}
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, []);

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

	const bgColor = rgbaToCss(theatreProps.backgroundColor);

	return (
		<div className="w-full h-full">
			<Canvas
				camera={cameraProps}
				gl={glProps}
				dpr={[1, 2]}
				style={{ background: bgColor }}
			>
				{/* Background color outside Suspense to prevent blackouts during loading */}
				<color attach="background" args={[bgColor]} />

				<Suspense fallback={null}>
					<TheatreBreathProvider>
						<InnerScene />
					</TheatreBreathProvider>
				</Suspense>
				{showStats ? <Stats /> : null}
			</Canvas>
		</div>
	);
});
