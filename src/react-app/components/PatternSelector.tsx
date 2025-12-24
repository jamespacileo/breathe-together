import { motion } from 'framer-motion';
import { PATTERNS, type PatternId } from '../lib/patterns';
import { cn } from '../lib/utils';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

interface PatternSelectorProps {
	pattern: PatternId;
	onChange: (pattern: PatternId) => void;
	className?: string;
}

export function PatternSelector({
	pattern,
	onChange,
	className,
}: PatternSelectorProps) {
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.4, delay: 0.1 }}
		>
			<ToggleGroup
				type="single"
				value={pattern}
				onValueChange={(value) => value && onChange(value as PatternId)}
				className={cn(
					// Mobile-first: vertical stack, horizontal on larger screens
					'flex-col sm:flex-row',
					// Minimal glass container
					'bg-stellar-ghost/30 backdrop-blur-md',
					'border border-stellar-ghost',
					'shadow-sm',
					className,
				)}
			>
				{Object.entries(PATTERNS).map(([key, cfg]) => (
					<ToggleGroupItem
						key={key}
						value={key}
						aria-label={`${cfg.name} breathing pattern`}
						className={cn(
							// Touch-friendly sizing
							'min-h-[44px] px-3 py-2',
							'text-xs sm:text-sm',
							'font-light tracking-wide',
						)}
					>
						{cfg.name}
					</ToggleGroupItem>
				))}
			</ToggleGroup>
		</motion.div>
	);
}
