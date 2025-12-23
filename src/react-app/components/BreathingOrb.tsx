import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { BreathState } from '../hooks/useBreathSync';
import type { PresenceData } from '../hooks/usePresence';
import type { VisualizationConfig } from '../lib/config';
import { hasLimitedWebGL } from '../lib/device';
import type { UserIdentity } from '../stores/appStore';
import { CSSBreathingOrb } from './CSSBreathingOrb';
import { BreathingScene } from './r3f/BreathingScene';
import { WebGLErrorBoundary } from './WebGLErrorBoundary';

interface BreathingOrbProps {
	breathState: BreathState;
	presence: PresenceData;
	config: VisualizationConfig;
	moodColor: string;
	currentUser?: UserIdentity | null;
}

/**
 * Main breathing visualization component
 * Uses CSS on iOS (WebGL issues), WebGL on desktop
 * Falls back to CSS if WebGL crashes
 */
export function BreathingOrb({
	breathState,
	presence,
	config,
	moodColor,
	currentUser,
}: BreathingOrbProps) {
	// Detect if we should use CSS fallback (iOS has WebGL issues)
	const useCSS = useMemo(() => hasLimitedWebGL(), []);

	// CSS fallback (used on iOS or if WebGL crashes)
	const cssFallback = (
		<CSSBreathingOrb
			breathState={breathState}
			config={config}
			moodColor={moodColor}
			userCount={presence.count}
		/>
	);

	return (
		<div
			className="absolute inset-0 overflow-hidden"
			style={{
				background: `linear-gradient(135deg, ${config.backgroundColor} 0%, ${config.backgroundColorMid} 50%, ${config.backgroundColor} 100%)`,
			}}
		>
			{/* Render CSS or WebGL based on device, with error fallback */}
			{useCSS ? (
				cssFallback
			) : (
				<WebGLErrorBoundary fallback={cssFallback}>
					<BreathingScene
						breathState={breathState}
						presence={presence}
						config={config}
						moodColor={moodColor}
						currentUser={currentUser}
					/>
				</WebGLErrorBoundary>
			)}

			{/* Breathing guide text with Framer Motion animations */}
			<div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 text-center text-white pointer-events-none select-none">
				<motion.div
					key={breathState.phaseName}
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 0.9, y: 0 }}
					exit={{ opacity: 0, y: -10 }}
					transition={{ duration: 0.3 }}
					className="text-2xl font-light tracking-[0.2em] uppercase mb-2"
				>
					{breathState.phaseName}
				</motion.div>

				<div className="w-48 h-0.5 bg-white/20 rounded-sm overflow-hidden mx-auto">
					<motion.div
						className="h-full bg-white/60 rounded-sm"
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
