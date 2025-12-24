import * as React from 'react';
import { cn } from '../../lib/utils';

export interface IconButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	'aria-label': string;
	size?: 'sm' | 'md' | 'lg';
	variant?: 'default' | 'glass';
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
	({ className, size = 'md', variant = 'default', ...props }, ref) => {
		return (
			<button
				type="button"
				className={cn(
					'inline-flex items-center justify-center rounded-full',
					'transition-all duration-200 ease-out',
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]/50',
					'disabled:pointer-events-none disabled:opacity-40',
					'text-white/80 hover:text-white',
					'active:scale-95',
					// Variants
					{
						'hover:bg-white/10': variant === 'default',
						'glass-panel hover:bg-white/8 hover:border-white/15':
							variant === 'glass',
					},
					// Sizes with mobile touch targets
					{
						'h-9 w-9 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0':
							size === 'sm',
						'h-11 w-11 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0':
							size === 'md',
						'h-12 w-12': size === 'lg',
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
