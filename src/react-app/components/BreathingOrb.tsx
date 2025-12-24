import { motion } from 'framer-motion';
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
 * PS5/Apple inspired premium dark aesthetic
 */
export function BreathingOrb({
	breathState,
	presence,
	config,
}: BreathingOrbProps) {
	return (
		<div className="absolute inset-0 overflow-hidden">
			{/* Premium gradient background with subtle depth */}
			<div
				className="absolute inset-0"
				style={{
					background: `
						radial-gradient(ellipse 80% 50% at 50% 120%, rgba(100, 180, 255, 0.08) 0%, transparent 50%),
						radial-gradient(ellipse 60% 40% at 50% -10%, rgba(100, 180, 255, 0.04) 0%, transparent 40%),
						linear-gradient(180deg, #050508 0%, #0a0a12 50%, #050508 100%)
					`,
				}}
			/>

			{/* Subtle vignette overlay */}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					background:
						'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
				}}
			/>

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

			{/* Breathing guide - premium typography */}
			<div className="breathing-guide">
				<motion.div
					key={breathState.phaseName}
					initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
					animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
					exit={{ opacity: 0, y: -12, filter: 'blur(8px)' }}
					transition={{
						duration: 0.5,
						ease: [0.16, 1, 0.3, 1],
					}}
					className="breathing-phase"
				>
					{breathState.phaseName}
				</motion.div>

				<div className="progress-track">
					<motion.div
						className="progress-fill"
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
