import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface TopBarProps {
	/** Left-aligned content (e.g., settings button) */
	left?: ReactNode;
	/** Center-aligned content (e.g., presence counter) */
	center?: ReactNode;
	/** Right-aligned content (e.g., pattern selector) */
	right?: ReactNode;
	/** Additional className */
	className?: string;
}

/**
 * TopBar - Mobile-first header layout component
 *
 * Provides three slots for UI controls:
 * - Left: Typically settings/menu
 * - Center: Typically status/info
 * - Right: Typically toggles/actions
 *
 * Uses safe-area-inset for notched devices.
 */
export function TopBar({ left, center, right, className }: TopBarProps) {
	return (
		<div
			className={cn(
				'flex items-start justify-between',
				'px-4 pt-4 pb-2',
				'sm:px-5 sm:pt-5',
				// Safe area for notched devices
				'pt-[max(1rem,env(safe-area-inset-top))]',
				className,
			)}
		>
			{/* Left slot */}
			<div className="flex-shrink-0 pointer-events-auto">{left}</div>

			{/* Center slot - absolutely positioned for true centering */}
			<div className="absolute left-1/2 -translate-x-1/2 top-4 sm:top-5 pt-[max(0rem,env(safe-area-inset-top))] pointer-events-auto">
				{center}
			</div>

			{/* Right slot */}
			<div className="flex-shrink-0 pointer-events-auto">{right}</div>
		</div>
	);
}
