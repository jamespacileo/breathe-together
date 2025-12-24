import { memo } from 'react';

export interface ColorPickerProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	/** Use cosmic styling (for SettingsPanel) vs debug styling */
	variant?: 'debug' | 'cosmic';
}

/**
 * Color picker component with hex value display.
 */
export const ColorPicker = memo(function ColorPickerComponent({
	label,
	value,
	onChange,
	variant = 'debug',
}: ColorPickerProps) {
	const isCosmic = variant === 'cosmic';

	if (isCosmic) {
		return (
			<div className="mb-4 flex items-center justify-between">
				<span className="text-xs text-stellar-muted font-light tracking-wide">
					{label}
				</span>
				<div className="flex items-center gap-3">
					<span className="text-[11px] font-mono text-stellar-dim">
						{value}
					</span>
					<div className="relative">
						<input
							type="color"
							value={value}
							onChange={(e) => onChange(e.target.value)}
							className="w-9 h-9 rounded-full cursor-pointer bg-transparent border-2 border-stellar-faint hover:border-aurora/50 transition-colors appearance-none"
							style={{
								boxShadow: `0 0 20px ${value}40`,
							}}
						/>
						{/* Glow effect */}
						<div
							className="absolute inset-0 rounded-full opacity-40 pointer-events-none blur-md"
							style={{ backgroundColor: value }}
						/>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="mb-2 flex items-center justify-between">
			<span className="text-xs text-white/70">{label}</span>
			<div className="flex items-center gap-2">
				<span className="text-xs font-mono text-white/90">{value}</span>
				<input
					type="color"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="w-6 h-6 rounded cursor-pointer bg-transparent border border-white/20"
				/>
			</div>
		</div>
	);
});
