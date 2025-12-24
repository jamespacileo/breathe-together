import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface BottomBarProps {
	/** Left-aligned content */
	left?: ReactNode;
	/** Center-aligned content (primary action) */
	center?: ReactNode;
	/** Right-aligned content */
	right?: ReactNode;
	/** Additional className */
	className?: string;
}

/**
 * BottomBar - Mobile-first footer layout component
 *
 * Provides three slots for actions:
 * - Left: Secondary actions
 * - Center: Primary action (e.g., join button, user badge)
 * - Right: Secondary actions
 *
 * Uses safe-area-inset for home indicator on iOS.
 */
export function BottomBar({ left, center, right, className }: BottomBarProps) {
	return (
		<div
			className={cn(
				'flex items-end justify-between',
				'px-4 pb-6 pt-2',
				'sm:px-5 sm:pb-8',
				// Safe area for home indicator
				'pb-[max(1.5rem,env(safe-area-inset-bottom))]',
				className,
			)}
		>
			{/* Left slot */}
			<div className="flex-shrink-0 pointer-events-auto">{left}</div>

			{/* Center slot - absolutely positioned for true centering */}
			<div className="absolute left-1/2 -translate-x-1/2 bottom-6 sm:bottom-8 pb-[max(0rem,env(safe-area-inset-bottom))] pointer-events-auto">
				{center}
			</div>

			{/* Right slot */}
			<div className="flex-shrink-0 pointer-events-auto">{right}</div>
		</div>
	);
}
