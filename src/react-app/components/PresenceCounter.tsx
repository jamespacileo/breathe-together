import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
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
			transition={{ duration: 0.4, ease: 'easeOut' }}
			className={cn(
				'flex items-center gap-2 px-3 py-1.5 rounded-full',
				'bg-void-light/40 backdrop-blur-sm',
				'pointer-events-none select-none',
				className,
			)}
			role="status"
			aria-live="polite"
			aria-label={`${presence.count} people breathing together`}
		>
			<Users className="h-4 w-4 text-stellar-muted" />
			<motion.span
				key={presence.count}
				initial={{ opacity: 0.5, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.2 }}
				className="text-sm font-light tabular-nums text-stellar-soft"
			>
				{presence.count.toLocaleString()}
			</motion.span>
		</motion.div>
	);
}
