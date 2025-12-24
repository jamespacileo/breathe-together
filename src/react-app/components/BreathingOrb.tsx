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
 * Uses React Three Fiber with GPGPU for GPU-accelerated particle physics
 */
export function BreathingOrb({
	breathState,
	presence,
	config,
}: BreathingOrbProps) {
	return (
		<div className="absolute inset-0 overflow-hidden">
			{/* React Three Fiber scene with GPGPU particles */}
			<ErrorBoundary
				fallback={<BreathingFallback />}
				onError={(error) => {
					console.error('WebGL error:', error.message);
				}}
			>
				<BreathingScene
					breathState={breathState}
					presence={presence}
					config={config}
				/>
			</ErrorBoundary>

			{/* Breathing guide text with cosmic styling */}
			<div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 text-center pointer-events-none select-none">
				{/* Phase name with elegant serif typography */}
				<AnimatePresence mode="wait">
					<motion.div
						key={breathState.phaseName}
						initial={{ opacity: 0, y: 15, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -10, scale: 0.98 }}
						transition={{ duration: 0.4, ease: 'easeOut' }}
						className="font-serif text-3xl sm:text-4xl font-light tracking-[0.15em] uppercase text-stellar mb-4"
						style={{
							textShadow:
								'0 0 40px rgba(168, 85, 247, 0.4), 0 0 80px rgba(34, 211, 238, 0.2)',
						}}
					>
						{breathState.phaseName}
					</motion.div>
				</AnimatePresence>

				{/* Progress bar with cosmic gradient */}
				<div className="relative w-56 sm:w-64 h-1 mx-auto rounded-full overflow-hidden">
					{/* Track background */}
					<div className="absolute inset-0 bg-gradient-to-r from-nebula/20 via-stellar-faint to-aurora/20" />

					{/* Progress fill with glow */}
					<motion.div
						className="absolute inset-y-0 left-0 bg-gradient-to-r from-nebula-glow via-aurora to-aurora-bright rounded-full"
						style={{
							boxShadow:
								'0 0 20px rgba(34, 211, 238, 0.5), 0 0 40px rgba(168, 85, 247, 0.3)',
						}}
						initial={{ width: 0 }}
						animate={{ width: `${breathState.progress * 100}%` }}
						transition={{
							duration: 0.1,
							ease: 'linear',
						}}
					/>

					{/* Shimmer effect on progress */}
					<motion.div
						className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
						style={{ width: '20%' }}
						animate={{
							x: ['0%', '500%'],
						}}
						transition={{
							duration: 2,
							ease: 'linear',
							repeat: Infinity,
							repeatDelay: 1,
						}}
					/>
				</div>

				{/* Decorative elements */}
				<div className="mt-6 flex items-center justify-center gap-3">
					<div className="w-1 h-1 rounded-full bg-aurora/50" />
					<div className="w-12 h-px bg-gradient-to-r from-transparent via-stellar-dim to-transparent" />
					<div className="w-1.5 h-1.5 rounded-full bg-nebula-glow/60" />
					<div className="w-12 h-px bg-gradient-to-r from-transparent via-stellar-dim to-transparent" />
					<div className="w-1 h-1 rounded-full bg-aurora/50" />
				</div>
			</div>
		</div>
	);
}
