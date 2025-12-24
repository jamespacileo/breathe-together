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
				'text-center pointer-events-none select-none',
				'animate-fade-in',
				className,
			)}
			role="status"
			aria-live="polite"
			aria-label={`${presence.count} people breathing together`}
		>
			{/* Elegant pill container with generous padding */}
			<div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/8">
				{/* Breathing indicator dot */}
				<span className="relative flex h-2 w-2">
					<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D4FF] opacity-50" />
					<span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D4FF]" />
				</span>

				{/* Count with refined typography */}
				<span className="text-lg font-light tabular-nums tracking-tight text-white/90">
					{presence.count.toLocaleString()}
				</span>

				{/* Label with slight separation */}
				<span className="text-xs font-light tracking-wide text-white/50 ml-0.5">
					breathing together
				</span>
			</div>
		</div>
	);
}
