import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Settings, X } from 'lucide-react';
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
		<div className="mb-5">
			<div className="flex justify-between text-[10px] mb-3">
				<span className="text-white/30 tracking-widest uppercase font-light">
					{label}
				</span>
				<span className="font-mono text-white/40 tabular-nums">
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
		<div className="mb-4 flex items-center justify-between">
			<span className="text-[10px] text-white/30 tracking-widest uppercase font-light">
				{label}
			</span>
			<div className="flex items-center gap-2">
				<span className="text-[10px] font-mono text-white/25">{value}</span>
				<input
					type="color"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="w-6 h-6 rounded-full cursor-pointer bg-transparent border border-white/10 overflow-hidden"
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
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 1, delay: 0.4 }}
				onClick={() => setIsOpen(!isOpen)}
				aria-label={isOpen ? 'Close settings' : 'Open settings'}
				aria-expanded={isOpen}
				className={cn(
					'flex items-center justify-center rounded-full transition-all duration-500',
					'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/10',
					'w-10 h-10 min-h-[44px] min-w-[44px]',
					isOpen
						? 'bg-white/[0.04] text-white/40'
						: 'bg-transparent text-white/20 hover:text-white/40',
				)}
			>
				<Settings className="h-4 w-4" />
			</motion.button>

			{/* Settings panel */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: -8, scale: 0.96 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -8, scale: 0.96 }}
						transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
						className={cn(
							'absolute top-12 left-0',
							'w-[calc(100vw-2rem)] sm:w-56 max-h-[60vh] overflow-y-auto',
							'bg-[#080c14]/90 backdrop-blur-2xl border border-white/[0.03] rounded-xl',
							'text-white text-sm shadow-2xl shadow-black/40',
						)}
					>
						{/* Header */}
						<div className="sticky top-0 bg-[#080c14]/80 backdrop-blur-sm px-4 py-3 border-b border-white/[0.02] flex justify-between items-center">
							<span className="font-display text-sm italic text-white/40 tracking-wide">
								settings
							</span>
							<button
								type="button"
								onClick={() => setIsOpen(false)}
								aria-label="Close"
								className="p-1.5 rounded-full text-white/20 hover:text-white/40 transition-colors duration-300"
							>
								<X className="h-3.5 w-3.5" />
							</button>
						</div>

						<div className="p-5 space-y-6">
							{/* Theme Section */}
							<section>
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
									className="w-full flex items-center justify-between py-2 text-[10px] text-white/20 hover:text-white/40 transition-colors duration-300 tracking-widest uppercase font-light"
								>
									<span>Advanced</span>
									<ChevronRight className="h-3 w-3" />
								</button>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
