import { Stats } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { memo, Suspense, useEffect, useMemo, useState } from 'react';
import type { MoodId } from '../../../shared/constants';
import { getMoodColorCounts } from '../../lib/colors';
import { CAMERA } from '../../lib/layers';
import { sceneObj } from '../../lib/theatre';
import type { SceneProps } from '../../lib/theatre/types';
import { NebulaBackground } from './background/NebulaBackground';
import { PeripheralParticles } from './background/PeripheralParticles';
import { StarField } from './background/StarField';
import { CoreOrb } from './core/CoreOrb';
import { UserPresence } from './core/UserPresence';
import { DebugGuides } from './debug';
import { PostProcessingEffects } from './effects/PostProcessingEffects';
import { TheatreBreathProvider } from './TheatreBreathProvider';

interface InnerSceneProps {
	moodCounts: Record<MoodId, number>;
}

const InnerScene = memo(({ moodCounts }: InnerSceneProps) => {
	// Convert mood counts to color counts for UserPresence particles
	const moodColorCounts = useMemo(
		() => getMoodColorCounts(moodCounts),
		[moodCounts],
	);

	return (
		<>
			{/* Layer 1: Background atmospheric effects */}
			<NebulaBackground />
			<StarField />
			<PeripheralParticles />

			{/* Layer 2: User presence swarm */}
			<UserPresence colorCounts={moodColorCounts} />

			{/* Layer 3: Central breathing orb */}
			<CoreOrb />

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

interface BreathingSceneProps {
	moodCounts: Record<MoodId, number>;
}

export const BreathingScene = memo(({ moodCounts }: BreathingSceneProps) => {
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
						<InnerScene moodCounts={moodCounts} />
						<DebugGuides />
					</TheatreBreathProvider>
				</Suspense>
				{showStats ? <Stats /> : null}
			</Canvas>
		</div>
	);
});
