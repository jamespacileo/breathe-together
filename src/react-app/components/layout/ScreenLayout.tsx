import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface ScreenLayoutProps {
	/** Main content that fills the screen (typically the visualization) */
	children: ReactNode;
	/** Background layers (starfield, nebula, etc) */
	background?: ReactNode;
	/** Top bar content */
	topBar?: ReactNode;
	/** Bottom bar content */
	bottomBar?: ReactNode;
	/** Optional className for the container */
	className?: string;
}

/**
 * ScreenLayout - Mobile-first fullscreen layout
 *
 * Provides a structured layout with:
 * - Fixed fullscreen container
 * - Background layer (z-0/z-1)
 * - Main content layer (z-5)
 * - Top bar overlay (z-10)
 * - Bottom bar overlay (z-10)
 */
export function ScreenLayout({
	children,
	background,
	topBar,
	bottomBar,
	className,
}: ScreenLayoutProps) {
	return (
		<div className={cn('fixed inset-0 overflow-hidden bg-void', className)}>
			{/* Background layers */}
			{background}

			{/* Main content - fills the screen */}
			<div className="absolute inset-0 z-5">{children}</div>

			{/* Top bar overlay */}
			{topBar ? (
				<div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
					<div className="pointer-events-auto">{topBar}</div>
				</div>
			) : null}

			{/* Bottom bar overlay */}
			{bottomBar ? (
				<div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
					<div className="pointer-events-auto">{bottomBar}</div>
				</div>
			) : null}
		</div>
	);
}
