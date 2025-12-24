import { memo } from 'react';

export interface ConfigToggleProps {
	label: string;
	value: boolean;
	onChange: (value: boolean) => void;
}

/**
 * Toggle switch component for boolean config values.
 */
export const ConfigToggle = memo(function ConfigToggleComponent({
	label,
	value,
	onChange,
}: ConfigToggleProps) {
	return (
		<div className="mb-2 flex items-center justify-between">
			<span className="text-xs text-white/70">{label}</span>
			<button
				type="button"
				onClick={() => onChange(!value)}
				className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
					value ? 'bg-blue-500' : 'bg-white/20'
				}`}
			>
				<span
					className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
						value ? 'translate-x-4.5' : 'translate-x-0.5'
					}`}
					style={{ transform: value ? 'translateX(18px)' : 'translateX(2px)' }}
				/>
			</button>
		</div>
	);
});
