/**
 * ParticleMesh - React Three Fiber component for 50K particle rendering
 */
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { BreathState } from '../core/breath';
import { GPUParticleSystem } from '../core/particles/GPUParticleSystem';

interface ParticleMeshProps {
	breathState: BreathState;
}

export function ParticleMesh({ breathState }: ParticleMeshProps) {
	const { gl } = useThree();
	const systemRef = useRef<GPUParticleSystem | null>(null);

	// Initialize particle system
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

	// Animation loop
	useFrame((state) => {
		const time = state.clock.elapsedTime;
		system.compute(time, breathState);
	});

	return <primitive object={system.points} />;
}
