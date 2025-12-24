import { ChevronRight, Palette, Settings, Sparkles, X } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { VisualizationConfig } from '../lib/config';
import { IconButton } from './ui/icon-button';
import { Slider } from './ui/slider';

interface ConfigSliderProps {
	label: string;
	value: number;
	onChange: (value: number) => void;
	min: number;
	max: number;
	step?: number;
}

const ConfigSlider = memo(
	({ label, value, onChange, min, max, step = 0.01 }: ConfigSliderProps) => {
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

		return (
			<div className="mb-3">
				<div className="flex justify-between text-xs mb-1.5">
					<span className="text-white/70">{label}</span>
					<span className="font-mono text-white/90">
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
	},
);

interface ColorPickerProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
	return (
		<div className="mb-3 flex items-center justify-between">
			<span className="text-xs text-white/70">{label}</span>
			<div className="flex items-center gap-2">
				<span className="text-xs font-mono text-white/60">{value}</span>
				<input
					type="color"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-white/20"
				/>
			</div>
		</div>
	);
}

interface SettingsPanelProps {
	config: VisualizationConfig;
	setConfig: (config: VisualizationConfig) => void;
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	onEnableDevMode?: () => void;
}

export function SettingsPanel({
	config,
	setConfig,
	isOpen,
	setIsOpen,
	onEnableDevMode,
}: SettingsPanelProps) {
	const updateConfig = <K extends keyof VisualizationConfig>(
		key: K,
		value: VisualizationConfig[K],
	) => {
		setConfig({ ...config, [key]: value });
	};

	if (!isOpen) {
		return (
			<IconButton
				onClick={() => setIsOpen(true)}
				aria-label="Open settings"
				className="bg-black/50 backdrop-blur-md hover:bg-black/70 border border-white/20"
			>
				<Settings className="h-5 w-5" />
			</IconButton>
		);
	}

	return (
		<div className="w-[calc(100vw-1.5rem)] sm:w-64 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto bg-black/80 backdrop-blur-md border border-white/20 rounded-xl text-white text-sm">
			{/* Header */}
			<div className="sticky top-0 bg-black/90 p-3 border-b border-white/10 flex justify-between items-center">
				<span className="font-medium">Settings</span>
				<IconButton
					onClick={() => setIsOpen(false)}
					aria-label="Close"
					size="sm"
					className="opacity-50 hover:opacity-100"
				>
					<X className="h-4 w-4" />
				</IconButton>
			</div>

			<div className="p-4 space-y-6">
				{/* Theme Section */}
				<section>
					<div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/70 mb-3">
						<Palette className="h-4 w-4" />
						Theme
					</div>
					<ColorPicker
						label="Accent Color"
						value={config.primaryColor}
						onChange={(v) => updateConfig('primaryColor', v)}
					/>
					<ColorPicker
						label="Background"
						value={config.backgroundColor}
						onChange={(v) => updateConfig('backgroundColor', v)}
					/>
				</section>

				{/* Animation Section */}
				<section>
					<div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/70 mb-3">
						<Sparkles className="h-4 w-4" />
						Animation
					</div>
					<ConfigSlider
						label="Bloom Intensity"
						value={config.bloomStrength}
						onChange={(v) => updateConfig('bloomStrength', v)}
						min={0}
						max={3}
					/>
				</section>

				{/* Advanced Mode Toggle */}
				{onEnableDevMode ? (
					<button
						type="button"
						onClick={onEnableDevMode}
						className="w-full flex items-center justify-between p-3 -mx-1 text-xs text-white/40 hover:text-white/60 transition-colors rounded-lg hover:bg-white/5"
					>
						<span>Advanced Settings</span>
						<ChevronRight className="h-4 w-4" />
					</button>
				) : null}
			</div>
		</div>
	);
}
