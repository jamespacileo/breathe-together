import * as React from 'react';
import { cn } from '../../lib/utils';

export interface IconButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	'aria-label': string;
	size?: 'sm' | 'md' | 'lg';
	variant?: 'default' | 'ghost' | 'glow';
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
	({ className, size = 'md', variant = 'default', ...props }, ref) => {
		return (
			<button
				type="button"
				className={cn(
					// Base styles - minimal and touch-friendly
					'inline-flex items-center justify-center rounded-full',
					'transition-all duration-200 ease-out',
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora/40',
					'disabled:pointer-events-none disabled:opacity-40',
					// Active state feedback for mobile
					'active:scale-[0.95] active:opacity-80',
					// Variants - simplified for mobile/game UI
					{
						// Default: Subtle glass button
						'bg-void-light/50 backdrop-blur-md border border-stellar-faint/40 text-stellar-soft hover:text-stellar hover:bg-void-light/70 hover:border-stellar-dim':
							variant === 'default',
						// Ghost: Nearly invisible
						'bg-transparent text-stellar-muted hover:text-stellar hover:bg-stellar-ghost/30':
							variant === 'ghost',
						// Glow: Soft accent glow
						'bg-void-light/60 backdrop-blur-md border border-aurora/20 text-stellar shadow-[0_0_15px_rgba(34,211,238,0.1)] hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:border-aurora/30':
							variant === 'glow',
					},
					// Sizes - all touch-friendly (min 44px)
					{
						'h-11 w-11': size === 'sm',
						'h-12 w-12': size === 'md',
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
