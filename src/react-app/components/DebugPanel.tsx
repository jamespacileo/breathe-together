import { button, Leva, useControls } from 'leva';
import { Play, RefreshCw, Settings, Square } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { BreathState } from '../hooks/useBreathSync';
import type { PresenceData } from '../hooks/usePresence';
import { getMoodColor, MOODS } from '../lib/colors';
import { DEFAULT_CONFIG, type VisualizationConfig } from '../lib/config';
import { MOOD_IDS, type SimulationConfig } from '../lib/simulationConfig';
import { IconButton } from './ui/icon-button';

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

/**
 * Live state monitor component - displays breath and presence state
 */
function LiveStateMonitor({
	breathState,
	presence,
}: {
	breathState: BreathState;
	presence: PresenceData;
}) {
	return (
		<div className="text-xs font-mono bg-white/5 rounded p-3 mb-3 border border-white/10">
			<div className="text-white/90 font-medium mb-2">Live State</div>
			<div className="text-white/70 space-y-1">
				<div>
					Phase: <span className="text-white">{breathState.phase}</span>
				</div>
				<div>
					Progress:{' '}
					<span className="text-white">
						{(breathState.progress * 100).toFixed(1)}%
					</span>
				</div>
				<div>
					Presence: <span className="text-white">{presence.count}</span>
				</div>
			</div>
			{presence.moods && Object.values(presence.moods).some((v) => v > 0) && (
				<div className="mt-3 pt-2 border-t border-white/10">
					<div className="text-white/60 text-[10px] mb-1.5">Mood Breakdown</div>
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
									<span className="font-mono text-white">{count}</span>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}

/**
 * Simulation controls component
 */
function SimulationPanel({ controls }: { controls: SimulationControlsProps }) {
	// Leva controls for simulation config
	useControls(
		'Simulation',
		() => ({
			'Target Population': {
				value: controls.simulationConfig.targetPopulation,
				min: 1,
				max: 200,
				step: 1,
				onChange: (v: number) =>
					controls.updateSimulationConfig({ targetPopulation: Math.round(v) }),
			},
			'Stay Duration (sec)': {
				value: controls.simulationConfig.meanStayDuration / 1000,
				min: 10,
				max: 600,
				step: 10,
				onChange: (v: number) =>
					controls.updateSimulationConfig({ meanStayDuration: v * 1000 }),
			},
			'Time Scale': {
				value: controls.simulationConfig.timeScale,
				min: 1,
				max: 50,
				step: 1,
				onChange: (v: number) =>
					controls.updateSimulationConfig({ timeScale: v }),
			},
		}),
		{ collapsed: false },
		[controls.simulationConfig],
	);

	return (
		<div className="mb-3 flex gap-2">
			{controls.isSimulationRunning ? (
				<button
					type="button"
					onClick={controls.onStop}
					className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 text-white transition-colors"
				>
					<Square className="h-4 w-4" />
					Stop
				</button>
			) : (
				<button
					type="button"
					onClick={controls.onStart}
					className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium bg-green-500/20 border border-green-500/40 hover:bg-green-500/30 text-white transition-colors"
				>
					<Play className="h-4 w-4" />
					Start
				</button>
			)}
			<button
				type="button"
				onClick={controls.onReset}
				className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium bg-white/10 border border-white/20 hover:bg-white/20 text-white transition-colors"
			>
				<RefreshCw className="h-4 w-4" />
				Reset
			</button>
		</div>
	);
}

/**
 * Main Leva controls hook - manages visualization config
 * Pruned to essential controls only
 */
function useVisualizationControls(
	config: VisualizationConfig,
	setConfig: (newConfig: VisualizationConfig) => void,
) {
	const configRef = useRef(config);
	const isInternalUpdate = useRef(false);

	// Update ref when config changes externally
	useEffect(() => {
		configRef.current = config;
	}, [config]);

	// Helper to update config
	const updateConfig = <K extends keyof VisualizationConfig>(
		key: K,
		value: VisualizationConfig[K],
	) => {
		if (!isInternalUpdate.current) {
			isInternalUpdate.current = true;
			setConfig({ ...configRef.current, [key]: value });
			configRef.current = { ...configRef.current, [key]: value };
			setTimeout(() => {
				isInternalUpdate.current = false;
			}, 0);
		}
	};

	// Sphere controls - the most commonly tweaked settings
	useControls(
		'Sphere',
		() => ({
			'Contracted Radius': {
				value: config.sphereContractedRadius,
				min: 0.3,
				max: 1.5,
				step: 0.01,
				onChange: (v: number) => updateConfig('sphereContractedRadius', v),
			},
			'Expanded Radius': {
				value: config.sphereExpandedRadius,
				min: 1,
				max: 4,
				step: 0.01,
				onChange: (v: number) => updateConfig('sphereExpandedRadius', v),
			},
			'Rotation Speed': {
				value: config.sphereRotationSpeed,
				min: 0,
				max: 0.1,
				step: 0.005,
				onChange: (v: number) => updateConfig('sphereRotationSpeed', v),
			},
		}),
		{ collapsed: true },
		[
			config.sphereContractedRadius,
			config.sphereExpandedRadius,
			config.sphereRotationSpeed,
		],
	);

	// Visual effects - consolidated
	useControls(
		'Effects',
		() => ({
			Connections: {
				value: config.connectionEnabled,
				onChange: (v: boolean) => updateConfig('connectionEnabled', v),
			},
			'Connection Opacity': {
				value: config.connectionOpacity,
				min: 0,
				max: 0.5,
				step: 0.01,
				onChange: (v: number) => updateConfig('connectionOpacity', v),
			},
			Haze: {
				value: config.hazeEnabled,
				onChange: (v: boolean) => updateConfig('hazeEnabled', v),
			},
			Bloom: {
				value: config.bloomEnabled,
				onChange: (v: boolean) => updateConfig('bloomEnabled', v),
			},
			'Bloom Strength': {
				value: config.bloomStrength,
				min: 0,
				max: 3,
				step: 0.01,
				onChange: (v: number) => updateConfig('bloomStrength', v),
			},
		}),
		{ collapsed: true },
		[
			config.connectionEnabled,
			config.connectionOpacity,
			config.hazeEnabled,
			config.bloomEnabled,
			config.bloomStrength,
		],
	);

	// Spring Physics - essential for animation feel
	useControls(
		'Physics',
		() => ({
			Tension: {
				value: config.mainSpringTension,
				min: 20,
				max: 200,
				step: 5,
				onChange: (v: number) => updateConfig('mainSpringTension', v),
			},
			Friction: {
				value: config.mainSpringFriction,
				min: 5,
				max: 50,
				step: 1,
				onChange: (v: number) => updateConfig('mainSpringFriction', v),
			},
		}),
		{ collapsed: true },
		[config.mainSpringTension, config.mainSpringFriction],
	);

	// Actions
	useControls('Actions', {
		'Copy Config': button(() => {
			navigator.clipboard.writeText(JSON.stringify(config, null, 2));
		}),
		'Reset to Defaults': button(() => {
			setConfig({ ...DEFAULT_CONFIG });
		}),
	});
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
	// Initialize leva controls
	useVisualizationControls(config, setConfig);

	if (!isOpen) {
		return (
			<>
				<Leva hidden />
				<IconButton
					onClick={() => setIsOpen(true)}
					aria-label="Open settings"
					className="bg-black/50 backdrop-blur-md hover:bg-black/70 border border-white/20"
				>
					<Settings className="h-5 w-5" />
				</IconButton>
			</>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			{/* Custom panels above Leva */}
			<div className="w-[calc(100vw-1.5rem)] sm:w-80">
				<LiveStateMonitor breathState={breathState} presence={presence} />
				{simulationControls ? (
					<SimulationPanel controls={simulationControls} />
				) : null}
			</div>

			{/* Leva panel */}
			<Leva
				flat
				fill
				hideCopyButton
				titleBar={{
					title: 'Debug Panel',
					drag: false,
					filter: false,
				}}
				theme={{
					colors: {
						elevation1: 'rgba(0, 0, 0, 0.8)',
						elevation2: 'rgba(255, 255, 255, 0.05)',
						elevation3: 'rgba(255, 255, 255, 0.1)',
						accent1: '#7EB5C1',
						accent2: '#5a9aa8',
						accent3: '#4a8a98',
						highlight1: 'rgba(255, 255, 255, 0.9)',
						highlight2: 'rgba(255, 255, 255, 0.7)',
						highlight3: 'rgba(255, 255, 255, 0.5)',
						vivid1: '#7EB5C1',
						folderWidgetColor: 'rgba(255, 255, 255, 0.3)',
						folderTextColor: 'rgba(255, 255, 255, 0.7)',
						toolTipBackground: 'rgba(0, 0, 0, 0.9)',
						toolTipText: 'rgba(255, 255, 255, 0.9)',
					},
					radii: {
						xs: '4px',
						sm: '6px',
						lg: '8px',
					},
					space: {
						sm: '6px',
						md: '10px',
						rowGap: '6px',
						colGap: '6px',
					},
					fonts: {
						mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
						sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
					},
					fontSizes: {
						root: '12px',
						toolTip: '11px',
					},
					sizes: {
						rootWidth: 'calc(100vw - 1.5rem)',
						controlWidth: '160px',
						numberInputMinWidth: '56px',
						scrubberWidth: '8px',
						scrubberHeight: '16px',
						rowHeight: '28px',
						folderTitleHeight: '28px',
						checkboxSize: '16px',
						joystickWidth: '100px',
						joystickHeight: '100px',
						colorPickerWidth: '160px',
						colorPickerHeight: '100px',
						monitorHeight: '60px',
						titleBarHeight: '40px',
					},
					borderWidths: {
						root: '1px',
						input: '1px',
						focus: '2px',
						hover: '1px',
						active: '1px',
						folder: '1px',
					},
					fontWeights: {
						label: 'normal',
						folder: 'normal',
						button: '500',
					},
				}}
			/>

			{/* Close button */}
			<button
				type="button"
				onClick={() => setIsOpen(false)}
				className="w-full py-2 text-xs text-white/60 hover:text-white/90 hover:bg-white/5 rounded-md transition-colors"
			>
				Close Panel
			</button>
		</div>
	);
}
