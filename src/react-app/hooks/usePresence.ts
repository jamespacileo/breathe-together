import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import type { PopulationSnapshot } from '../lib/simulation';
import type { MoodId } from '../lib/simulationConfig';
import type { SimulatedUser } from '../lib/userGenerator';

export interface PresenceData {
	count: number;
	moods: Record<MoodId, number>; // mood id -> count
	users?: SimulatedUser[]; // Full user list (when simulated)
}

export interface UsePresenceOptions {
	pollInterval?: number; // ms between polls
	simulated?: boolean; // Use simulated data (for development)
	simulationSnapshot?: PopulationSnapshot; // Pass snapshot from useSimulation
}

async function fetchPresence(): Promise<PresenceData> {
	const response = await fetch('/api/presence');
	if (!response.ok) {
		throw new Error('Failed to fetch presence');
	}
	const data = await response.json();
	// Ensure moods object exists
	return {
		count: data.count ?? 0,
		moods: data.moods ?? {
			moment: 0,
			anxious: 0,
			processing: 0,
			preparing: 0,
			grateful: 0,
			celebrating: 0,
			here: 0,
		},
	};
}

const EMPTY_MOODS: Record<MoodId, number> = {
	moment: 0,
	anxious: 0,
	processing: 0,
	preparing: 0,
	grateful: 0,
	celebrating: 0,
	here: 0,
};

/**
 * Hook for tracking global presence
 *
 * In simulated mode: Uses the snapshot from useSimulation (passed as prop)
 * In production mode: Uses TanStack Query to fetch from the Worker API
 */
export function usePresence(options: UsePresenceOptions = {}): PresenceData {
	const { pollInterval = 5000, simulated = true, simulationSnapshot } = options;

	// Use TanStack Query for real API when not simulated
	const { data } = useQuery({
		queryKey: ['presence'],
		queryFn: fetchPresence,
		refetchInterval: pollInterval,
		enabled: !simulated,
	});

	if (simulated && simulationSnapshot) {
		return {
			count: simulationSnapshot.count,
			moods: simulationSnapshot.moods,
			users: simulationSnapshot.users,
		};
	}

	return data ?? { count: 0, moods: EMPTY_MOODS };
}

async function sendHeartbeat(sessionId: string, mood?: string): Promise<void> {
	const response = await fetch('/api/heartbeat', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ sessionId, mood }),
	});
	if (!response.ok) {
		throw new Error('Failed to send heartbeat');
	}
}

/**
 * Hook for managing the current user's presence using TanStack Query
 * Automatically sends heartbeats and invalidates presence cache
 */
export function useHeartbeat(sessionId: string | null, mood?: string) {
	const queryClient = useQueryClient();
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const { mutate } = useMutation({
		mutationFn: () => sendHeartbeat(sessionId!, mood),
		onSuccess: () => {
			// Invalidate presence data after successful heartbeat
			queryClient.invalidateQueries({ queryKey: ['presence'] });
		},
	});

	useEffect(() => {
		if (!sessionId) return;

		// Send initial heartbeat
		mutate();

		// Set up interval for recurring heartbeats
		intervalRef.current = setInterval(() => {
			mutate();
		}, 30000); // Every 30s

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [sessionId, mood, mutate]);
}
