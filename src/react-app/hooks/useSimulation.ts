import { useCallback, useEffect, useRef, useState } from 'react';
import { EMPTY_MOODS } from '../../shared/constants';
import {
	getSimulationEngine,
	type PopulationSnapshot,
	resetSimulationEngine,
	type SimulationEngine,
} from '../lib/simulation';
import {
	DEFAULT_SIMULATION_CONFIG,
	type SimulationConfig,
} from '../lib/simulationConfig';

/**
 * Hook result interface
 */
export interface UseSimulationResult {
	/** Current population snapshot */
	snapshot: PopulationSnapshot;
	/** Whether simulation is running */
	isRunning: boolean;
	/** Start the simulation */
	start: () => void;
	/** Stop the simulation */
	stop: () => void;
	/** Reset the simulation (clears all users) */
	reset: () => void;
	/** Update simulation config */
	updateConfig: (config: Partial<SimulationConfig>) => void;
	/** Current config */
	config: SimulationConfig;
}

/**
 * Empty snapshot for initial state
 */
const EMPTY_SNAPSHOT: PopulationSnapshot = {
	count: 0,
	users: [],
	moods: { ...EMPTY_MOODS },
	timestamp: Date.now(),
};

/**
 * React hook for the population simulation engine
 *
 * Provides:
 * - Current population snapshot with mood breakdown
 * - Controls to start/stop/reset simulation
 * - Config updates that take effect immediately
 *
 * @example
 * ```tsx
 * const { snapshot, isRunning, start, stop } = useSimulation({
 *   enabled: true,
 *   targetPopulation: 100,
 * });
 *
 * // snapshot.count - current user count
 * // snapshot.moods - breakdown by mood
 * // snapshot.users - full user list
 * ```
 */
export function useSimulation(
	initialConfig: Partial<SimulationConfig> = {},
): UseSimulationResult {
	const config = { ...DEFAULT_SIMULATION_CONFIG, ...initialConfig };
	const configRef = useRef(config);
	configRef.current = config;

	const [snapshot, setSnapshot] = useState<PopulationSnapshot>(EMPTY_SNAPSHOT);
	const [isRunning, setIsRunning] = useState(false);
	const engineRef = useRef<SimulationEngine | null>(null);

	// Initialize engine on mount
	useEffect(() => {
		const engine = getSimulationEngine(configRef.current);
		engineRef.current = engine;

		// Subscribe to updates
		const unsubscribe = engine.subscribe((newSnapshot) => {
			setSnapshot(newSnapshot);
		});

		// Auto-start if enabled
		if (configRef.current.enabled) {
			engine.start();
			setIsRunning(true);
		}

		return () => {
			unsubscribe();
			engine.stop();
		};
	}, []);

	// Sync running state with engine whenever snapshot updates
	// Only update state if running status actually changed (avoids unnecessary re-renders)
	// biome-ignore lint/correctness/useExhaustiveDependencies: snapshot triggers re-sync intentionally
	useEffect(() => {
		if (engineRef.current) {
			const engineRunning = engineRef.current.running;
			setIsRunning((prev) => (prev !== engineRunning ? engineRunning : prev));
		}
	}, [snapshot]);

	const start = useCallback(() => {
		if (engineRef.current) {
			engineRef.current.start();
			setIsRunning(true);
		}
	}, []);

	const stop = useCallback(() => {
		if (engineRef.current) {
			engineRef.current.stop();
			setIsRunning(false);
		}
	}, []);

	const reset = useCallback(() => {
		if (engineRef.current) {
			engineRef.current.reset();
			setIsRunning(false);
			setSnapshot(EMPTY_SNAPSHOT);
		}
	}, []);

	const updateConfig = useCallback((updates: Partial<SimulationConfig>) => {
		configRef.current = { ...configRef.current, ...updates };
		if (engineRef.current) {
			engineRef.current.updateConfig(updates);
			setIsRunning(engineRef.current.running);
		}
	}, []);

	return {
		snapshot,
		isRunning,
		start,
		stop,
		reset,
		updateConfig,
		config: configRef.current,
	};
}

/**
 * Reset the global simulation engine
 * Call when unmounting the app or switching modes
 */
export function useSimulationCleanup(): () => void {
	return resetSimulationEngine;
}
