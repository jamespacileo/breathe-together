import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG } from '../lib/config';
import { calculateTargetScale } from './useBreathingSpring';
import type { BreathState } from './useBreathSync';

describe('calculateTargetScale', () => {
	const mockConfig = {
		...DEFAULT_CONFIG,
		breatheInScale: 0.7,
		breatheOutScale: 1.2,
		holdOscillation: 0.02,
		holdOscillationSpeed: 0.003,
	};

	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should return breatheOutScale at start of inhale (contracted)', () => {
		const breathState: BreathState = {
			phase: 'in',
			phaseName: 'Breathe In',
			progress: 0,
			cycleProgress: 0,
			phaseIndex: 0,
		};

		const scale = calculateTargetScale(breathState, mockConfig);

		// At progress 0 of 'in', should be at breatheOutScale (1.2)
		expect(scale).toBeCloseTo(1.2, 2);
	});

	it('should return breatheInScale at end of inhale (fully contracted)', () => {
		const breathState: BreathState = {
			phase: 'in',
			phaseName: 'Breathe In',
			progress: 1,
			cycleProgress: 0.25,
			phaseIndex: 0,
		};

		const scale = calculateTargetScale(breathState, mockConfig);

		// At progress 1 of 'in', should be at breatheInScale (0.7)
		expect(scale).toBeCloseTo(0.7, 2);
	});

	it('should return breatheInScale at start of exhale', () => {
		const breathState: BreathState = {
			phase: 'out',
			phaseName: 'Breathe Out',
			progress: 0,
			cycleProgress: 0.5,
			phaseIndex: 2,
		};

		const scale = calculateTargetScale(breathState, mockConfig);

		// At progress 0 of 'out', should be at breatheInScale (0.7)
		expect(scale).toBeCloseTo(0.7, 2);
	});

	it('should return breatheOutScale at end of exhale (fully expanded)', () => {
		const breathState: BreathState = {
			phase: 'out',
			phaseName: 'Breathe Out',
			progress: 1,
			cycleProgress: 0.75,
			phaseIndex: 2,
		};

		const scale = calculateTargetScale(breathState, mockConfig);

		// At progress 1 of 'out', should be at breatheOutScale (1.2)
		expect(scale).toBeCloseTo(1.2, 2);
	});

	it('should oscillate around breatheInScale during hold-in', () => {
		vi.setSystemTime(0);

		const breathState: BreathState = {
			phase: 'hold-in',
			phaseName: 'Hold',
			progress: 0.5,
			cycleProgress: 0.375,
			phaseIndex: 1,
		};

		const scale = calculateTargetScale(breathState, mockConfig);

		// Should be near breatheInScale (0.7) with small oscillation (±0.02)
		expect(scale).toBeGreaterThanOrEqual(0.68);
		expect(scale).toBeLessThanOrEqual(0.72);
	});

	it('should oscillate around breatheOutScale during hold-out', () => {
		vi.setSystemTime(0);

		const breathState: BreathState = {
			phase: 'hold-out',
			phaseName: 'Hold',
			progress: 0.5,
			cycleProgress: 0.875,
			phaseIndex: 3,
		};

		const scale = calculateTargetScale(breathState, mockConfig);

		// Should be near breatheOutScale (1.2) with small oscillation (±0.02)
		expect(scale).toBeGreaterThanOrEqual(1.18);
		expect(scale).toBeLessThanOrEqual(1.22);
	});

	it('should interpolate linearly during transitions', () => {
		const breathState: BreathState = {
			phase: 'in',
			phaseName: 'Breathe In',
			progress: 0.5, // Middle of inhale
			cycleProgress: 0.125,
			phaseIndex: 0,
		};

		const scale = calculateTargetScale(breathState, mockConfig);

		// At 50% progress during 'in', should be halfway between out and in scales
		// 1.2 - (1.2 - 0.7) * 0.5 = 1.2 - 0.25 = 0.95
		expect(scale).toBeCloseTo(0.95, 2);
	});
});

describe('useBreathingSpring integration', () => {
	// Note: useBreathingSpring uses Framer Motion's useSpring which requires
	// a React environment and Framer Motion's animation frame handling.
	// Full integration tests would need a more complex setup.
	// These tests cover the core calculation logic.

	it('should calculate smooth transitions from one phase to another', () => {
		const config = {
			...DEFAULT_CONFIG,
			breatheInScale: 0.7,
			breatheOutScale: 1.3,
			holdOscillation: 0.01,
			holdOscillationSpeed: 0.002,
		};

		// Simulate a breathing cycle by checking key points
		const checkpoints = [
			{
				phase: 'in' as const,
				progress: 0,
				expectedMin: 1.25,
				expectedMax: 1.35,
			},
			{
				phase: 'in' as const,
				progress: 1,
				expectedMin: 0.65,
				expectedMax: 0.75,
			},
			{
				phase: 'out' as const,
				progress: 0,
				expectedMin: 0.65,
				expectedMax: 0.75,
			},
			{
				phase: 'out' as const,
				progress: 1,
				expectedMin: 1.25,
				expectedMax: 1.35,
			},
		];

		checkpoints.forEach(({ phase, progress, expectedMin, expectedMax }) => {
			const breathState: BreathState = {
				phase,
				phaseName: phase === 'in' ? 'Breathe In' : 'Breathe Out',
				progress,
				cycleProgress: 0,
				phaseIndex: phase === 'in' ? 0 : 2,
			};

			const scale = calculateTargetScale(breathState, config);

			expect(scale).toBeGreaterThanOrEqual(expectedMin);
			expect(scale).toBeLessThanOrEqual(expectedMax);
		});
	});
});
