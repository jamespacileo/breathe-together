import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface AppLayoutProps {
	/** Background layer (cosmic effects, particles, etc.) */
	background?: ReactNode;
	/** Main content layer (breathing visualization) */
	content?: ReactNode;
	/** Top bar with UI controls */
	topBar?: ReactNode;
	/** Bottom bar with actions */
	bottomBar?: ReactNode;
	/** Modal/overlay content */
	overlay?: ReactNode;
	/** Additional className for the root container */
	className?: string;
}

/**
 * AppLayout - Mobile-first full-screen layout component
 *
 * Organizes the app into distinct layers:
 * - Background: Decorative effects (z-0)
 * - Content: Main visualization (z-10)
 * - TopBar: Header controls (z-20)
 * - BottomBar: Footer actions (z-20)
 * - Overlay: Modals/dialogs (z-50)
 */
export function AppLayout({
	background,
	content,
	topBar,
	bottomBar,
	overlay,
	className,
}: AppLayoutProps) {
	return (
		<div
			className={cn(
				'fixed inset-0 overflow-hidden bg-void',
				'touch-none select-none',
				className,
			)}
		>
			{/* Background layer - decorative effects */}
			{background ? (
				<div className="absolute inset-0 z-0 pointer-events-none">
					{background}
				</div>
			) : null}

			{/* Content layer - main visualization */}
			{content ? (
				<div className="absolute inset-0 z-10 pointer-events-auto">
					{content}
				</div>
			) : null}

			{/* TopBar layer - header UI controls */}
			{topBar ? (
				<div className="absolute inset-x-0 top-0 z-20 pointer-events-none">
					{topBar}
				</div>
			) : null}

			{/* BottomBar layer - footer actions */}
			{bottomBar ? (
				<div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none">
					{bottomBar}
				</div>
			) : null}

			{/* Overlay layer - modals and dialogs */}
			{overlay ? (
				<div className="absolute inset-0 z-50 pointer-events-auto">
					{overlay}
				</div>
			) : null}
		</div>
	);
}
