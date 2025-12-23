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
			className={cn(
				'bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-full p-1',
				'flex-col sm:flex-row',
				className,
			)}
		>
			{Object.entries(PATTERNS).map(([key, cfg]) => (
				<ToggleGroupItem
					key={key}
					value={key}
					aria-label={`${cfg.name} breathing pattern`}
					className={cn(
						'rounded-xl sm:rounded-full px-3 py-2 sm:py-1.5 text-xs',
						'min-h-[44px] sm:min-h-0',
						'data-[state=on]:bg-white/20',
					)}
				>
					{cfg.name}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}
