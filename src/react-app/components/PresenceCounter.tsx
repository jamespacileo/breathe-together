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
				'text-center pointer-events-none select-none animate-float',
				className,
			)}
			role="status"
			aria-live="polite"
			aria-label={`${presence.count} people breathing together`}
		>
			{/* Glowing backdrop */}
			<div className="relative">
				<div
					className="absolute inset-0 -inset-x-8 -inset-y-4 rounded-full opacity-30 blur-xl"
					style={{
						background:
							'radial-gradient(ellipse, rgba(126, 181, 193, 0.3) 0%, transparent 70%)',
					}}
				/>

				{/* Content */}
				<div className="relative flex flex-col items-center gap-0.5">
					{/* Number - large, elegant serif */}
					<span
						className="font-display text-4xl sm:text-5xl font-light tracking-wide tabular-nums text-white/90"
						style={{
							textShadow: '0 0 60px rgba(126, 181, 193, 0.4)',
						}}
					>
						{presence.count}
					</span>

					{/* Label - refined, subtle */}
					<span className="text-[10px] sm:text-xs tracking-[0.25em] uppercase text-white/40">
						breathing together
					</span>
				</div>
			</div>
		</div>
	);
}
