import { motion } from 'framer-motion';
import type { PresenceData } from '../hooks/usePresence';
import { cn } from '../lib/utils';

interface PresenceCounterProps {
	presence: PresenceData;
	className?: string;
}

export function PresenceCounter({ presence, className }: PresenceCounterProps) {
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.4, ease: 'easeOut' }}
			className={cn('text-center pointer-events-none select-none', className)}
			role="status"
			aria-live="polite"
			aria-label={`${presence.count} people breathing together`}
		>
			{/* Compact number display */}
			<div className="relative inline-flex flex-col items-center">
				{/* Subtle glow behind - smaller on mobile */}
				<div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-b from-aurora/10 via-nebula-glow/5 to-transparent blur-lg sm:blur-xl rounded-full opacity-50" />

				{/* Main count - responsive sizing */}
				<motion.span
					key={presence.count}
					initial={{ opacity: 0.5, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.3 }}
					className="relative font-serif text-3xl sm:text-4xl md:text-5xl font-light tracking-tight tabular-nums text-stellar"
					style={{
						textShadow:
							'0 0 30px rgba(34, 211, 238, 0.25), 0 0 60px rgba(168, 85, 247, 0.15)',
					}}
				>
					{presence.count.toLocaleString()}
				</motion.span>

				{/* Descriptor text - compact */}
				<span className="relative mt-0.5 text-[10px] sm:text-xs font-light tracking-[0.15em] uppercase text-stellar-muted">
					breathing together
				</span>

				{/* Decorative line - hidden on mobile */}
				<div className="hidden sm:block mt-2 w-12 h-px bg-gradient-to-r from-transparent via-aurora/30 to-transparent" />
			</div>
		</motion.div>
	);
}
