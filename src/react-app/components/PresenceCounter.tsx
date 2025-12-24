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
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.2 }}
			className={cn(
				'flex items-center gap-1.5 text-white/60 pointer-events-none select-none',
				className,
			)}
			role="status"
			aria-live="polite"
			aria-label={`${presence.count} people breathing together`}
		>
			<span className="relative flex h-2 w-2">
				<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/40 opacity-75" />
				<span className="relative inline-flex rounded-full h-2 w-2 bg-white/60" />
			</span>
			<AnimatePresence mode="popLayout">
				<motion.span
					key={presence.count}
					initial={{ opacity: 0, y: -8 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 8 }}
					transition={{ duration: 0.2 }}
					className="text-sm font-light tabular-nums"
				>
					{presence.count}
				</motion.span>
			</AnimatePresence>
			<span className="text-xs opacity-70">here</span>
		</motion.div>
	);
}
