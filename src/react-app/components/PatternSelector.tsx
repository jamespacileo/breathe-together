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
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.8, delay: 0.4 }}
			className={cn('relative', className)}
		>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				aria-expanded={isOpen}
				aria-haspopup="listbox"
				aria-label={`Current pattern: ${currentPattern.name}. Click to change.`}
				className={cn(
					'group flex items-center gap-1.5 px-3 py-1.5 rounded-full',
					'bg-white/[0.03] border border-white/[0.06]',
					'text-white/50 text-xs tracking-wide',
					'hover:bg-white/[0.06] hover:text-white/70 hover:border-white/10',
					'transition-all duration-300',
					'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20',
					'min-h-[36px]',
				)}
			>
				<span className="hidden sm:inline font-light">
					{currentPattern.name}
				</span>
				<span className="sm:hidden font-light">
					{getPatternShortName(pattern)}
				</span>
				<ChevronDown
					className={cn(
						'h-3 w-3 opacity-40 transition-transform duration-200',
						isOpen && 'rotate-180',
					)}
				/>
			</button>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: -4 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -4 }}
						transition={{ duration: 0.15 }}
						role="listbox"
						className={cn(
							'absolute right-0 mt-2 py-1.5',
							'bg-[#0c1220]/95 backdrop-blur-xl',
							'border border-white/[0.08] rounded-lg',
							'shadow-2xl shadow-black/50',
							'min-w-[160px]',
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
									'w-full px-3 py-2.5 text-left transition-colors duration-150',
									'hover:bg-white/[0.04]',
									'focus-visible:outline-none focus-visible:bg-white/[0.04]',
									pattern === key
										? 'text-white/90'
										: 'text-white/50 hover:text-white/70',
								)}
							>
								<div className="font-display text-sm italic">{cfg.name}</div>
								<div className="text-[10px] text-white/30 mt-0.5 tracking-wide">
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
	}
}

function getPatternDescription(pattern: PatternId): string {
	switch (pattern) {
		case 'box':
			return '4-4-4-4 balanced';
		case 'relaxation':
			return '4-7-8 calming';
	}
}
