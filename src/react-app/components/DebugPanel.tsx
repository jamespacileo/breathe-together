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
import { DEFAULT_CONFIG, type VisualizationConfig } from '../lib/config';
import type { SimulationConfig } from '../lib/simulationConfig';
import { Button } from './ui/button';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from './ui/collapsible';
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

/**
 * Memoized slider component with local state for smoother interaction.
 */
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
	},
);

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
		<div className="w-[calc(100vw-1.5rem)] sm:w-72 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto bg-black/80 backdrop-blur-md border border-white/20 rounded-xl text-white text-sm">
			{/* Header */}
			<div className="sticky top-0 bg-black/90 p-3 border-b border-white/10 flex justify-between items-center">
				<span className="font-medium">Debug Panel</span>
				<div className="flex gap-1">
					<IconButton
						onClick={resetToDefaults}
						aria-label="Reset to defaults"
						size="sm"
						className="opacity-50 hover:opacity-100"
					>
						<RotateCcw className="h-4 w-4" />
					</IconButton>
					<IconButton
						onClick={() => setIsOpen(false)}
						aria-label="Close panel"
						size="sm"
						className="opacity-50 hover:opacity-100"
					>
						<X className="h-4 w-4" />
					</IconButton>
				</div>
			</div>

			<div className="p-3">
				{/* Live State */}
				<Section title="Live State" defaultOpen={true}>
					<div className="text-xs font-mono bg-white/5 rounded p-2 mb-2">
						<div>Phase: {breathState.phase}</div>
						<div>Progress: {(breathState.progress * 100).toFixed(1)}%</div>
						<div>Presence: {presence.count}</div>
					</div>
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
								variant="ghost"
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
					</Section>
				) : null}

				{/* Sphere Size */}
				<Section title="Sphere Size" defaultOpen={false}>
					<ConfigSlider
						label="Contracted"
						value={config.sphereContractedRadius}
						onChange={(v) => updateConfig('sphereContractedRadius', v)}
						min={0.3}
						max={1.5}
					/>
					<ConfigSlider
						label="Expanded"
						value={config.sphereExpandedRadius}
						onChange={(v) => updateConfig('sphereExpandedRadius', v)}
						min={1}
						max={4}
					/>
				</Section>

				{/* Export */}
				<Section title="Export" defaultOpen={false}>
					<Button
						onClick={exportConfig}
						variant="ghost"
						className="w-full text-xs gap-2"
					>
						<Copy className="h-3 w-3" />
						Copy Config to Clipboard
					</Button>
				</Section>
			</div>
		</div>
	);
}
