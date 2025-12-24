import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface BottomBarProps {
	/** Main content (typically action buttons) */
	children: ReactNode;
	/** Optional className for the container */
	className?: string;
}

/**
 * BottomBar - Mobile-first bottom action bar
 *
 * Centered content with:
 * - Safe area padding for home indicator
 * - Touch-friendly spacing
 * - Subtle backdrop blur for readability
 */
export function BottomBar({ children, className }: BottomBarProps) {
	return (
		<div
			className={cn(
				// Container padding with safe area support
				'px-4 pb-4 pt-2 sm:px-6 sm:pb-6 sm:pt-3',
				// Support for devices with home indicator
				'pb-[max(1rem,env(safe-area-inset-bottom))]',
				// Center the content
				'flex justify-center items-center',
				className,
			)}
		>
			{children}
		</div>
	);
}
