import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import * as React from 'react';
import { cn } from '../../lib/utils';

const ToggleGroupContext = React.createContext<{
	size?: 'default' | 'sm' | 'lg';
	variant?: 'default' | 'outline';
}>({
	size: 'default',
	variant: 'default',
});

const ToggleGroup = React.forwardRef<
	React.ElementRef<typeof ToggleGroupPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & {
		variant?: 'default' | 'outline';
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
				'inline-flex items-center justify-center',
				// Improved padding and gap for better visual balance
				'rounded-full p-1.5 gap-1',
				'bg-black/40 backdrop-blur-md border border-white/8',
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
		variant?: 'default' | 'outline';
		size?: 'default' | 'sm' | 'lg';
	}
>(({ className, children, variant, size, ...props }, ref) => {
	const context = React.useContext(ToggleGroupContext);

	return (
		<ToggleGroupPrimitive.Item
			ref={ref}
			className={cn(
				'inline-flex items-center justify-center whitespace-nowrap',
				'rounded-full text-xs font-medium tracking-wide',
				'transition-all duration-200 ease-out',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]/50',
				'disabled:pointer-events-none disabled:opacity-40',
				// Default variant styling
				{
					'bg-transparent text-white/50 hover:text-white/70 data-[state=on]:bg-white/12 data-[state=on]:text-white data-[state=on]:shadow-sm':
						(variant || context.variant) === 'default',
					'border border-transparent bg-transparent text-white/50 hover:text-white/70 data-[state=on]:border-[#00D4FF]/30 data-[state=on]:bg-[#00D4FF]/10 data-[state=on]:text-white':
						(variant || context.variant) === 'outline',
				},
				// Sizes - generous horizontal padding for touch targets
				{
					'h-9 px-4 min-h-[44px] sm:min-h-0':
						(size || context.size) === 'default',
					'h-8 px-3 text-2xs': (size || context.size) === 'sm',
					'h-11 px-5 text-sm': (size || context.size) === 'lg',
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
