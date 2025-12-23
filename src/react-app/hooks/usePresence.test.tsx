import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PopulationSnapshot } from '../lib/simulation';
import { usePresence } from './usePresence';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Create a wrapper with QueryClientProvider for each test
function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
			},
		},
	});

	return function Wrapper({ children }: { children: ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	};
}

describe('usePresence', () => {
	beforeEach(() => {
		mockFetch.mockReset();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should return empty data when simulated without snapshot', () => {
		const { result } = renderHook(
			() => usePresence({ simulated: true, simulationSnapshot: undefined }),
			{ wrapper: createWrapper() },
		);

		expect(result.current.count).toBe(0);
		expect(result.current.moods).toBeDefined();
		expect(result.current.isLoading).toBe(false);
		expect(result.current.isError).toBe(false);
	});

	it('should return simulation snapshot when in simulated mode', () => {
		const mockSnapshot: PopulationSnapshot = {
			count: 50,
			moods: {
				moment: 10,
				anxious: 5,
				processing: 15,
				preparing: 8,
				grateful: 7,
				celebrating: 3,
				here: 2,
			},
			users: [],
			timestamp: Date.now(),
		};

		const { result } = renderHook(
			() => usePresence({ simulated: true, simulationSnapshot: mockSnapshot }),
			{ wrapper: createWrapper() },
		);

		expect(result.current.count).toBe(50);
		expect(result.current.moods.moment).toBe(10);
		expect(result.current.isLoading).toBe(false);
		expect(result.current.isError).toBe(false);
		expect(result.current.users).toEqual([]);
	});

	it('should fetch from API when not simulated', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				count: 100,
				moods: {
					moment: 20,
					anxious: 10,
					processing: 30,
					preparing: 15,
					grateful: 15,
					celebrating: 5,
					here: 5,
				},
			}),
		});

		const { result } = renderHook(
			() => usePresence({ simulated: false, pollInterval: 5000 }),
			{ wrapper: createWrapper() },
		);

		await waitFor(
			() => {
				expect(result.current.count).toBe(100);
			},
			{ timeout: 3000 },
		);

		expect(mockFetch).toHaveBeenCalledWith('/api/presence');
		expect(result.current.isError).toBe(false);
	});

	it('should expose loading state initially', () => {
		// Don't resolve the fetch to keep it loading
		mockFetch.mockImplementation(() => new Promise(() => {}));

		const { result } = renderHook(() => usePresence({ simulated: false }), {
			wrapper: createWrapper(),
		});

		// Should be loading initially
		expect(result.current.isLoading).toBe(true);
	});

	it('should have correct PresenceData shape', () => {
		const mockSnapshot: PopulationSnapshot = {
			count: 25,
			moods: {
				moment: 5,
				anxious: 3,
				processing: 7,
				preparing: 4,
				grateful: 3,
				celebrating: 2,
				here: 1,
			},
			users: [],
			timestamp: Date.now(),
		};

		const { result } = renderHook(
			() => usePresence({ simulated: true, simulationSnapshot: mockSnapshot }),
			{ wrapper: createWrapper() },
		);

		// Verify shape of returned data
		expect(typeof result.current.count).toBe('number');
		expect(typeof result.current.moods).toBe('object');
		expect(typeof result.current.isLoading).toBe('boolean');
		expect(typeof result.current.isError).toBe('boolean');
	});

	it('should use default values when no options provided', () => {
		const { result } = renderHook(() => usePresence(), {
			wrapper: createWrapper(),
		});

		// Default is simulated = true with no snapshot, so should have empty data
		expect(result.current.count).toBe(0);
		expect(result.current.isLoading).toBe(false);
	});
});
