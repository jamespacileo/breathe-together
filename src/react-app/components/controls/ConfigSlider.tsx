import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Slider } from '../ui/slider';

export interface ConfigSliderProps {
	label: string;
	value: number;
	onChange: (value: number) => void;
	min: number;
	max: number;
	step?: number;
	/** Use cosmic styling (for SettingsPanel) vs debug styling */
	variant?: 'debug' | 'cosmic';
}

/**
 * Memoized slider component with local state for smoother interaction.
 * Debounces onChange to prevent excessive re-renders.
 */
export const ConfigSlider = memo(function ConfigSliderComponent({
	label,
	value,
	onChange,
	min,
	max,
	step = 0.01,
	variant = 'debug',
}: ConfigSliderProps) {
	const [localValue, setLocalValue] = useState(value);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isInteractingRef = useRef(false);

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

	useEffect(() => {
		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, []);

	const isCosmic = variant === 'cosmic';

	return (
		<div className={isCosmic ? 'mb-4' : 'mb-2'}>
			<div
				className={`flex justify-between text-xs ${isCosmic ? 'mb-2' : 'mb-1'}`}
			>
				<span
					className={
						isCosmic
							? 'text-stellar-muted font-light tracking-wide'
							: 'text-white/70'
					}
				>
					{label}
				</span>
				<span
					className={
						isCosmic
							? 'font-mono text-aurora-bright text-[11px]'
							: 'font-mono text-white/90'
					}
				>
					{typeof localValue === 'number'
						? localValue.toFixed(step < 1 ? 2 : 0)
						: String(localValue)}
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
