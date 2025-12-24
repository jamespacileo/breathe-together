import { motion } from 'framer-motion';
import type { PresenceData } from '../../hooks/usePresence';
import { cn } from '../../lib/utils';

interface PresenceCounterProps {
	presence: PresenceData;
	className?: string;
}

export function PresenceCounter({ presence, className }: PresenceCounterProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6, ease: 'easeOut' }}
			className={cn('text-center pointer-events-none select-none', className)}
			role="status"
			aria-live="polite"
			aria-label={`${presence.count} people breathing together`}
		>
			{/* Cosmic number display */}
			<div className="relative inline-flex flex-col items-center">
				{/* Subtle glow behind */}
				<div className="absolute -inset-4 bg-gradient-to-b from-aurora/10 via-nebula-glow/5 to-transparent blur-xl rounded-full opacity-60" />

				{/* Main count - elegant serif */}
				<motion.span
					key={presence.count}
					initial={{ opacity: 0.5, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.3 }}
					className="relative font-serif text-4xl sm:text-5xl font-light tracking-tight tabular-nums text-stellar"
					style={{
						textShadow:
							'0 0 40px rgba(34, 211, 238, 0.3), 0 0 80px rgba(168, 85, 247, 0.2)',
					}}
				>
					{presence.count.toLocaleString()}
				</motion.span>

				{/* Descriptor text */}
				<span className="relative mt-1 text-xs sm:text-sm font-light tracking-[0.2em] uppercase text-stellar-muted">
					breathing together
				</span>

				{/* Decorative line */}
				<div className="mt-3 w-16 h-px bg-gradient-to-r from-transparent via-aurora/40 to-transparent" />
			</div>
		</motion.div>
	);
}
