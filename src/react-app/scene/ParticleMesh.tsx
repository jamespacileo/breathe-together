/**
 * Particle Mesh Component
 * Renders the 50K particle Points mesh
 */

import { useFrame } from '@react-three/fiber';
import type { GPUParticleSystem } from '../core/particles/GPUParticleSystem';
import type { BreathState } from '../core/types';
import { getTemperatureShift } from './useBreathPhase';

interface ParticleMeshProps {
	system: GPUParticleSystem;
	breathState: BreathState;
}

export function ParticleMesh({ system, breathState }: ParticleMeshProps) {
	// Animation loop
	useFrame((state) => {
		const time = state.clock.elapsedTime;
		const temperatureShift = getTemperatureShift(breathState);

		// Update particle system uniforms
		system.update({
			time,
			phaseType: breathState.phaseIndex,
			easedProgress: breathState.easedProgress,
			temperatureShift,
		});

		// Run GPU computation
		system.compute();
	});

	return <primitive object={system.points} />;
}
