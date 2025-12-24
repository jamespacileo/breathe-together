import { AnimatePresence, motion } from 'framer-motion';
import type { PresenceData } from '../hooks/usePresence';
import { cn } from '../lib/utils';

interface PresenceCounterProps {
	presence: PresenceData;
	className?: string;
}

export function PresenceCounter({ presence, className }: PresenceCounterProps) {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.8, delay: 0.3 }}
			className={cn(
				'flex items-center gap-2 text-white/40 pointer-events-none select-none',
				className,
			)}
			role="status"
			aria-live="polite"
			aria-label={`${presence.count} people breathing together`}
		>
			{/* Subtle pulse indicator */}
			<span className="relative flex h-1.5 w-1.5">
				<motion.span
					className="absolute inline-flex h-full w-full rounded-full bg-white/20"
					animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
					transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
				/>
				<span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white/40" />
			</span>

			<AnimatePresence mode="popLayout">
				<motion.span
					key={presence.count}
					initial={{ opacity: 0, y: -6 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 6 }}
					transition={{ duration: 0.25 }}
					className="font-display text-base tabular-nums italic"
				>
					{presence.count}
				</motion.span>
			</AnimatePresence>

			<span className="text-[11px] tracking-wide opacity-60">here</span>
		</motion.div>
	);
}
