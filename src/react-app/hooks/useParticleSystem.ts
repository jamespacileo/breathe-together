/**
 * Hook for managing the GPU particle system
 */

import { useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { GPUParticleSystem } from '../core/particles/GPUParticleSystem';
import type { BreathState, WordFormationState } from '../core/types';

export interface UseParticleSystemResult {
	system: GPUParticleSystem;
	compute: (
		time: number,
		breathState: BreathState,
		wordState?: WordFormationState,
	) => void;
	setTemperatureShift: (value: number) => void;
	setSphereConfig: (radius: number, depth: number) => void;
}

/**
 * Initialize and manage the GPU particle system
 */
export function useParticleSystem(): UseParticleSystemResult {
	const { gl } = useThree();
	const systemRef = useRef<GPUParticleSystem | null>(null);

	// Create particle system
	const system = useMemo(() => {
		const particleSystem = new GPUParticleSystem({ gl });
		systemRef.current = particleSystem;
		return particleSystem;
	}, [gl]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (systemRef.current) {
				systemRef.current.dispose();
				systemRef.current = null;
			}
		};
	}, []);

	// Memoized methods
	const compute = useMemo(
		() =>
			(
				time: number,
				breathState: BreathState,
				wordState?: WordFormationState,
			) => {
				system.compute(time, breathState, wordState);
			},
		[system],
	);

	const setTemperatureShift = useMemo(
		() => (value: number) => {
			system.setTemperatureShift(value);
		},
		[system],
	);

	const setSphereConfig = useMemo(
		() => (radius: number, depth: number) => {
			system.setSphereRadius(radius, depth);
		},
		[system],
	);

	return {
		system,
		compute,
		setTemperatureShift,
		setSphereConfig,
	};
}
