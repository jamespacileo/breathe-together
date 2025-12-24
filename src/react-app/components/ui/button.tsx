import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean;
	variant?: 'default' | 'primary' | 'outline' | 'ghost' | 'link';
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
					// Base styles
					'inline-flex items-center justify-center whitespace-nowrap rounded-full',
					'text-sm font-medium tracking-wide',
					'transition-all duration-200 ease-out',
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
					'disabled:pointer-events-none disabled:opacity-40',
					'active:scale-[0.98]',
					// Variants
					{
						// Default: subtle glass button
						'bg-white/8 text-white/90 border border-white/10 hover:bg-white/12 hover:border-white/20':
							variant === 'default',
						// Primary: PlayStation-style glowing CTA
						'cta-button text-white font-medium': variant === 'primary',
						// Outline: refined border button
						'glow-button text-white/90': variant === 'outline',
						// Ghost: minimal hover state
						'text-white/70 hover:text-white hover:bg-white/8':
							variant === 'ghost',
						// Link: underline style
						'text-white/80 underline-offset-4 hover:underline hover:text-white':
							variant === 'link',
					},
					// Sizes
					{
						'h-10 px-5 py-2': size === 'default',
						'h-8 px-4 text-xs': size === 'sm',
						'h-12 px-8 text-base': size === 'lg',
						'h-10 w-10 p-0': size === 'icon',
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
