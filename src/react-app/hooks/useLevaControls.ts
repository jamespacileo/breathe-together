import { button, folder, useControls } from 'leva';
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

/** Helper to create a numeric config control with onChange */
function numericControl(
	config: VisualizationConfig,
	setConfig: (c: VisualizationConfig) => void,
	key: keyof VisualizationConfig,
	opts: { min?: number; max?: number; step?: number } = {},
) {
	return {
		value: config[key] as number,
		...opts,
		onChange: (v: number) => setConfig({ ...config, [key]: v }),
	};
}

/** Helper to create a string config control with onChange */
function stringControl(
	config: VisualizationConfig,
	setConfig: (c: VisualizationConfig) => void,
	key: keyof VisualizationConfig,
) {
	return {
		value: config[key] as string,
		onChange: (v: string) => setConfig({ ...config, [key]: v }),
	};
}

export function useLevaControls({
	config,
	setConfig,
	breathState,
	presence,
	simulationControls,
}: UseLevaControlsOptions) {
	const { simulationConfig, updateSimulationConfig, isSimulationRunning, onStart, onStop, onReset } = simulationControls;
	const n = (key: keyof VisualizationConfig, opts: { min?: number; max?: number; step?: number } = {}) =>
		numericControl(config, setConfig, key, opts);
	const s = (key: keyof VisualizationConfig) => stringControl(config, setConfig, key);

	// Live State (read-only)
	useControls('Live State', {
		phase: { value: breathState.phase, editable: false },
		progress: { value: `${Math.round(breathState.progress * 100)}%`, editable: false },
		activeUsers: { value: presence.count, editable: false },
		simulating: { value: isSimulationRunning ? '▶ Running' : '⏹ Stopped', editable: false },
	}, [breathState.phase, breathState.progress, presence.count, isSimulationRunning]);

	// Simulation Controls
	useControls('Simulation', {
		targetPopulation: { value: simulationConfig.targetPopulation, min: 1, max: 200, step: 1, onChange: (v: number) => updateSimulationConfig({ targetPopulation: v }) },
		Start: button(onStart),
		Stop: button(onStop),
		Reset: button(onReset),
	});

	// Visualization Config
	useControls('Visualization', {
		'Breathing Animation': folder({
			breatheInScale: n('breatheInScale', { min: 0.3, max: 1, step: 0.01 }),
			breatheOutScale: n('breatheOutScale', { min: 1, max: 2, step: 0.01 }),
			holdOscillation: n('holdOscillation', { min: 0, max: 0.1, step: 0.001 }),
			holdOscillationSpeed: n('holdOscillationSpeed', { min: 0.0001, max: 0.01, step: 0.0001 }),
		}),
		'Spring Physics': folder({
			mainSpringTension: n('mainSpringTension', { min: 20, max: 200, step: 1 }),
			mainSpringFriction: n('mainSpringFriction', { min: 5, max: 40, step: 0.5 }),
		}),
		'3D Sphere': folder({
			sphereContractedRadius: n('sphereContractedRadius', { min: 0.3, max: 1.5, step: 0.01 }),
			sphereExpandedRadius: n('sphereExpandedRadius', { min: 1, max: 4, step: 0.1 }),
		}),
		Particles: folder({
			particleDensity: n('particleDensity', { min: 32, max: 80, step: 1 }),
			peripheralParticleCount: n('peripheralParticleCount', { min: 20, max: 120, step: 1 }),
		}),
		Rendering: folder({
			canvasBackground: s('canvasBackground'),
			vignetteIntensity: n('vignetteIntensity', { min: 0, max: 1, step: 0.01 }),
			noiseOpacity: n('noiseOpacity', { min: 0, max: 0.3, step: 0.01 }),
		}),
		Colors: folder({
			primaryColor: s('primaryColor'),
			backgroundColor: s('backgroundColor'),
			backgroundColorMid: s('backgroundColorMid'),
		}),
	});

	// Actions
	useControls('Actions', {
		'Reset to Defaults': button(() => setConfig(DEFAULT_CONFIG)),
		'Copy Config': button(() => navigator.clipboard.writeText(JSON.stringify(config, null, 2))),
	});
}
