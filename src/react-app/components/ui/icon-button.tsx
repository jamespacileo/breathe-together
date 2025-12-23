import * as React from 'react';
import { cn } from '../../lib/utils';

export interface IconButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	'aria-label': string;
	size?: 'sm' | 'md' | 'lg';
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
	({ className, size = 'md', ...props }, ref) => {
		return (
			<button
				type="button"
				className={cn(
					'inline-flex items-center justify-center rounded-full transition-colors',
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
					'disabled:pointer-events-none disabled:opacity-50',
					'text-white hover:bg-white/10',
					{
						'h-8 w-8 min-h-[44px] min-w-[44px]': size === 'sm',
						'h-10 w-10 min-h-[44px] min-w-[44px]': size === 'md',
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
