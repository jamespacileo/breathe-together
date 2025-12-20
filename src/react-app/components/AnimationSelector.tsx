import { cn } from '../lib/utils';
import type { AnimationId } from './r3f/animations';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

interface AnimationSelectorProps {
	animationId: AnimationId;
	onChange: (animationId: AnimationId) => void;
	className?: string;
}

const ANIMATION_OPTIONS: { id: AnimationId; label: string; icon: string }[] = [
	{ id: 'orb', label: 'Orb', icon: '○' },
	{ id: 'galaxy', label: 'Galaxy', icon: '✦' },
];

export function AnimationSelector({
	animationId,
	onChange,
	className,
}: AnimationSelectorProps) {
	return (
		<ToggleGroup
			type="single"
			value={animationId}
			onValueChange={(value) => value && onChange(value as AnimationId)}
			className={cn('bg-white/5 rounded-full p-1', className)}
		>
			{ANIMATION_OPTIONS.map((opt) => (
				<ToggleGroupItem
					key={opt.id}
					value={opt.id}
					aria-label={`${opt.label} animation style`}
					className="rounded-full px-3 py-1.5 text-xs data-[state=on]:bg-white/20 flex items-center gap-1.5"
				>
					<span className="text-sm">{opt.icon}</span>
					<span className="hidden sm:inline">{opt.label}</span>
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}
