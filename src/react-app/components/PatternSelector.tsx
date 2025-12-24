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
			className={cn('flex-col sm:flex-row', 'animate-fade-in', className)}
		>
			{Object.entries(PATTERNS).map(([key, cfg]) => (
				<ToggleGroupItem
					key={key}
					value={key}
					aria-label={`${cfg.name} breathing pattern`}
				>
					{cfg.name}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}
