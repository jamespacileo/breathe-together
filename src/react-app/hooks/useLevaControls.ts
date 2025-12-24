import { button, folder, useControls } from 'leva';
import { useEffect, useRef } from 'react';
import { DEFAULT_CONFIG, type VisualizationConfig } from '../lib/config';
import type { SimulationConfig } from '../lib/simulationConfig';
import type { BreathState } from './useBreathSync';
import type { PresenceData } from './usePresence';

interface UseLevaControlsOptions {
	config: VisualizationConfig;
	setConfig: (config: VisualizationConfig) => void;
	breathState: BreathState;
	presence: PresenceData;
	simulationControls: {
		simulationConfig: SimulationConfig;
		updateSimulationConfig: (updates: Partial<SimulationConfig>) => void;
		isSimulationRunning: boolean;
		onStart: () => void;
		onStop: () => void;
		onReset: () => void;
	};
}

export function useLevaControls({
	config,
	setConfig,
	breathState,
	presence,
	simulationControls,
}: UseLevaControlsOptions) {
	// Track the latest callbacks in refs to avoid stale closures
	const callbacksRef = useRef(simulationControls);
	const configRef = useRef(config);
	const setConfigRef = useRef(setConfig);

	useEffect(() => {
		callbacksRef.current = simulationControls;
		configRef.current = config;
		setConfigRef.current = setConfig;
	});

	// Live State (read-only monitoring)
	useControls(
		'Live State',
		{
			phase: {
				value: breathState.phase,
				editable: false,
			},
			progress: {
				value: `${Math.round(breathState.progress * 100)}%`,
				editable: false,
			},
			activeUsers: {
				value: presence.count,
				editable: false,
			},
			simulating: {
				value: simulationControls.isSimulationRunning
					? '▶ Running'
					: '⏹ Stopped',
				editable: false,
			},
		},
		[
			breathState.phase,
			breathState.progress,
			presence.count,
			simulationControls.isSimulationRunning,
		],
	);

	// Simulation Controls
	useControls('Simulation', () => ({
		targetPopulation: {
			value: simulationControls.simulationConfig.targetPopulation,
			min: 1,
			max: 200,
			step: 1,
			onChange: (v: number) => {
				callbacksRef.current.updateSimulationConfig({ targetPopulation: v });
			},
		},
		Start: button(() => callbacksRef.current.onStart()),
		Stop: button(() => callbacksRef.current.onStop()),
		Reset: button(() => callbacksRef.current.onReset()),
	}));

	// Visualization Config Controls with onChange handlers
	const [, setVisualization] = useControls('Visualization', () => ({
		'Breathing Animation': folder({
			breatheInScale: {
				value: config.breatheInScale,
				min: 0.3,
				max: 1,
				step: 0.01,
				onChange: (v: number) =>
					setConfigRef.current({ ...configRef.current, breatheInScale: v }),
			},
			breatheOutScale: {
				value: config.breatheOutScale,
				min: 1,
				max: 2,
				step: 0.01,
				onChange: (v: number) =>
					setConfigRef.current({ ...configRef.current, breatheOutScale: v }),
			},
			holdOscillation: {
				value: config.holdOscillation,
				min: 0,
				max: 0.1,
				step: 0.001,
				onChange: (v: number) =>
					setConfigRef.current({ ...configRef.current, holdOscillation: v }),
			},
			holdOscillationSpeed: {
				value: config.holdOscillationSpeed,
				min: 0.0001,
				max: 0.01,
				step: 0.0001,
				onChange: (v: number) =>
					setConfigRef.current({
						...configRef.current,
						holdOscillationSpeed: v,
					}),
			},
		}),
		'Spring Physics': folder({
			mainSpringTension: {
				value: config.mainSpringTension,
				min: 20,
				max: 200,
				step: 1,
				onChange: (v: number) =>
					setConfigRef.current({ ...configRef.current, mainSpringTension: v }),
			},
			mainSpringFriction: {
				value: config.mainSpringFriction,
				min: 5,
				max: 40,
				step: 0.5,
				onChange: (v: number) =>
					setConfigRef.current({ ...configRef.current, mainSpringFriction: v }),
			},
		}),
		'3D Sphere': folder({
			nebulaEnabled: {
				value: config.nebulaEnabled,
				onChange: (v: boolean) =>
					setConfigRef.current({ ...configRef.current, nebulaEnabled: v }),
			},
			sphereContractedRadius: {
				value: config.sphereContractedRadius,
				min: 0.3,
				max: 1.5,
				step: 0.01,
				onChange: (v: number) =>
					setConfigRef.current({
						...configRef.current,
						sphereContractedRadius: v,
					}),
			},
			sphereExpandedRadius: {
				value: config.sphereExpandedRadius,
				min: 1,
				max: 4,
				step: 0.1,
				onChange: (v: number) =>
					setConfigRef.current({
						...configRef.current,
						sphereExpandedRadius: v,
					}),
			},
			sphereRotationSpeed: {
				value: config.sphereRotationSpeed,
				min: 0,
				max: 0.1,
				step: 0.001,
				onChange: (v: number) =>
					setConfigRef.current({
						...configRef.current,
						sphereRotationSpeed: v,
					}),
			},
		}),
		'Connection Lines': folder({
			connectionEnabled: {
				value: config.connectionEnabled,
				onChange: (v: boolean) =>
					setConfigRef.current({ ...configRef.current, connectionEnabled: v }),
			},
			connectionDistance: {
				value: config.connectionDistance,
				min: 0.1,
				max: 1,
				step: 0.01,
				onChange: (v: number) =>
					setConfigRef.current({
						...configRef.current,
						connectionDistance: v,
					}),
			},
			connectionOpacity: {
				value: config.connectionOpacity,
				min: 0,
				max: 0.5,
				step: 0.01,
				onChange: (v: number) =>
					setConfigRef.current({ ...configRef.current, connectionOpacity: v }),
			},
		}),
		Effects: folder({
			hazeEnabled: {
				value: config.hazeEnabled,
				onChange: (v: boolean) =>
					setConfigRef.current({ ...configRef.current, hazeEnabled: v }),
			},
			hazeOpacity: {
				value: config.hazeOpacity,
				min: 0,
				max: 0.3,
				step: 0.01,
				onChange: (v: number) =>
					setConfigRef.current({ ...configRef.current, hazeOpacity: v }),
			},
			bloomEnabled: {
				value: config.bloomEnabled,
				onChange: (v: boolean) =>
					setConfigRef.current({ ...configRef.current, bloomEnabled: v }),
			},
			bloomStrength: {
				value: config.bloomStrength,
				min: 0,
				max: 3,
				step: 0.1,
				onChange: (v: number) =>
					setConfigRef.current({ ...configRef.current, bloomStrength: v }),
			},
			bloomThreshold: {
				value: config.bloomThreshold,
				min: 0,
				max: 1,
				step: 0.01,
				onChange: (v: number) =>
					setConfigRef.current({ ...configRef.current, bloomThreshold: v }),
			},
			bloomRadius: {
				value: config.bloomRadius,
				min: 0,
				max: 1,
				step: 0.01,
				onChange: (v: number) =>
					setConfigRef.current({ ...configRef.current, bloomRadius: v }),
			},
		}),
		Colors: folder({
			primaryColor: {
				value: config.primaryColor,
				onChange: (v: string) =>
					setConfigRef.current({ ...configRef.current, primaryColor: v }),
			},
			backgroundColor: {
				value: config.backgroundColor,
				onChange: (v: string) =>
					setConfigRef.current({ ...configRef.current, backgroundColor: v }),
			},
			backgroundColorMid: {
				value: config.backgroundColorMid,
				onChange: (v: string) =>
					setConfigRef.current({
						...configRef.current,
						backgroundColorMid: v,
					}),
			},
		}),
	}));

	// Sync external config changes to Leva (e.g., from localStorage persistence)
	// Note: Type cast required because Leva's folder types don't expose flat property keys
	const prevConfigRef = useRef(config);
	useEffect(() => {
		// Only sync if config actually changed from external source
		if (prevConfigRef.current !== config) {
			(setVisualization as (values: Record<string, unknown>) => void)({
				breatheInScale: config.breatheInScale,
				breatheOutScale: config.breatheOutScale,
				holdOscillation: config.holdOscillation,
				holdOscillationSpeed: config.holdOscillationSpeed,
				mainSpringTension: config.mainSpringTension,
				mainSpringFriction: config.mainSpringFriction,
				nebulaEnabled: config.nebulaEnabled,
				sphereContractedRadius: config.sphereContractedRadius,
				sphereExpandedRadius: config.sphereExpandedRadius,
				sphereRotationSpeed: config.sphereRotationSpeed,
				connectionEnabled: config.connectionEnabled,
				connectionDistance: config.connectionDistance,
				connectionOpacity: config.connectionOpacity,
				hazeEnabled: config.hazeEnabled,
				hazeOpacity: config.hazeOpacity,
				bloomEnabled: config.bloomEnabled,
				bloomStrength: config.bloomStrength,
				bloomThreshold: config.bloomThreshold,
				bloomRadius: config.bloomRadius,
				primaryColor: config.primaryColor,
				backgroundColor: config.backgroundColor,
				backgroundColorMid: config.backgroundColorMid,
			});
			prevConfigRef.current = config;
		}
	}, [config, setVisualization]);

	// Actions panel - Reset and Export
	useControls('Actions', {
		'Reset to Defaults': button(() => {
			setConfigRef.current(DEFAULT_CONFIG);
		}),
		'Copy Config': button(() => {
			navigator.clipboard.writeText(JSON.stringify(configRef.current, null, 2));
		}),
	});
}
