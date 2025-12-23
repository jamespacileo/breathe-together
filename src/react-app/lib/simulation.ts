import PoissonProcess from 'poisson-process';
import type { MoodId, SimulationConfig } from './simulationConfig';
import {
	generateUser,
	type SimulatedUser,
	shouldDepart,
} from './userGenerator';

/**
 * Snapshot of current population state
 */
export interface PopulationSnapshot {
	count: number;
	users: SimulatedUser[];
	moods: Record<MoodId, number>;
	timestamp: number;
}

/**
 * Callback type for population updates
 */
export type PopulationUpdateCallback = (snapshot: PopulationSnapshot) => void;

/**
 * Simulation Engine
 *
 * Implements an M/M/∞ queueing model where:
 * - Users arrive according to a Poisson process
 * - Each user stays for an exponentially distributed duration
 * - At equilibrium, population = arrival_rate × mean_stay_duration
 */
export class SimulationEngine {
	private users: Map<string, SimulatedUser> = new Map();
	private config: SimulationConfig;
	private arrivalProcess: ReturnType<typeof PoissonProcess.create> | null =
		null;
	private updateInterval: ReturnType<typeof setInterval> | null = null;
	private callbacks: Set<PopulationUpdateCallback> = new Set();
	private isRunning = false;

	constructor(config: SimulationConfig) {
		this.config = config;
	}

	/**
	 * Start the simulation
	 */
	start(): void {
		if (this.isRunning) return;
		this.isRunning = true;

		// Calculate arrival rate to achieve target equilibrium
		// At equilibrium: N = λ × μ, so λ = N / μ
		const arrivalRate =
			this.config.targetPopulation / this.config.meanStayDuration;
		const meanInterArrival = 1 / arrivalRate; // Average ms between arrivals

		// Scale by timeScale for faster testing
		const scaledInterArrival = meanInterArrival / this.config.timeScale;

		// Create Poisson arrival process
		this.arrivalProcess = PoissonProcess.create(scaledInterArrival, () => {
			this.addUser();
		});

		this.arrivalProcess.start();

		// Start update loop to check departures and emit snapshots
		this.updateInterval = setInterval(() => {
			this.tick();
		}, this.config.updateInterval);

		// Bootstrap initial population (warm start)
		this.bootstrapPopulation();
	}

	/**
	 * Stop the simulation
	 */
	stop(): void {
		if (!this.isRunning) return;
		this.isRunning = false;

		if (this.arrivalProcess) {
			this.arrivalProcess.stop();
			this.arrivalProcess = null;
		}

		if (this.updateInterval) {
			clearInterval(this.updateInterval);
			this.updateInterval = null;
		}
	}

	/**
	 * Reset the simulation (clears all users)
	 */
	reset(): void {
		this.stop();
		this.users.clear();
		this.emitSnapshot();
	}

	/**
	 * Update configuration (requires restart to take effect)
	 */
	updateConfig(config: Partial<SimulationConfig>): void {
		this.config = { ...this.config, ...config };

		// Restart if running to apply new config
		if (this.isRunning) {
			this.stop();
			this.start();
		}
	}

	/**
	 * Subscribe to population updates
	 */
	subscribe(callback: PopulationUpdateCallback): () => void {
		this.callbacks.add(callback);

		// Immediately emit current state
		callback(this.getSnapshot());

		// Return unsubscribe function
		return () => {
			this.callbacks.delete(callback);
		};
	}

	/**
	 * Get current population snapshot
	 */
	getSnapshot(): PopulationSnapshot {
		const users = Array.from(this.users.values());

		// Count users per mood
		const moods: Record<MoodId, number> = {
			moment: 0,
			anxious: 0,
			processing: 0,
			preparing: 0,
			grateful: 0,
			celebrating: 0,
			here: 0,
		};

		for (const user of users) {
			moods[user.mood]++;
		}

		return {
			count: users.length,
			users,
			moods,
			timestamp: Date.now(),
		};
	}

	/**
	 * Bootstrap initial population for warm start
	 * Start with full target population so users see expected count immediately
	 */
	private bootstrapPopulation(): void {
		// Start with full target population (e.g., 50 users)
		const initialCount = this.config.targetPopulation;

		for (let i = 0; i < initialCount; i++) {
			this.addUser();
		}

		this.emitSnapshot();
	}

	/**
	 * Add a new user to the simulation
	 */
	private addUser(): void {
		const user = generateUser(
			this.config.moodDistribution,
			this.config.meanStayDuration,
			this.config.timeScale,
		);

		this.users.set(user.id, user);
	}

	/**
	 * Simulation tick - check departures and emit updates
	 */
	private tick(): void {
		// Check for departures
		const toRemove: string[] = [];

		for (const [id, user] of this.users) {
			if (shouldDepart(user)) {
				toRemove.push(id);
			}
		}

		// Remove departed users
		for (const id of toRemove) {
			this.users.delete(id);
		}

		// Emit updated snapshot
		this.emitSnapshot();
	}

	/**
	 * Emit snapshot to all subscribers
	 */
	private emitSnapshot(): void {
		const snapshot = this.getSnapshot();
		for (const callback of this.callbacks) {
			callback(snapshot);
		}
	}

	/**
	 * Check if simulation is running
	 */
	get running(): boolean {
		return this.isRunning;
	}

	/**
	 * Get current user count
	 */
	get userCount(): number {
		return this.users.size;
	}
}

/**
 * Create a singleton simulation engine
 */
let engineInstance: SimulationEngine | null = null;

export function getSimulationEngine(
	config: SimulationConfig,
): SimulationEngine {
	if (!engineInstance) {
		engineInstance = new SimulationEngine(config);
	}
	return engineInstance;
}

export function resetSimulationEngine(): void {
	if (engineInstance) {
		engineInstance.reset();
		engineInstance = null;
	}
}
