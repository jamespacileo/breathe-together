import { motion } from 'framer-motion';
import { Grid2x2, Moon } from 'lucide-react';
import type { PatternId } from '../lib/patterns';
import { cn } from '../lib/utils';

const PATTERN_ICONS: Record<
	PatternId,
	{ icon: typeof Grid2x2; label: string }
> = {
	box: { icon: Grid2x2, label: 'Box' },
	relaxation: { icon: Moon, label: '4-7-8' },
};

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
	const patterns = Object.entries(PATTERN_ICONS) as [
		PatternId,
		(typeof PATTERN_ICONS)[PatternId],
	][];

	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.4, delay: 0.1 }}
			className={cn('flex gap-1', className)}
		>
			{patterns.map(([key, { icon: Icon, label }]) => {
				const isActive = pattern === key;
				return (
					<button
						key={key}
						type="button"
						onClick={() => onChange(key)}
						aria-label={`${label} breathing pattern`}
						aria-pressed={isActive}
						className={cn(
							'h-11 w-11 rounded-full flex items-center justify-center',
							'transition-all duration-200 ease-out',
							'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora/40',
							'active:scale-[0.95]',
							isActive
								? 'bg-void-light/70 border border-aurora/30 text-stellar shadow-[0_0_15px_rgba(34,211,238,0.15)]'
								: 'bg-transparent border border-transparent text-stellar-muted hover:text-stellar hover:bg-void-light/30',
						)}
					>
						<Icon className="h-5 w-5" />
					</button>
				);
			})}
		</motion.div>
	);
}
