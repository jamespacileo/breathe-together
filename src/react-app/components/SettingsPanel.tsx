import { AnimatePresence, motion } from 'framer-motion';
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

const ConfigSlider = memo(function ConfigSliderInner({
	label,
	value,
	onChange,
	min,
	max,
	step = 0.01,
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

	return (
		<div className="mb-4">
			<div className="flex justify-between text-xs mb-2">
				<span className="text-stellar-muted font-light tracking-wide">
					{label}
				</span>
				<span className="font-mono text-aurora-bright text-[11px]">
					{localValue.toFixed(step < 1 ? 2 : 0)}
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

interface ColorPickerProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
	return (
		<div className="mb-4 flex items-center justify-between">
			<span className="text-xs text-stellar-muted font-light tracking-wide">
				{label}
			</span>
			<div className="flex items-center gap-3">
				<span className="text-[11px] font-mono text-stellar-dim">{value}</span>
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
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.3 }}
			>
				<IconButton
					onClick={() => setIsOpen(true)}
					aria-label="Open settings"
					variant="default"
				>
					<Settings className="h-6 w-6" />
				</IconButton>
			</motion.div>
		);
	}

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0, x: -20, scale: 0.95 }}
				animate={{ opacity: 1, x: 0, scale: 1 }}
				exit={{ opacity: 0, x: -20, scale: 0.95 }}
				transition={{ duration: 0.3, ease: 'easeOut' }}
				className="w-[calc(100vw-1.5rem)] sm:w-72 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto cosmic-glass rounded-2xl text-sm"
			>
				{/* Header */}
				<div className="sticky top-0 z-10 bg-gradient-to-b from-void-light/95 to-void-light/80 backdrop-blur-xl p-4 border-b border-stellar-ghost flex justify-between items-center">
					<span className="font-serif text-lg font-light tracking-wide text-stellar">
						Settings
					</span>
					<IconButton
						onClick={() => setIsOpen(false)}
						aria-label="Close"
						size="sm"
						variant="ghost"
					>
						<X className="h-4 w-4" />
					</IconButton>
				</div>

				<div className="p-5 space-y-6">
					{/* Theme Section */}
					<section>
						<div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-nebula-soft mb-4">
							<Palette className="h-4 w-4" />
							<span>Theme</span>
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
						<div className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-aurora-bright mb-4">
							<Sparkles className="h-4 w-4" />
							<span>Animation</span>
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
							className="w-full flex items-center justify-between p-3 text-xs text-stellar-dim hover:text-stellar-muted transition-all duration-300 rounded-xl hover:bg-stellar-ghost group"
						>
							<span className="tracking-wide">Advanced Settings</span>
							<ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
						</button>
					) : null}
				</div>
			</motion.div>
		</AnimatePresence>
	);
}
