import { AnimatePresence, motion } from 'framer-motion';
import {
	ChevronDown,
	ChevronUp,
	Copy,
	Play,
	RefreshCw,
	RotateCcw,
	Settings,
	Square,
	X,
} from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { BreathState } from '../hooks/useBreathSync';
import type { PresenceData } from '../hooks/usePresence';
import { getMoodColor, MOODS } from '../lib/colors';
import { DEFAULT_CONFIG, type VisualizationConfig } from '../lib/config';
import { MOOD_IDS, type SimulationConfig } from '../lib/simulationConfig';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from './ui/collapsible';
import { Label } from './ui/label';
import { Slider } from './ui/slider';

interface ConfigSliderProps {
	label: string;
	value: number;
	onChange: (value: number) => void;
	min: number;
	max: number;
	step?: number;
}

/**
 * Memoized slider component with local state for smoother interaction.
 */
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
		<div className="mb-2">
			<div className="flex justify-between text-xs mb-1">
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
});

interface ConfigToggleProps {
	label: string;
	value: boolean;
	onChange: (value: boolean) => void;
}

const ConfigToggle = memo(function ConfigToggle({
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

interface ColorPickerProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
}

const ColorPicker = memo(function ColorPicker({
	label,
	value,
	onChange,
}: ColorPickerProps) {
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

interface SectionProps {
	title: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
}

function Section({ title, children, defaultOpen = true }: SectionProps) {
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

interface SimulationControlsProps {
	simulationConfig: SimulationConfig;
	updateSimulationConfig: (updates: Partial<SimulationConfig>) => void;
	isSimulationRunning: boolean;
	onStart: () => void;
	onStop: () => void;
	onReset: () => void;
}

interface DebugPanelProps {
	config: VisualizationConfig;
	setConfig: (config: VisualizationConfig) => void;
	breathState: BreathState;
	presence: PresenceData;
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	simulationControls?: SimulationControlsProps;
}

export function DebugPanel({
	config,
	setConfig,
	breathState,
	presence,
	isOpen,
	setIsOpen,
	simulationControls,
}: DebugPanelProps) {
	const resetToDefaults = () => setConfig({ ...DEFAULT_CONFIG });

	const updateConfig = <K extends keyof VisualizationConfig>(
		key: K,
		value: VisualizationConfig[K],
	) => {
		setConfig({ ...config, [key]: value });
	};

	const exportConfig = () => {
		navigator.clipboard.writeText(JSON.stringify(config, null, 2));
	};

	return (
		<>
			{/* Debug toggle button */}
			<motion.button
				type="button"
				initial={{ opacity: 0, x: -10 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ duration: 0.5, delay: 0.1 }}
				onClick={() => setIsOpen(!isOpen)}
				aria-label={isOpen ? 'Close debug panel' : 'Open debug panel'}
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

			{/* Debug panel */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: -8, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -8, scale: 0.95 }}
						transition={{ duration: 0.15 }}
						className={cn(
							'absolute top-11 left-0',
							'w-[calc(100vw-2rem)] sm:w-72 max-h-[65vh] overflow-y-auto',
							'bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl',
							'text-white text-sm shadow-2xl shadow-black/50',
						)}
					>
						{/* Header */}
						<div className="sticky top-0 bg-black/90 backdrop-blur-sm px-4 py-3 border-b border-white/5 flex justify-between items-center">
							<span className="text-xs font-medium uppercase tracking-wider text-white/70">
								Debug
							</span>
							<div className="flex gap-1">
								<button
									type="button"
									onClick={resetToDefaults}
									aria-label="Reset to defaults"
									className="p-1 rounded-full text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
								>
									<RotateCcw className="h-3.5 w-3.5" />
								</button>
								<button
									type="button"
									onClick={() => setIsOpen(false)}
									aria-label="Close panel"
									className="p-1 rounded-full text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
								>
									<X className="h-3.5 w-3.5" />
								</button>
							</div>
						</div>

						<div className="p-3">
							{/* Live State */}
							<Section title="Live State" defaultOpen={true}>
								<div className="text-xs font-mono bg-white/5 rounded p-2 mb-2">
									<div>Phase: {breathState.phase}</div>
									<div>
										Progress: {(breathState.progress * 100).toFixed(1)}%
									</div>
									<div>Presence: {presence.count}</div>
								</div>
								{presence.moods &&
									Object.values(presence.moods).some((v) => v > 0) && (
										<div className="mt-2">
											<Label className="text-[10px] text-white/60 mb-1 block">
												Mood Breakdown
											</Label>
											<div className="flex flex-wrap gap-1">
												{MOOD_IDS.map((moodId) => {
													const count = presence.moods[moodId] ?? 0;
													if (count === 0) return null;
													const mood = MOODS.find((m) => m.id === moodId);
													return (
														<div
															key={moodId}
															className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 rounded text-[10px]"
														>
															<div
																className="w-1.5 h-1.5 rounded-full"
																style={{ background: getMoodColor(moodId) }}
															/>
															<span className="text-white/70">
																{mood?.label.split('...')[0] ?? moodId}
															</span>
															<span className="font-mono">{count}</span>
														</div>
													);
												})}
											</div>
										</div>
									)}
							</Section>

							{/* Simulation Controls */}
							{simulationControls ? (
								<Section title="Simulation" defaultOpen={true}>
									<div className="mb-2 flex gap-2">
										{simulationControls.isSimulationRunning ? (
											<Button
												onClick={simulationControls.onStop}
												size="sm"
												className="flex-1 gap-2 bg-red-500/20 border-red-500/40 hover:bg-red-500/30"
											>
												<Square className="h-4 w-4" />
												Stop
											</Button>
										) : (
											<Button
												onClick={simulationControls.onStart}
												size="sm"
												className="flex-1 gap-2 bg-green-500/20 border-green-500/40 hover:bg-green-500/30"
											>
												<Play className="h-4 w-4" />
												Start
											</Button>
										)}
										<Button
											onClick={simulationControls.onReset}
											variant="outline"
											size="sm"
											className="flex-1 gap-2"
										>
											<RefreshCw className="h-4 w-4" />
											Reset
										</Button>
									</div>
									<ConfigSlider
										label="Target Population"
										value={simulationControls.simulationConfig.targetPopulation}
										onChange={(v) =>
											simulationControls.updateSimulationConfig({
												targetPopulation: Math.round(v),
											})
										}
										min={1}
										max={200}
										step={1}
									/>
									<ConfigSlider
										label="Stay Duration (sec)"
										value={
											simulationControls.simulationConfig.meanStayDuration /
											1000
										}
										onChange={(v) =>
											simulationControls.updateSimulationConfig({
												meanStayDuration: v * 1000,
											})
										}
										min={10}
										max={600}
										step={10}
									/>
									<ConfigSlider
										label="Time Scale"
										value={simulationControls.simulationConfig.timeScale}
										onChange={(v) =>
											simulationControls.updateSimulationConfig({
												timeScale: v,
											})
										}
										min={1}
										max={50}
										step={1}
									/>
								</Section>
							) : null}

							{/* 3D Sphere */}
							<Section title="3D Sphere" defaultOpen={false}>
								<ConfigSlider
									label="Contracted Radius"
									value={config.sphereContractedRadius}
									onChange={(v) => updateConfig('sphereContractedRadius', v)}
									min={0.3}
									max={1.5}
								/>
								<ConfigSlider
									label="Expanded Radius"
									value={config.sphereExpandedRadius}
									onChange={(v) => updateConfig('sphereExpandedRadius', v)}
									min={1}
									max={4}
								/>
								<ConfigSlider
									label="Rotation Speed"
									value={config.sphereRotationSpeed}
									onChange={(v) => updateConfig('sphereRotationSpeed', v)}
									min={0}
									max={0.1}
									step={0.005}
								/>
							</Section>

							{/* Connections */}
							<Section title="Connections" defaultOpen={false}>
								<ConfigToggle
									label="Enable Connections"
									value={config.connectionEnabled}
									onChange={(v) => updateConfig('connectionEnabled', v)}
								/>
								<ConfigSlider
									label="Max Distance"
									value={config.connectionDistance}
									onChange={(v) => updateConfig('connectionDistance', v)}
									min={0.1}
									max={1}
								/>
								<ConfigSlider
									label="Opacity"
									value={config.connectionOpacity}
									onChange={(v) => updateConfig('connectionOpacity', v)}
									min={0}
									max={0.5}
								/>
							</Section>

							{/* Haze */}
							<Section title="Haze" defaultOpen={false}>
								<ConfigToggle
									label="Enable Haze"
									value={config.hazeEnabled}
									onChange={(v) => updateConfig('hazeEnabled', v)}
								/>
								<ConfigSlider
									label="Opacity"
									value={config.hazeOpacity}
									onChange={(v) => updateConfig('hazeOpacity', v)}
									min={0}
									max={0.3}
								/>
							</Section>

							{/* Bloom */}
							<Section title="Bloom" defaultOpen={false}>
								<ConfigToggle
									label="Enable Bloom"
									value={config.bloomEnabled}
									onChange={(v) => updateConfig('bloomEnabled', v)}
								/>
								<ConfigSlider
									label="Strength"
									value={config.bloomStrength}
									onChange={(v) => updateConfig('bloomStrength', v)}
									min={0}
									max={3}
								/>
								<ConfigSlider
									label="Threshold"
									value={config.bloomThreshold}
									onChange={(v) => updateConfig('bloomThreshold', v)}
									min={0}
									max={1}
								/>
								<ConfigSlider
									label="Radius"
									value={config.bloomRadius}
									onChange={(v) => updateConfig('bloomRadius', v)}
									min={0}
									max={1}
								/>
							</Section>

							{/* Breathing Animation */}
							<Section title="Breathing" defaultOpen={false}>
								<ConfigSlider
									label="Base Radius"
									value={config.baseRadius}
									onChange={(v) => updateConfig('baseRadius', v)}
									min={0.1}
									max={0.45}
								/>
								<ConfigSlider
									label="Breathe In Scale"
									value={config.breatheInScale}
									onChange={(v) => updateConfig('breatheInScale', v)}
									min={0.3}
									max={1}
								/>
								<ConfigSlider
									label="Breathe Out Scale"
									value={config.breatheOutScale}
									onChange={(v) => updateConfig('breatheOutScale', v)}
									min={1}
									max={2}
								/>
								<ConfigSlider
									label="Hold Oscillation"
									value={config.holdOscillation}
									onChange={(v) => updateConfig('holdOscillation', v)}
									min={0}
									max={0.1}
								/>
							</Section>

							{/* Spring Physics */}
							<Section title="Spring Physics" defaultOpen={false}>
								<ConfigSlider
									label="Tension"
									value={config.mainSpringTension}
									onChange={(v) => updateConfig('mainSpringTension', v)}
									min={20}
									max={200}
									step={5}
								/>
								<ConfigSlider
									label="Friction"
									value={config.mainSpringFriction}
									onChange={(v) => updateConfig('mainSpringFriction', v)}
									min={5}
									max={50}
									step={1}
								/>
							</Section>

							{/* Colors */}
							<Section title="Colors" defaultOpen={false}>
								<ColorPicker
									label="Primary"
									value={config.primaryColor}
									onChange={(v) => updateConfig('primaryColor', v)}
								/>
								<ColorPicker
									label="Background"
									value={config.backgroundColor}
									onChange={(v) => updateConfig('backgroundColor', v)}
								/>
								<ColorPicker
									label="Background Mid"
									value={config.backgroundColorMid}
									onChange={(v) => updateConfig('backgroundColorMid', v)}
								/>
							</Section>

							{/* Export */}
							<Section title="Export Config" defaultOpen={false}>
								<Button
									onClick={exportConfig}
									variant="outline"
									className="w-full text-xs gap-2"
								>
									<Copy className="h-3 w-3" />
									Copy Config to Clipboard
								</Button>
							</Section>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
