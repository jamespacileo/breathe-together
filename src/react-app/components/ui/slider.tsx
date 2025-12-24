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
			'relative flex w-full touch-none select-none items-center py-2',
			className,
		)}
		{...props}
	>
		{/* Track with cosmic gradient */}
		<SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-gradient-to-r from-nebula/30 via-nebula-glow/20 to-aurora/20">
			{/* Range with aurora fill */}
			<SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-nebula-glow via-aurora to-aurora-bright shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
		</SliderPrimitive.Track>
		{/* Thumb with celestial glow */}
		<SliderPrimitive.Thumb
			className={cn(
				'block h-4 w-4 rounded-full',
				'bg-gradient-to-br from-white via-nebula-soft to-aurora-soft',
				'shadow-[0_0_15px_rgba(168,85,247,0.6),0_0_30px_rgba(168,85,247,0.3)]',
				'transition-all duration-200',
				'hover:scale-110 hover:shadow-[0_0_20px_rgba(168,85,247,0.8),0_0_40px_rgba(168,85,247,0.4)]',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora/50',
				'disabled:pointer-events-none disabled:opacity-50',
			)}
		/>
	</SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
