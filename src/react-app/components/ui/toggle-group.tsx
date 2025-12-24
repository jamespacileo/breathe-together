import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import * as React from 'react';
import { cn } from '../../lib/utils';

const ToggleGroupContext = React.createContext<{
	size?: 'default' | 'sm' | 'lg';
	variant?: 'default' | 'outline' | 'cosmic';
}>({
	size: 'default',
	variant: 'default',
});

const ToggleGroup = React.forwardRef<
	React.ElementRef<typeof ToggleGroupPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & {
		variant?: 'default' | 'outline' | 'cosmic';
		size?: 'default' | 'sm' | 'lg';
	}
>(
	(
		{ className, variant = 'default', size = 'default', children, ...props },
		ref,
	) => (
		<ToggleGroupPrimitive.Root
			ref={ref}
			className={cn(
				// Cosmic glass container
				'inline-flex items-center justify-center gap-1 p-1.5',
				'rounded-full',
				'bg-gradient-to-r from-void-light/60 via-nebula-deep/10 to-void-light/60',
				'backdrop-blur-md',
				'border border-stellar-ghost',
				className,
			)}
			{...props}
		>
			<ToggleGroupContext.Provider value={{ variant, size }}>
				{children}
			</ToggleGroupContext.Provider>
		</ToggleGroupPrimitive.Root>
	),
);

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

const ToggleGroupItem = React.forwardRef<
	React.ElementRef<typeof ToggleGroupPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & {
		variant?: 'default' | 'outline' | 'cosmic';
		size?: 'default' | 'sm' | 'lg';
	}
>(({ className, children, variant, size, ...props }, ref) => {
	const context = React.useContext(ToggleGroupContext);

	return (
		<ToggleGroupPrimitive.Item
			ref={ref}
			className={cn(
				// Base styles
				'inline-flex items-center justify-center whitespace-nowrap rounded-full',
				'text-sm font-light tracking-wide',
				'transition-all duration-300 ease-out',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora/40',
				'disabled:pointer-events-none disabled:opacity-40',
				// Variant styles
				{
					// Default: subtle cosmic
					'text-stellar-muted hover:text-stellar hover:bg-stellar-ghost data-[state=on]:bg-gradient-to-r data-[state=on]:from-nebula/30 data-[state=on]:to-aurora/20 data-[state=on]:text-stellar data-[state=on]:shadow-glow-sm':
						(variant || context.variant) === 'default',
					// Outline: border accent
					'border border-transparent text-stellar-muted hover:text-stellar hover:border-stellar-faint data-[state=on]:border-aurora/40 data-[state=on]:text-stellar data-[state=on]:bg-aurora/10':
						(variant || context.variant) === 'outline',
					// Cosmic: full glow
					'text-stellar-muted hover:text-stellar data-[state=on]:bg-gradient-to-r data-[state=on]:from-nebula data-[state=on]:via-nebula-glow data-[state=on]:to-aurora data-[state=on]:text-white data-[state=on]:shadow-glow':
						(variant || context.variant) === 'cosmic',
				},
				// Size variants
				{
					'h-9 px-4': (size || context.size) === 'default',
					'h-7 px-3 text-xs': (size || context.size) === 'sm',
					'h-11 px-5': (size || context.size) === 'lg',
				},
				className,
			)}
			{...props}
		>
			{children}
		</ToggleGroupPrimitive.Item>
	);
});

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { ToggleGroup, ToggleGroupItem };
