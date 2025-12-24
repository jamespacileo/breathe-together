import { button, Leva, useControls } from 'leva';
import { Settings } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { BreathState } from '../hooks/useBreathSync';
import type { PresenceData } from '../hooks/usePresence';
import { DEFAULT_CONFIG, type VisualizationConfig } from '../lib/config';
import type { SimulationConfig } from '../lib/simulationConfig';
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

export function DebugPanel({
	config,
	setConfig,
	breathState,
	presence,
	isOpen,
	setIsOpen,
}: DebugPanelProps) {
	const configRef = useRef(config);
	configRef.current = config;

	// Particle appearance controls
	const [particleValues, setParticle] = useControls(
		'Particles',
		() => ({
			brightness: {
				value: config.particleBrightness,
				min: 0.1,
				max: 1.5,
				step: 0.05,
			},
			size: {
				value: config.particleSize,
				min: 0.3,
				max: 3,
				step: 0.1,
			},
		}),
		[],
	);

	// Sphere size controls
	const [sphereValues, setSphere] = useControls(
		'Sphere',
		() => ({
			contracted: {
				value: config.sphereContractedRadius,
				min: 0.3,
				max: 2,
				step: 0.1,
			},
			expanded: {
				value: config.sphereExpandedRadius,
				min: 1,
				max: 5,
				step: 0.1,
			},
		}),
		[],
	);

	// Animation feel controls
	const [animValues, setAnim] = useControls(
		'Animation',
		() => ({
			noise: {
				value: config.noiseStrength,
				min: 0,
				max: 1,
				step: 0.05,
			},
			rotation: {
				value: config.rotationSpeed * 1000,
				min: 0,
				max: 10,
				step: 0.5,
				label: 'Rotation ×1000',
			},
		}),
		[],
	);

	// Color controls
	const [colorValues, setColors] = useControls(
		'Colors',
		() => ({
			primary: config.primaryColor,
			background: config.backgroundColor,
		}),
		[],
	);

	// Live stats (read-only display)
	useControls(
		'Stats',
		{
			phase: { value: breathState.phase, editable: false },
			progress: {
				value: `${(breathState.progress * 100).toFixed(0)}%`,
				editable: false,
			},
			users: { value: presence.count, editable: false },
		},
		[breathState.phase, breathState.progress, presence.count],
	);

	// Actions
	useControls('Actions', {
		'Reset Defaults': button(() => {
			setConfig(DEFAULT_CONFIG);
			setParticle({
				brightness: DEFAULT_CONFIG.particleBrightness,
				size: DEFAULT_CONFIG.particleSize,
			});
			setSphere({
				contracted: DEFAULT_CONFIG.sphereContractedRadius,
				expanded: DEFAULT_CONFIG.sphereExpandedRadius,
			});
			setAnim({
				noise: DEFAULT_CONFIG.noiseStrength,
				rotation: DEFAULT_CONFIG.rotationSpeed * 1000,
			});
			setColors({
				primary: DEFAULT_CONFIG.primaryColor,
				background: DEFAULT_CONFIG.backgroundColor,
			});
		}),
		'Copy Config': button(() => {
			navigator.clipboard.writeText(JSON.stringify(configRef.current, null, 2));
		}),
	});

	// Sync Leva values to config
	useEffect(() => {
		const newConfig: VisualizationConfig = {
			particleBrightness: particleValues.brightness,
			particleSize: particleValues.size,
			sphereContractedRadius: sphereValues.contracted,
			sphereExpandedRadius: sphereValues.expanded,
			noiseStrength: animValues.noise,
			rotationSpeed: animValues.rotation / 1000,
			primaryColor: colorValues.primary,
			backgroundColor: colorValues.background,
		};

		if (JSON.stringify(newConfig) !== JSON.stringify(configRef.current)) {
			setConfig(newConfig);
		}
	}, [particleValues, sphereValues, animValues, colorValues, setConfig]);

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
		<>
			<IconButton
				onClick={() => setIsOpen(false)}
				aria-label="Close debug panel"
				className="bg-black/50 backdrop-blur-md hover:bg-black/70 border border-white/20"
			>
				<Settings className="h-5 w-5" />
			</IconButton>
			<Leva
				collapsed={false}
				oneLineLabels
				flat
				titleBar={{ title: 'Debug', drag: true, filter: false }}
				theme={{
					sizes: {
						rootWidth: '260px',
						controlWidth: '100px',
					},
					colors: {
						elevation1: 'rgba(0, 0, 0, 0.9)',
						elevation2: 'rgba(15, 15, 20, 0.95)',
						elevation3: 'rgba(25, 25, 35, 0.95)',
						accent1: '#7EB5C1',
						accent2: '#5a9aa8',
						accent3: '#4a8a98',
						highlight1: 'rgba(255, 255, 255, 0.08)',
						highlight2: 'rgba(255, 255, 255, 0.12)',
						highlight3: 'rgba(255, 255, 255, 0.16)',
						folderWidgetColor: '#7EB5C1',
						folderTextColor: 'rgba(255, 255, 255, 0.8)',
						toolTipBackground: 'rgba(0, 0, 0, 0.9)',
						toolTipText: 'rgba(255, 255, 255, 0.9)',
					},
					fontSizes: {
						root: '11px',
					},
				}}
			/>
		</>
	);
}
