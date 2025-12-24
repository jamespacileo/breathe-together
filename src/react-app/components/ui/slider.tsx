import * as SliderPrimitive from '@radix-ui/react-slider';
import * as React from 'react';
import { cn } from '../../lib/utils';

const Slider = React.forwardRef<
	React.ElementRef<typeof SliderPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
	<SliderPrimitive.Root
		ref={ref}
		className={cn(
			'relative flex w-full touch-none select-none items-center',
			'group',
			className,
		)}
		{...props}
	>
		<SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-white/10">
			<SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-[#00D4FF]/60 to-[#00D4FF]/80" />
		</SliderPrimitive.Track>
		<SliderPrimitive.Thumb
			className={cn(
				'block h-4 w-4 rounded-full',
				'bg-white border-0',
				'shadow-glow-sm',
				'transition-all duration-200',
				'hover:scale-110 hover:shadow-glow-md',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]/50',
				'disabled:pointer-events-none disabled:opacity-40',
			)}
		/>
	</SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
