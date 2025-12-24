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
			<div className="absolute bottom-[20%] sm:bottom-[16%] left-0 right-0 flex flex-col items-center pointer-events-none select-none">
				<AnimatePresence mode="wait">
					<motion.div
						key={breathState.phaseName}
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 1.05 }}
						transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
						className="font-display text-2xl sm:text-3xl font-light tracking-wide text-white/70 mb-4 italic"
					>
						{breathState.phaseName}
					</motion.div>
				</AnimatePresence>

				{/* Progress arc - minimal */}
				<div className="relative w-16 h-[2px]">
					<div className="absolute inset-0 bg-white/[0.06] rounded-full" />
					<motion.div
						className="absolute inset-y-0 left-0 bg-white/30 rounded-full"
						initial={{ width: 0 }}
						animate={{ width: `${breathState.progress * 100}%` }}
						transition={{ duration: 0.1, ease: 'linear' }}
					/>
				</div>
			</div>
		</div>
	);
}
