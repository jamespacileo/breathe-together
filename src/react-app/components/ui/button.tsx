import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean;
	variant?:
		| 'default'
		| 'outline'
		| 'ghost'
		| 'link'
		| 'cosmic'
		| 'aurora'
		| 'minimal';
	size?: 'default' | 'sm' | 'lg' | 'icon' | 'touch';
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
					// Base styles
					'inline-flex items-center justify-center whitespace-nowrap text-sm font-light tracking-wide transition-all duration-300 ease-out',
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora/50 focus-visible:ring-offset-2 focus-visible:ring-offset-void',
					'disabled:pointer-events-none disabled:opacity-40',
					// Variants
					{
						// Default: Subtle cosmic glass
						'rounded-full bg-gradient-to-r from-nebula/20 via-nebula-glow/10 to-aurora/10 text-stellar backdrop-blur-md border border-stellar-faint hover:border-nebula-glow/50 hover:shadow-glow-sm hover:from-nebula/30 hover:to-aurora/20':
							variant === 'default',
						// Outline: Ethereal border
						'rounded-full border border-stellar-dim bg-transparent text-stellar-soft hover:text-stellar hover:border-aurora/50 hover:bg-aurora/5 hover:shadow-glow-aurora':
							variant === 'outline',
						// Ghost: Minimal presence
						'rounded-lg text-stellar-muted hover:text-stellar hover:bg-stellar-ghost':
							variant === 'ghost',
						// Link: Aurora accent
						'text-aurora-bright underline-offset-4 hover:underline hover:text-aurora decoration-aurora/50':
							variant === 'link',
						// Cosmic: Full nebula effect
						'rounded-full bg-gradient-to-r from-nebula via-nebula-glow to-aurora text-white font-normal shadow-glow hover:shadow-glow-lg hover:scale-[1.02] active:scale-[0.98]':
							variant === 'cosmic',
						// Aurora: Bright accent button
						'rounded-full bg-gradient-to-r from-aurora-deep via-aurora to-aurora-bright text-void-deep font-medium shadow-glow-aurora hover:shadow-[0_0_50px_rgba(34,211,238,0.5)] hover:scale-[1.02] active:scale-[0.98]':
							variant === 'aurora',
						// Minimal: Clean, game-like mobile button
						'rounded-xl bg-stellar-ghost/50 text-stellar-soft border border-stellar-ghost hover:bg-stellar-ghost hover:text-stellar hover:border-stellar-faint active:scale-[0.97] backdrop-blur-sm':
							variant === 'minimal',
					},
					// Sizes
					{
						'h-10 px-6 py-2': size === 'default',
						'h-8 px-4 text-xs': size === 'sm',
						'h-12 px-8 text-base': size === 'lg',
						'h-10 w-10 p-0': size === 'icon',
						// Touch-friendly size for mobile
						'h-12 min-h-[48px] px-5 py-3 text-sm': size === 'touch',
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
