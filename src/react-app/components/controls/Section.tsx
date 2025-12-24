import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '../ui/collapsible';

export interface SectionProps {
	title: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
}

/**
 * Collapsible section wrapper for grouping related controls.
 */
export function Section({ title, children, defaultOpen = true }: SectionProps) {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<Collapsible open={open} onOpenChange={setOpen} className="mb-3">
			<CollapsibleTrigger className="w-full flex items-center justify-between text-xs uppercase tracking-wide text-white/70 hover:text-white/90 transition-colors mb-2 min-h-[44px]">
				<span>{title}</span>
				{open ? (
					<ChevronUp className="h-4 w-4" />
				) : (
					<ChevronDown className="h-4 w-4" />
				)}
			</CollapsibleTrigger>
			<CollapsibleContent className="pl-1">{children}</CollapsibleContent>
		</Collapsible>
	);
}
