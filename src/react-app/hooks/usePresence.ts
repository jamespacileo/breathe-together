import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import type { PopulationSnapshot } from '../lib/simulation';
import type { MoodId } from '../lib/simulationConfig';
import type { SimulatedUser } from '../lib/userGenerator';

export interface PresenceData {
	count: number;
	moods: Record<MoodId, number>; // mood id -> count
	users?: SimulatedUser[]; // Full user list (when simulated)
	isLoading?: boolean;
	isError?: boolean;
	error?: Error | null;
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
 *
 * Returns error and loading states for UI feedback
 */
export function usePresence(options: UsePresenceOptions = {}): PresenceData {
	const { pollInterval = 5000, simulated = true, simulationSnapshot } = options;

	// Use TanStack Query for real API when not simulated
	const { data, isLoading, isError, error } = useQuery({
		queryKey: ['presence'],
		queryFn: fetchPresence,
		refetchInterval: pollInterval,
		enabled: !simulated,
		retry: 3, // Retry failed requests 3 times
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
	});

	if (simulated && simulationSnapshot) {
		return {
			count: simulationSnapshot.count,
			moods: simulationSnapshot.moods,
			users: simulationSnapshot.users,
			isLoading: false,
			isError: false,
			error: null,
		};
	}

	return {
		count: data?.count ?? 0,
		moods: data?.moods ?? EMPTY_MOODS,
		isLoading,
		isError,
		error: error instanceof Error ? error : null,
	};
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

export interface HeartbeatState {
	isError: boolean;
	consecutiveFailures: number;
}

/**
 * Hook for managing the current user's presence using TanStack Query
 * Automatically sends heartbeats and invalidates presence cache
 *
 * Features:
 * - Exponential backoff on failures
 * - Tracks consecutive failures for UI feedback
 * - Automatically recovers when connection is restored
 */
export function useHeartbeat(
	sessionId: string | null,
	mood?: string,
): HeartbeatState {
	const queryClient = useQueryClient();
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const consecutiveFailuresRef = useRef(0);
	const isErrorRef = useRef(false);

	const { mutate } = useMutation({
		mutationFn: (params: { sid: string; m?: string }) =>
			sendHeartbeat(params.sid, params.m),
		onSuccess: () => {
			// Reset failure count on success
			consecutiveFailuresRef.current = 0;
			isErrorRef.current = false;
			// Invalidate presence data after successful heartbeat
			queryClient.invalidateQueries({ queryKey: ['presence'] });
		},
		onError: (error) => {
			consecutiveFailuresRef.current += 1;
			isErrorRef.current = true;
			console.warn(
				`Heartbeat failed (attempt ${consecutiveFailuresRef.current}):`,
				error instanceof Error ? error.message : 'Unknown error',
			);
		},
		retry: 2, // Retry failed heartbeats twice
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
	});

	useEffect(() => {
		if (!sessionId) return;

		// Capture current values for the effect
		const currentSessionId = sessionId;
		const currentMood = mood;

		// Send initial heartbeat
		mutate({ sid: currentSessionId, m: currentMood });

		// Set up interval for recurring heartbeats
		// Use longer interval after failures to reduce server load
		const getInterval = () => {
			const baseInterval = 30000; // 30s
			const backoffMultiplier = Math.min(consecutiveFailuresRef.current, 4);
			return baseInterval * (1 + backoffMultiplier * 0.5); // Max 90s interval
		};

		const scheduleNextHeartbeat = () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
			intervalRef.current = setInterval(() => {
				mutate({ sid: currentSessionId, m: currentMood });
			}, getInterval());
		};

		scheduleNextHeartbeat();

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [sessionId, mood, mutate]);

	return {
		isError: isErrorRef.current,
		consecutiveFailures: consecutiveFailuresRef.current,
	};
}
