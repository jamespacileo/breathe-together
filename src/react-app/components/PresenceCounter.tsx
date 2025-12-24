import type { PresenceData } from '../hooks/usePresence';
import { cn } from '../lib/utils';

interface PresenceCounterProps {
	presence: PresenceData;
	className?: string;
}

export function PresenceCounter({ presence, className }: PresenceCounterProps) {
	return (
		<div
			className={cn('presence-counter', className)}
			role="status"
			aria-live="polite"
			aria-label={`${presence.count} people breathing together`}
		>
			<span className="presence-count">{presence.count}</span>
			<span className="presence-label">breathing together</span>
		</div>
	);
}
