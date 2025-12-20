import { PresenceData } from '../hooks/usePresence';
import { cn } from '../lib/utils';

interface PresenceCounterProps {
  presence: PresenceData;
  className?: string;
}

export function PresenceCounter({ presence, className }: PresenceCounterProps) {
  return (
    <div
      className={cn(
        "text-white/80 text-center pointer-events-none select-none",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={`${presence.count} people breathing together`}
    >
      <span className="text-xl font-light">{presence.count}</span>
      <span className="text-sm ml-1">breathing together</span>
    </div>
  );
}
