import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					// Base cosmic input
					'flex h-11 w-full rounded-xl px-4 py-2 text-sm font-light',
					// Cosmic glass background
					'bg-gradient-to-r from-void-light/80 to-nebula-deep/20 backdrop-blur-md',
					// Border with subtle glow
					'border border-stellar-faint',
					// Text styling
					'text-stellar placeholder:text-stellar-dim',
					// Transitions
					'transition-all duration-300 ease-out',
					// Focus state - aurora glow
					'focus-visible:outline-none focus-visible:border-aurora/50 focus-visible:shadow-[0_0_20px_rgba(34,211,238,0.2)]',
					// Hover
					'hover:border-stellar-dim',
					// File input
					'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-stellar-soft',
					// Disabled
					'disabled:cursor-not-allowed disabled:opacity-40',
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
Input.displayName = 'Input';

export { Input };
