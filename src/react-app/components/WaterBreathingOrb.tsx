import { motion } from 'framer-motion';
import type { BreathState } from '../hooks/useBreathSync';
import type { PresenceData } from '../hooks/usePresence';
import type { VisualizationConfig } from '../lib/config';
import type { UserIdentity } from '../stores/appStore';
import { WaterBreathingScene } from './r3f/water';

interface WaterBreathingOrbProps {
	breathState: BreathState;
	presence: PresenceData;
	config: VisualizationConfig;
	moodColor: string;
	currentUser?: UserIdentity | null;
}

// Water-themed color palette
const WATER_BACKGROUND = '#0a1628'; // Deep ocean blue
const WATER_BACKGROUND_MID = '#0f2847'; // Lighter deep blue

/**
 * Water-themed breathing visualization component
 * Creates an underwater experience with ripples, bubbles, and caustic lights
 */
export function WaterBreathingOrb({
	breathState,
	presence,
	config,
	moodColor,
	currentUser,
}: WaterBreathingOrbProps) {
	// Apply water-themed background colors
	const waterConfig = {
		...config,
		backgroundColor: WATER_BACKGROUND,
		backgroundColorMid: WATER_BACKGROUND_MID,
	};

	return (
		<div
			className="absolute inset-0 overflow-hidden"
			style={{
				background: `linear-gradient(180deg, ${WATER_BACKGROUND} 0%, ${WATER_BACKGROUND_MID} 40%, ${WATER_BACKGROUND} 100%)`,
			}}
		>
			{/* Underwater light effect at top */}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					background: `radial-gradient(ellipse 80% 40% at 50% -10%, rgba(100, 180, 255, 0.15) 0%, transparent 70%)`,
				}}
			/>

			{/* React Three Fiber water scene */}
			<WaterBreathingScene
				breathState={breathState}
				presence={presence}
				config={waterConfig}
				moodColor={moodColor}
				currentUser={currentUser}
			/>

			{/* Breathing guide text with water-themed styling */}
			<div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 text-center text-white pointer-events-none select-none">
				<motion.div
					key={breathState.phaseName}
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 0.9, y: 0 }}
					exit={{ opacity: 0, y: -10 }}
					transition={{ duration: 0.4 }}
					className="text-2xl font-light tracking-[0.2em] uppercase mb-2"
					style={{
						textShadow: '0 0 20px rgba(100, 180, 255, 0.5)',
					}}
				>
					{breathState.phaseName}
				</motion.div>

				{/* Progress bar styled like a water wave */}
				<div
					className="w-48 h-1 rounded-full overflow-hidden mx-auto"
					style={{
						background: 'rgba(100, 180, 255, 0.2)',
						boxShadow: '0 0 10px rgba(100, 180, 255, 0.2)',
					}}
				>
					<motion.div
						className="h-full rounded-full"
						style={{
							background:
								'linear-gradient(90deg, rgba(100, 180, 255, 0.4), rgba(150, 220, 255, 0.8))',
							boxShadow: '0 0 8px rgba(100, 180, 255, 0.6)',
						}}
						initial={{ width: 0 }}
						animate={{ width: `${breathState.progress * 100}%` }}
						transition={{
							duration: 0.1,
							ease: 'linear',
						}}
					/>
				</div>
			</div>
		</div>
	);
}
