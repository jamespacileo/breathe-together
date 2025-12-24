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
			transition={{ duration: 1.2, delay: 0.5 }}
			className={cn(
				'flex items-center gap-3 pointer-events-none select-none',
				className,
			)}
			role="status"
			aria-live="polite"
			aria-label={`${presence.count} people breathing together`}
		>
			{/* Breathing pulse - syncs with the meditation rhythm */}
			<span className="relative flex h-2 w-2">
				<motion.span
					className="absolute inline-flex h-full w-full rounded-full bg-white/10"
					animate={{
						scale: [1, 2.5, 1],
						opacity: [0.3, 0, 0.3],
					}}
					transition={{
						duration: 4,
						repeat: Number.POSITIVE_INFINITY,
						ease: 'easeInOut',
					}}
				/>
				<span className="relative inline-flex rounded-full h-2 w-2 bg-white/25" />
			</span>

			<div className="flex items-baseline gap-1.5">
				<AnimatePresence mode="popLayout">
					<motion.span
						key={presence.count}
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 8 }}
						transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
						className="font-display text-lg tabular-nums italic text-white/35"
					>
						{presence.count}
					</motion.span>
				</AnimatePresence>

				<span className="text-[10px] tracking-widest uppercase text-white/20 font-light">
					breathing
				</span>
			</div>
		</motion.div>
	);
}
