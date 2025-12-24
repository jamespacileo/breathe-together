import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCurrentPhase, PATTERNS } from './breathPatterns';

describe('PATTERNS', () => {
	it('should have box breathing pattern with correct total duration', () => {
		expect(PATTERNS.box).toBeDefined();
		expect(PATTERNS.box.totalDuration).toBe(16);
		expect(PATTERNS.box.phases).toHaveLength(4);
	});

	it('should have relaxation pattern with correct total duration', () => {
		expect(PATTERNS.relaxation).toBeDefined();
		expect(PATTERNS.relaxation.totalDuration).toBe(19);
		expect(PATTERNS.relaxation.phases).toHaveLength(3);
	});

	it('should have matching phase durations to totalDuration', () => {
		for (const [_key, pattern] of Object.entries(PATTERNS)) {
			const computedTotal = pattern.phases.reduce(
				(sum, p) => sum + p.duration,
				0,
			);
			expect(computedTotal).toBe(pattern.totalDuration);
		}
	});
});

describe('getCurrentPhase', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should return first phase at start of cycle', () => {
		// Set time to exactly 0 seconds (start of cycle)
		vi.setSystemTime(0);

		const result = getCurrentPhase(PATTERNS.box);

		expect(result.phaseIndex).toBe(0);
		expect(result.phase.type).toBe('in');
		expect(result.progress).toBeCloseTo(0, 2);
	});

	it('should return correct phase at mid-cycle', () => {
		// Set time to 8 seconds (middle of third phase - breathe out)
		vi.setSystemTime(10000); // 10 seconds in ms

		const result = getCurrentPhase(PATTERNS.box);

		// At 10 seconds: phases are in(4s), hold-in(4s), out(4s)
		// 10s falls in 3rd phase (out) which starts at 8s
		expect(result.phaseIndex).toBe(2);
		expect(result.phase.type).toBe('out');
		expect(result.progress).toBeCloseTo(0.5, 2); // 2 seconds into 4 second phase
	});

	it('should wrap around after full cycle', () => {
		// Set time to 17 seconds (1 second into second cycle)
		vi.setSystemTime(17000);

		const result = getCurrentPhase(PATTERNS.box);

		// 17 % 16 = 1 second into first phase
		expect(result.phaseIndex).toBe(0);
		expect(result.phase.type).toBe('in');
		expect(result.progress).toBeCloseTo(0.25, 2); // 1 second into 4 second phase
	});

	it('should calculate cycleProgress correctly', () => {
		vi.setSystemTime(8000); // 8 seconds

		const result = getCurrentPhase(PATTERNS.box);

		// 8 seconds / 16 total = 0.5 cycle progress
		expect(result.cycleProgress).toBeCloseTo(0.5, 2);
	});

	it('should clamp progress between 0 and 1', () => {
		vi.setSystemTime(0);

		const result = getCurrentPhase(PATTERNS.box);

		expect(result.progress).toBeGreaterThanOrEqual(0);
		expect(result.progress).toBeLessThanOrEqual(1);
	});
});
