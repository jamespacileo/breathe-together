import type { AvatarId, MoodId } from './config';

/**
 * Simulated user identity
 */
export interface SimulatedUser {
	id: string;
	name: string;
	avatar: AvatarId;
	mood: MoodId;
	moodDetail?: string;
	joinedAt: number;
	departureTime: number;
}

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
