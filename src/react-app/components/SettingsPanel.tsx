import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Palette, Settings, Sparkles, X } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { VisualizationConfig } from '../lib/config';
import { cn } from '../lib/utils';
import { Slider } from './ui/slider';

interface ConfigSliderProps {
	label: string;
	value: number;
	onChange: (value: number) => void;
	min: number;
	max: number;
	step?: number;
}

const ConfigSlider = memo(function ConfigSlider({
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
				<span className="text-white/60">{label}</span>
				<span className="font-mono text-white/80 tabular-nums">
					{typeof localValue === 'number'
						? localValue.toFixed(step < 1 ? 2 : 0)
						: localValue}
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
		<div className="mb-3 flex items-center justify-between">
			<span className="text-xs text-white/60">{label}</span>
			<div className="flex items-center gap-2">
				<span className="text-xs font-mono text-white/50">{value}</span>
				<input
					type="color"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border border-white/20"
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

	return (
		<>
			{/* Settings toggle button */}
			<motion.button
				type="button"
				initial={{ opacity: 0, x: -10 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ duration: 0.5, delay: 0.1 }}
				onClick={() => setIsOpen(!isOpen)}
				aria-label={isOpen ? 'Close settings' : 'Open settings'}
				aria-expanded={isOpen}
				className={cn(
					'flex items-center justify-center rounded-full transition-all',
					'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30',
					'w-9 h-9 min-h-[44px] min-w-[44px]',
					isOpen
						? 'bg-white/15 text-white'
						: 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70',
				)}
			>
				<Settings className="h-4 w-4" />
			</motion.button>

			{/* Settings panel */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: -8, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -8, scale: 0.95 }}
						transition={{ duration: 0.15 }}
						className={cn(
							'absolute top-11 left-0',
							'w-[calc(100vw-2rem)] sm:w-56 max-h-[65vh] overflow-y-auto',
							'bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl',
							'text-white text-sm shadow-2xl shadow-black/50',
						)}
					>
						{/* Header */}
						<div className="sticky top-0 bg-black/90 backdrop-blur-sm px-4 py-3 border-b border-white/5 flex justify-between items-center">
							<span className="text-xs font-medium uppercase tracking-wider text-white/70">
								Settings
							</span>
							<button
								type="button"
								onClick={() => setIsOpen(false)}
								aria-label="Close"
								className="p-1 rounded-full text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
							>
								<X className="h-3.5 w-3.5" />
							</button>
						</div>

						<div className="p-4 space-y-5">
							{/* Theme Section */}
							<section>
								<div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/50 mb-3">
									<Palette className="h-3.5 w-3.5" />
									Theme
								</div>
								<ColorPicker
									label="Accent"
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
								<div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/50 mb-3">
									<Sparkles className="h-3.5 w-3.5" />
									Animation
								</div>
								<ConfigSlider
									label="Bloom"
									value={config.bloomStrength}
									onChange={(v) => updateConfig('bloomStrength', v)}
									min={0}
									max={2}
								/>
								<ConfigSlider
									label="Atmosphere"
									value={config.hazeOpacity}
									onChange={(v) => updateConfig('hazeOpacity', v)}
									min={0}
									max={0.3}
								/>
							</section>

							{/* Advanced Mode Toggle */}
							{onEnableDevMode && (
								<button
									type="button"
									onClick={onEnableDevMode}
									className="w-full flex items-center justify-between py-2 text-xs text-white/30 hover:text-white/50 transition-colors"
								>
									<span>Advanced</span>
									<ChevronRight className="h-3.5 w-3.5" />
								</button>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
