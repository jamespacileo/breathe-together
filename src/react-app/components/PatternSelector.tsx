import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PATTERNS, type PatternId } from '../lib/patterns';
import { cn } from '../lib/utils';

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
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const currentPattern = PATTERNS[pattern];

	// Close on outside click
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			return () =>
				document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [isOpen]);

	const handleSelect = (id: PatternId) => {
		onChange(id);
		setIsOpen(false);
	};

	return (
		<motion.div
			ref={containerRef}
			initial={{ opacity: 0, x: 10 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.5, delay: 0.3 }}
			className={cn('relative', className)}
		>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				aria-expanded={isOpen}
				aria-haspopup="listbox"
				aria-label={`Current pattern: ${currentPattern.name}. Click to change.`}
				className={cn(
					'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
					'bg-white/5 backdrop-blur-sm border border-white/10',
					'text-white/70 text-xs font-light',
					'hover:bg-white/10 hover:border-white/20 transition-all',
					'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30',
					'min-h-[36px]',
				)}
			>
				<span className="hidden sm:inline">{currentPattern.name}</span>
				<span className="sm:hidden">{getPatternShortName(pattern)}</span>
				<ChevronDown
					className={cn(
						'h-3.5 w-3.5 transition-transform',
						isOpen && 'rotate-180',
					)}
				/>
			</button>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: -8, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -8, scale: 0.95 }}
						transition={{ duration: 0.15 }}
						role="listbox"
						className={cn(
							'absolute right-0 mt-1.5 py-1',
							'bg-black/80 backdrop-blur-md border border-white/15 rounded-xl',
							'shadow-xl shadow-black/30',
							'min-w-[140px]',
						)}
					>
						{Object.entries(PATTERNS).map(([key, cfg]) => (
							<button
								key={key}
								type="button"
								role="option"
								aria-selected={pattern === key}
								onClick={() => handleSelect(key as PatternId)}
								className={cn(
									'w-full px-3 py-2 text-left text-sm transition-colors',
									'hover:bg-white/10',
									'focus-visible:outline-none focus-visible:bg-white/10',
									pattern === key ? 'text-white bg-white/5' : 'text-white/70',
								)}
							>
								<div className="font-medium">{cfg.name}</div>
								<div className="text-xs text-white/40 mt-0.5">
									{getPatternDescription(key as PatternId)}
								</div>
							</button>
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

function getPatternShortName(pattern: PatternId): string {
	switch (pattern) {
		case 'box':
			return 'Box';
		case 'relaxation':
			return '4-7-8';
		default:
			return PATTERNS[pattern].name;
	}
}

function getPatternDescription(pattern: PatternId): string {
	switch (pattern) {
		case 'box':
			return '4-4-4-4 balanced';
		case 'relaxation':
			return '4-7-8 calming';
		default:
			return '';
	}
}
