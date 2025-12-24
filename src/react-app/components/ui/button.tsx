import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean;
	variant?: 'default' | 'ghost' | 'primary' | 'minimal';
	size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant = 'default',
			size = 'default',
			asChild = false,
			...props
		},
		ref,
	) => {
		const Comp = asChild ? Slot : 'button';
		return (
			<Comp
				className={cn(
					// Base styles - minimal and touch-friendly
					'inline-flex items-center justify-center whitespace-nowrap',
					'text-sm font-light tracking-wide',
					'transition-all duration-200 ease-out',
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora/40',
					'disabled:pointer-events-none disabled:opacity-40',
					// Active state feedback for mobile
					'active:scale-[0.97] active:opacity-90',
					// Touch-friendly minimum size
					'min-h-[44px]',
					// Variants - simplified for mobile/game UI
					{
						// Default: Subtle glass with soft glow
						'rounded-full bg-void-light/60 backdrop-blur-md text-stellar border border-stellar-faint/50 hover:border-stellar-dim hover:bg-void-light/80':
							variant === 'default',
						// Ghost: Minimal, icon-friendly
						'rounded-full text-stellar-muted hover:text-stellar hover:bg-stellar-ghost/50':
							variant === 'ghost',
						// Primary: Main action button with glow
						'rounded-full bg-gradient-to-r from-nebula/40 to-aurora/30 backdrop-blur-md text-stellar border border-aurora/20 shadow-[0_0_20px_rgba(34,211,238,0.15)] hover:shadow-[0_0_30px_rgba(34,211,238,0.25)] hover:border-aurora/40':
							variant === 'primary',
						// Minimal: Nearly invisible, just text
						'rounded-lg text-stellar-dim hover:text-stellar-muted':
							variant === 'minimal',
					},
					// Sizes - optimized for touch
					{
						'h-11 px-5 py-2.5': size === 'default',
						'h-9 px-4 text-xs': size === 'sm',
						'h-12 px-6 text-base': size === 'lg',
						'h-11 w-11 p-0': size === 'icon',
					},
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = 'Button';

export { Button };
