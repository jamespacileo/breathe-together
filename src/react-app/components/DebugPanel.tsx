import {
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
import { Button } from './ui/button';
import { IconButton } from './ui/icon-button';
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
		<div className="mb-3">
			<div className="flex justify-between text-xs mb-1.5">
				<span className="text-white/70">{label}</span>
				<span className="font-mono text-white/90">
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
				aria-label="Open debug panel"
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

			<div className="p-3 space-y-4">
				{/* Live State */}
				<section>
					<Label className="text-xs uppercase tracking-wide text-white/50 mb-2 block">
						Live State
					</Label>
					<div className="text-xs font-mono bg-white/5 rounded p-2">
						<div>Phase: {breathState.phase}</div>
						<div>Progress: {(breathState.progress * 100).toFixed(1)}%</div>
						<div>Presence: {presence.count}</div>
					</div>
					{presence.moods &&
						Object.values(presence.moods).some((v) => v > 0) && (
							<div className="mt-2">
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
				</section>

				{/* Simulation Controls */}
				{simulationControls != null && (
					<section>
						<Label className="text-xs uppercase tracking-wide text-white/50 mb-2 block">
							Simulation
						</Label>
						<div className="mb-3 flex gap-2">
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
							label="Time Scale"
							value={simulationControls.simulationConfig.timeScale}
							onChange={(v) =>
								simulationControls.updateSimulationConfig({ timeScale: v })
							}
							min={1}
							max={50}
							step={1}
						/>
					</section>
				)}

				{/* Particle Sphere */}
				<section>
					<Label className="text-xs uppercase tracking-wide text-white/50 mb-2 block">
						Particle Sphere
					</Label>
					<ConfigSlider
						label="Contracted Size"
						value={config.sphereContractedRadius}
						onChange={(v) => updateConfig('sphereContractedRadius', v)}
						min={0.3}
						max={1.5}
					/>
					<ConfigSlider
						label="Expanded Size"
						value={config.sphereExpandedRadius}
						onChange={(v) => updateConfig('sphereExpandedRadius', v)}
						min={1}
						max={4}
					/>
				</section>

				{/* Export */}
				<section>
					<Button
						onClick={exportConfig}
						variant="outline"
						className="w-full text-xs gap-2"
					>
						<Copy className="h-3 w-3" />
						Copy Config
					</Button>
				</section>
			</div>
		</div>
	);
}
