import { memo } from 'react';
import * as THREE from 'three';

/**
 * SceneAxes - Origin marker with XYZ axes helper
 *
 * Displays:
 * - Small sphere at scene origin (0,0,0)
 * - AxesHelper showing X (red), Y (green), Z (blue)
 * - Always rendered on top (depthTest: false)
 */
export const SceneAxes = memo(() => {
	return (
		<group name="scene-axes">
			{/* Origin marker - small bright sphere */}
			<mesh position={[0, 0, 0]}>
				<sphereGeometry args={[0.15, 16, 16]} />
				<meshBasicMaterial
					color="#ffffff"
					transparent
					opacity={0.9}
					depthTest={false}
				/>
			</mesh>

			{/* XYZ Axes - 5 units long */}
			<primitive
				object={(() => {
					const axes = new THREE.AxesHelper(5);
					axes.material.depthTest = false;
					axes.renderOrder = 999;
					return axes;
				})()}
			/>
		</group>
	);
});
