import { Leva } from 'leva';
import type { BreathState } from '../hooks/useBreathSync';
import { useLevaControls } from '../hooks/useLevaControls';
import type { PresenceData } from '../hooks/usePresence';
import type { VisualizationConfig } from '../lib/config';
import type { SimulationConfig } from '../lib/simulationConfig';

interface LevaControlsProps {
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

/**
 * Leva settings controls component.
 * Always visible floating panel for visualization configuration.
 */
export function LevaControls(props: LevaControlsProps) {
	useLevaControls(props);

	return <Leva collapsed={true} />;
}
