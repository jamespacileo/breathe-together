import { AnimatePresence, motion } from 'framer-motion';
import type { BreathState } from '../hooks/useBreathSync';
import type { PresenceData } from '../hooks/usePresence';
import type { VisualizationConfig } from '../lib/config';
import { BreathingFallback, ErrorBoundary } from './ErrorBoundary';
import { BreathingScene } from './r3f/BreathingScene';

interface BreathingOrbProps {
	breathState: BreathState;
	presence: PresenceData;
	config: VisualizationConfig;
}

/**
 * Main breathing visualization component
 * Uses React Three Fiber for GPU-accelerated particle rendering
 */
export function BreathingOrb({
	breathState,
	presence,
	config,
}: BreathingOrbProps) {
	return (
		<div
			className="absolute inset-0 overflow-hidden"
			style={{
				background: `linear-gradient(135deg, ${config.backgroundColor} 0%, ${config.backgroundColorMid} 50%, ${config.backgroundColor} 100%)`,
			}}
		>
			{/* React Three Fiber scene with error boundary for GPU failures */}
			<ErrorBoundary
				fallback={<BreathingFallback />}
				onError={(error) => {
					console.error('WebGL/R3F error:', error.message);
				}}
			>
				<BreathingScene
					breathState={breathState}
					presence={presence}
					config={config}
				/>
			</ErrorBoundary>

			{/* Breathing guide - centered below the orb */}
			<div className="absolute bottom-[18%] sm:bottom-[15%] left-0 right-0 flex flex-col items-center pointer-events-none select-none px-4">
				<AnimatePresence mode="wait">
					<motion.div
						key={breathState.phaseName}
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 0.8, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.25, ease: 'easeOut' }}
						className="text-xl sm:text-2xl font-extralight tracking-[0.25em] uppercase text-white/90 mb-3"
					>
						{breathState.phaseName}
					</motion.div>
				</AnimatePresence>

				{/* Progress bar - thin and subtle */}
				<div className="w-32 sm:w-40 h-px bg-white/15 rounded-full overflow-hidden">
					<motion.div
						className="h-full bg-white/50 rounded-full"
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
