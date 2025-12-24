import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface TopBarProps {
	/** Content aligned to the left */
	left?: ReactNode;
	/** Content centered in the middle */
	center?: ReactNode;
	/** Content aligned to the right */
	right?: ReactNode;
	/** Optional className for the container */
	className?: string;
}

/**
 * TopBar - Mobile-first top navigation bar
 *
 * Three-column layout with:
 * - Left slot (settings, menu)
 * - Center slot (title, counter)
 * - Right slot (actions, pattern selector)
 *
 * Uses safe area insets for notched devices
 */
export function TopBar({ left, center, right, className }: TopBarProps) {
	return (
		<div
			className={cn(
				// Container padding with safe area support
				'px-3 pt-3 pb-2 sm:px-4 sm:pt-4 sm:pb-3',
				// Support for notched devices
				'pt-[max(0.75rem,env(safe-area-inset-top))]',
				className,
			)}
		>
			<div className="flex items-start justify-between gap-2">
				{/* Left slot */}
				<div className="flex-shrink-0 min-w-[44px]">{left}</div>

				{/* Center slot - can grow */}
				<div className="flex-1 flex justify-center items-start pt-1">
					{center}
				</div>

				{/* Right slot */}
				<div className="flex-shrink-0 min-w-[44px] flex justify-end">
					{right}
				</div>
			</div>
		</div>
	);
}
