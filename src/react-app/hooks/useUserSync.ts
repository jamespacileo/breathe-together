/**
 * Hook for user sync with particle spawning
 * Syncs with Cloudflare backend for presence
 */

import { useEffect, useRef } from 'react';
import type { GPUParticleSystem } from '../core/particles/GPUParticleSystem';
import type { ColourIndex, UserSyncPayload } from '../core/types';

export interface UseUserSyncOptions {
	particleSystem: GPUParticleSystem | null;
	pollInterval?: number;
}

export interface UseUserSyncResult {
	userCount: number;
	isConnected: boolean;
}

/**
 * Apply user count diff to particle system
 */
function applyUserDiff(
	particleSystem: GPUParticleSystem,
	currentCounts: Record<number, number>,
	newPayload: UserSyncPayload,
): Record<number, number> {
	const newCounts = { ...currentCounts };

	for (const [colourIndexStr, count] of Object.entries(newPayload.colours)) {
		const colourIndex = Number(colourIndexStr) as ColourIndex;
		const current = currentCounts[colourIndex] ?? 0;
		const diff = count - current;

		if (diff > 0) {
			// Spawn new particles with spark effect
			particleSystem.spawnUserParticles(colourIndex, diff, true);
		} else if (diff < 0) {
			// Despawn particles
			particleSystem.despawnUserParticles(colourIndex, Math.abs(diff));
		}

		newCounts[colourIndex] = count;
	}

	return newCounts;
}

/**
 * Sync user presence with particle system
 */
export function useUserSync(options: UseUserSyncOptions): UseUserSyncResult {
	const { particleSystem, pollInterval = 5000 } = options;
	const currentCountsRef = useRef<Record<number, number>>({});
	const userCountRef = useRef(0);
	const isConnectedRef = useRef(false);

	useEffect(() => {
		if (!particleSystem) return;

		const fetchPresence = async () => {
			try {
				const response = await fetch('/api/presence');
				if (!response.ok) throw new Error('Failed to fetch presence');

				const data: UserSyncPayload = await response.json();

				// Apply diff
				currentCountsRef.current = applyUserDiff(
					particleSystem,
					currentCountsRef.current,
					data,
				);

				userCountRef.current = data.total;
				isConnectedRef.current = true;
			} catch (error) {
				console.error('Presence sync error:', error);
				isConnectedRef.current = false;
			}
		};

		// Initial fetch
		void fetchPresence();

		// Poll for updates
		const interval = setInterval(fetchPresence, pollInterval);

		return () => clearInterval(interval);
	}, [particleSystem, pollInterval]);

	return {
		userCount: userCountRef.current,
		isConnected: isConnectedRef.current,
	};
}
