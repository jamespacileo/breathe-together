import { AnimatePresence, motion } from 'framer-motion';
import type { BreathState } from '../hooks/useBreathSync';
import type { PresenceData } from '../hooks/usePresence';
import type { VisualizationConfig } from '../lib/config';
import { BreathingFallback, ErrorBoundary } from './ErrorBoundary';
import { ParticleBreathing } from './ParticleBreathing';

interface BreathingOrbProps {
	breathState: BreathState;
	presence: PresenceData;
	config: VisualizationConfig;
}

/**
 * Main breathing visualization component
 * Uses Three.js for GPU-accelerated particle rendering
 */
export function BreathingOrb({
	breathState,
	presence: _presence,
	config,
}: BreathingOrbProps) {
	return (
		<div className="absolute inset-0 overflow-hidden">
			{/* Three.js particle scene with error boundary for GPU failures */}
			<ErrorBoundary
				fallback={<BreathingFallback />}
				onError={(error) => {
					console.error('WebGL error:', error.message);
				}}
			>
				<ParticleBreathing breathState={breathState} config={config} />
			</ErrorBoundary>

			{/* Breathing guide - ethereal, centered below the orb */}
			<div className="absolute bottom-[18%] sm:bottom-[14%] left-0 right-0 flex flex-col items-center pointer-events-none select-none">
				<AnimatePresence mode="wait">
					<motion.div
						key={breathState.phaseName}
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
						className="font-display text-xl sm:text-2xl font-light tracking-wider text-white/40 mb-6 italic lowercase"
					>
						{breathState.phaseName}
					</motion.div>
				</AnimatePresence>

				{/* Progress - ultra minimal dot */}
				<div className="relative flex items-center justify-center">
					<motion.div
						className="w-1 h-1 rounded-full bg-white/20"
						animate={{
							scale: [1, 1.5, 1],
							opacity: [0.2, 0.4, 0.2],
						}}
						transition={{
							duration: 2,
							repeat: Number.POSITIVE_INFINITY,
							ease: 'easeInOut',
						}}
					/>
				</div>
			</div>
		</div>
	);
}
