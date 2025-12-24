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
		<ToggleGroup
			type="single"
			value={pattern}
			onValueChange={(value) => value && onChange(value as PatternId)}
			className={cn('glass rounded-2xl p-1', 'flex-col sm:flex-row', className)}
		>
			{Object.entries(PATTERNS).map(([key, cfg]) => (
				<ToggleGroupItem
					key={key}
					value={key}
					aria-label={`${cfg.name} breathing pattern`}
					className={cn(
						'rounded-xl px-4 py-2.5 sm:py-2 text-xs tracking-wide',
						'min-h-[44px] sm:min-h-0',
						'text-white/50 transition-all duration-300',
						'data-[state=on]:bg-white/15 data-[state=on]:text-white',
						'hover:text-white/70',
					)}
				>
					{cfg.name}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}
