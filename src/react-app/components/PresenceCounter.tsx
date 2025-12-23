import type { PresenceData } from '../hooks/usePresence';
import { cn } from '../lib/utils';

interface PresenceCounterProps {
	presence: PresenceData;
	className?: string;
}

export function PresenceCounter({ presence, className }: PresenceCounterProps) {
	return (
		<div
			className={cn(
				'text-white/80 text-center pointer-events-none select-none',
				className,
			)}
			role="status"
			aria-live="polite"
			aria-label={`${presence.count} people breathing together`}
		>
			<span className="text-lg sm:text-xl font-light tabular-nums">
				{presence.count}
			</span>
			<span className="text-xs sm:text-sm ml-1 opacity-80">
				breathing together
			</span>
		</div>
	);
}
