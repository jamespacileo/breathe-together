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
					'flex h-11 w-full rounded-xl',
					'border border-white/10 bg-white/5',
					'px-4 py-2 text-sm text-white',
					'placeholder:text-white/30',
					'transition-all duration-200',
					'hover:border-white/15 hover:bg-white/8',
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]/40 focus-visible:border-[#00D4FF]/30',
					'disabled:cursor-not-allowed disabled:opacity-40',
					// File input styling
					'file:border-0 file:bg-transparent file:text-sm file:font-medium',
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
