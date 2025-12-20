import { PATTERNS, type PatternId } from '../lib/patterns';
import { cn } from '../lib/utils';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

interface PatternSelectorProps {
	pattern: PatternId;
	onChange: (pattern: PatternId) => void;
	className?: string;
}

// Short labels for mobile
const SHORT_LABELS: Record<string, string> = {
	box: '4-4-4-4',
	relaxation: '4-7-8',
};

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
			className={cn('bg-white/5 rounded-full p-1', className)}
		>
			{Object.entries(PATTERNS).map(([key, cfg]) => (
				<ToggleGroupItem
					key={key}
					value={key}
					aria-label={`${cfg.name} breathing pattern`}
					className="rounded-full px-2.5 py-1.5 text-xs data-[state=on]:bg-white/20 text-white/80"
				>
					{SHORT_LABELS[key] || cfg.name}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}
