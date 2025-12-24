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
			transition={{ duration: 1, delay: 0.6 }}
			className={cn('relative', className)}
		>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				aria-expanded={isOpen}
				aria-haspopup="listbox"
				aria-label={`Current pattern: ${currentPattern.name}. Click to change.`}
				className={cn(
					'group flex items-center gap-2 px-4 py-2 rounded-full',
					'bg-transparent border border-white/[0.04]',
					'text-white/30 text-xs tracking-widest uppercase font-light',
					'hover:text-white/50 hover:border-white/[0.08]',
					'transition-all duration-500',
					'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/10',
					'min-h-[40px]',
				)}
			>
				<span className="hidden sm:inline">{currentPattern.name}</span>
				<span className="sm:hidden">{getPatternShortName(pattern)}</span>
				<ChevronDown
					className={cn(
						'h-3 w-3 opacity-30 transition-transform duration-300',
						isOpen && 'rotate-180',
					)}
				/>
			</button>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: -8, scale: 0.96 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -8, scale: 0.96 }}
						transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
						role="listbox"
						className={cn(
							'absolute right-0 mt-3 py-2',
							'bg-[#080c14]/90 backdrop-blur-2xl',
							'border border-white/[0.04] rounded-xl',
							'shadow-2xl shadow-black/40',
							'min-w-[180px]',
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
									'w-full px-4 py-3 text-left transition-all duration-300',
									'hover:bg-white/[0.02]',
									'focus-visible:outline-none focus-visible:bg-white/[0.02]',
									pattern === key
										? 'text-white/60'
										: 'text-white/30 hover:text-white/50',
								)}
							>
								<div className="font-display text-sm italic tracking-wide">
									{cfg.name}
								</div>
								<div className="text-[9px] text-white/20 mt-1 tracking-widest uppercase font-light">
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
