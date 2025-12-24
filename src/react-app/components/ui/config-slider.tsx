import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Slider } from './slider';

interface ConfigSliderProps {
	label: string;
	value: number;
	onChange: (value: number) => void;
	min: number;
	max: number;
	step?: number;
	/**
	 * Visual variant:
	 * - 'default': Cosmic styling for user-facing settings
	 * - 'debug': Compact mono styling for debug panel
	 */
	variant?: 'default' | 'debug';
}

/**
 * Memoized slider component with local state for smoother interaction.
 * Uses debouncing to prevent excessive prop updates during drag.
 */
export const ConfigSlider = memo(function ConfigSliderInner({
	label,
	value,
	onChange,
	min,
	max,
	step = 0.01,
	variant = 'default',
}: ConfigSliderProps) {
	const [localValue, setLocalValue] = useState(value);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isInteractingRef = useRef(false);

	// Sync with external value when not interacting
	useEffect(() => {
		if (!isInteractingRef.current) {
			setLocalValue(value);
		}
	}, [value]);

	const handleChange = useCallback(
		(newValue: number) => {
			isInteractingRef.current = true;
			setLocalValue(newValue);

			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
			debounceRef.current = setTimeout(() => {
				onChange(newValue);
				isInteractingRef.current = false;
			}, 16);
		},
		[onChange],
	);

	// Cleanup debounce timer
	useEffect(() => {
		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, []);

	const formattedValue =
		typeof localValue === 'number'
			? localValue.toFixed(step < 1 ? 2 : 0)
			: String(localValue);

	if (variant === 'debug') {
		return (
			<div className="mb-2">
				<div className="flex justify-between text-xs mb-1">
					<span className="text-white/70">{label}</span>
					<span className="font-mono text-white/90">{formattedValue}</span>
				</div>
				<Slider
					value={[localValue]}
					onValueChange={([v]) => handleChange(v)}
					min={min}
					max={max}
					step={step}
				/>
			</div>
		);
	}

	// Default cosmic variant
	return (
		<div className="mb-4">
			<div className="flex justify-between text-xs mb-2">
				<span className="text-stellar-muted font-light tracking-wide">
					{label}
				</span>
				<span className="font-mono text-aurora-bright text-[11px]">
					{formattedValue}
				</span>
			</div>
			<Slider
				value={[localValue]}
				onValueChange={([v]) => handleChange(v)}
				min={min}
				max={max}
				step={step}
			/>
		</div>
	);
});
