import * as React from 'react';
import { cn } from '../../lib/utils';

export interface IconButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	'aria-label': string;
	size?: 'sm' | 'md' | 'lg';
	variant?: 'default' | 'cosmic' | 'ghost';
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
	({ className, size = 'md', variant = 'default', ...props }, ref) => {
		return (
			<button
				type="button"
				className={cn(
					// Base styles
					'inline-flex items-center justify-center rounded-full',
					'transition-all duration-300 ease-out',
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora/50',
					'disabled:pointer-events-none disabled:opacity-40',
					// Variants
					{
						// Default: cosmic glass
						'bg-gradient-to-br from-void-light/80 to-nebula-deep/20 backdrop-blur-md border border-stellar-faint text-stellar-soft hover:text-stellar hover:border-nebula-glow/40 hover:shadow-glow-sm':
							variant === 'default',
						// Cosmic: full glow effect
						'bg-gradient-to-r from-nebula/30 to-aurora/20 backdrop-blur-md border border-nebula-glow/30 text-stellar hover:shadow-glow hover:border-nebula-glow/60':
							variant === 'cosmic',
						// Ghost: minimal
						'bg-transparent text-stellar-muted hover:text-stellar hover:bg-stellar-ghost':
							variant === 'ghost',
					},
					// Sizes (with touch-friendly minimums)
					{
						'h-9 w-9 min-h-[44px] min-w-[44px]': size === 'sm',
						'h-11 w-11 min-h-[44px] min-w-[44px]': size === 'md',
						'h-14 w-14': size === 'lg',
					},
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
IconButton.displayName = 'IconButton';

export { IconButton };
