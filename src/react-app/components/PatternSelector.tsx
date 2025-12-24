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
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.5, delay: 0.2 }}
		>
			<ToggleGroup
				type="single"
				value={pattern}
				onValueChange={(value) => value && onChange(value as PatternId)}
				className={cn(
					// Cosmic glass container
					'flex-col sm:flex-row',
					'bg-gradient-to-r from-void-light/70 via-nebula-deep/15 to-void-light/70',
					'shadow-[0_0_40px_rgba(107,33,168,0.1)]',
					className,
				)}
			>
				{Object.entries(PATTERNS).map(([key, cfg]) => (
					<ToggleGroupItem
						key={key}
						value={key}
						aria-label={`${cfg.name} breathing pattern`}
						className={cn(
							'min-h-[48px] px-5 py-2.5',
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
