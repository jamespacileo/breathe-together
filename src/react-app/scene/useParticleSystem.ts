/**
 * React hook for GPU particle system management
 */

import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { GPUParticleSystem } from '../core/particles/GPUParticleSystem';

export interface ParticleSystemState {
	system: GPUParticleSystem | null;
	isReady: boolean;
}

export function useParticleSystem(): ParticleSystemState {
	const { gl } = useThree();
	const systemRef = useRef<GPUParticleSystem | null>(null);
	const isReadyRef = useRef(false);

	// Initialize system once
	if (!systemRef.current && gl) {
		try {
			systemRef.current = new GPUParticleSystem({ renderer: gl });
			isReadyRef.current = true;
		} catch (error) {
			console.error('Failed to initialize particle system:', error);
			isReadyRef.current = false;
		}
	}

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (systemRef.current) {
				systemRef.current.dispose();
				systemRef.current = null;
				isReadyRef.current = false;
			}
		};
	}, []);

	return {
		system: systemRef.current,
		isReady: isReadyRef.current,
	};
}
