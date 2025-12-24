import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PatternId } from '../lib/patterns';
import { useBreathSync } from './useBreathSync';

describe('useBreathSync', () => {
	let rafId = 0;
	let rafCallbacks: Map<number, FrameRequestCallback> = new Map();

	beforeEach(() => {
		vi.useFakeTimers();
		rafId = 0;
		rafCallbacks = new Map();

		// Mock requestAnimationFrame to work with fake timers
		vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
			const id = ++rafId;
			rafCallbacks.set(id, cb);
			return id;
		});

		vi.stubGlobal('cancelAnimationFrame', (id: number) => {
			rafCallbacks.delete(id);
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	// Helper to run pending animation frames
	const runAnimationFrame = () => {
		const callbacks = Array.from(rafCallbacks.entries());
		rafCallbacks.clear();
		for (const [, callback] of callbacks) {
			callback(performance.now());
		}
	};

	it('should return initial breath state', () => {
		vi.setSystemTime(0);
		const { result } = renderHook(() => useBreathSync('box'));

		expect(result.current).toMatchObject({
			phase: 'in',
			phaseName: 'Breathe In',
			phaseIndex: 0,
		});
		expect(result.current.progress).toBeGreaterThanOrEqual(0);
		expect(result.current.progress).toBeLessThanOrEqual(1);
		expect(result.current.cycleProgress).toBeGreaterThanOrEqual(0);
		expect(result.current.cycleProgress).toBeLessThanOrEqual(1);
	});

	it('should update state when time passes', async () => {
		vi.setSystemTime(0);
		const { result } = renderHook(() => useBreathSync('box'));

		// Initial state
		expect(result.current.phase).toBe('in');

		// Advance to second phase (4 seconds = hold-in)
		await act(async () => {
			vi.setSystemTime(4500); // 4.5 seconds
			runAnimationFrame(); // trigger rAF update
		});

		expect(result.current.phase).toBe('hold-in');
		expect(result.current.phaseName).toBe('Hold');
		expect(result.current.phaseIndex).toBe(1);
	});

	it('should wrap around after full cycle', async () => {
		vi.setSystemTime(0);
		const { result } = renderHook(() => useBreathSync('box'));

		// Advance past one full cycle (16 seconds for box pattern)
		await act(async () => {
			vi.setSystemTime(17000); // 17 seconds
			runAnimationFrame();
		});

		// Should be back to first phase
		expect(result.current.phase).toBe('in');
		expect(result.current.phaseIndex).toBe(0);
	});

	it('should respond to pattern change', async () => {
		vi.setSystemTime(0);
		const { result, rerender } = renderHook(
			({ pattern }: { pattern: PatternId }) => useBreathSync(pattern),
			{ initialProps: { pattern: 'box' as PatternId } },
		);

		expect(result.current.phase).toBe('in');

		// Switch to relaxation pattern
		rerender({ pattern: 'relaxation' });

		// Relaxation pattern also starts with 'in' but has different timing
		expect(result.current.phase).toBe('in');
	});

	it('should provide correct progress values', async () => {
		vi.setSystemTime(0);
		const { result } = renderHook(() => useBreathSync('box'));

		// At start, progress should be near 0
		expect(result.current.progress).toBeCloseTo(0, 1);
		expect(result.current.cycleProgress).toBeCloseTo(0, 1);

		// At 2 seconds (middle of first phase)
		await act(async () => {
			vi.setSystemTime(2000);
			runAnimationFrame();
		});

		expect(result.current.progress).toBeCloseTo(0.5, 1);
		expect(result.current.cycleProgress).toBeCloseTo(0.125, 1); // 2/16
	});

	it('should clean up animation frame on unmount', () => {
		vi.setSystemTime(0);
		const cancelAnimationFrameSpy = vi.spyOn(global, 'cancelAnimationFrame');

		const { unmount } = renderHook(() => useBreathSync('box'));

		unmount();

		expect(cancelAnimationFrameSpy).toHaveBeenCalled();
		cancelAnimationFrameSpy.mockRestore();
	});

	it('should use default pattern when not specified', () => {
		vi.setSystemTime(0);
		const { result } = renderHook(() => useBreathSync());

		// Default is 'box' pattern
		expect(result.current.phase).toBeDefined();
		expect(result.current.phaseName).toBeDefined();
	});
});
