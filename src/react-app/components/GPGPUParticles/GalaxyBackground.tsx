import { GradientTexture } from '@react-three/drei';
import { memo } from 'react';
import * as THREE from 'three';
import { LAYER_DEPTHS } from '../../lib/layers';

/**
 * Galaxy Background
 *
 * Simple gradient backdrop for deep space atmosphere.
 * Intentionally minimal to avoid flickering artifacts.
 */
export const GalaxyBackground = memo(() => {
	return (
		<mesh position={[0, 0, LAYER_DEPTHS.GALAXY_BACKGROUND]} scale={[200, 200, 1]}>
			<planeGeometry args={[1, 1]} />
			<meshBasicMaterial transparent opacity={0.6} side={THREE.DoubleSide}>
				<GradientTexture
					stops={[0, 0.35, 0.7, 1]}
					colors={['#0a0f15', '#0f1520', '#121a28', '#0a0f15']}
				/>
			</meshBasicMaterial>
		</mesh>
	);
});
