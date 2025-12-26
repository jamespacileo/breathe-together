import { memo } from 'react';
import * as THREE from 'three';
import { LAYER_DEPTHS } from '../../../lib/layers';

interface DepthPlaneProps {
	zPosition: number;
	label: string;
	color: string;
	opacity?: number;
}

/**
 * DepthPlane - Semi-transparent plane with grid at a specific z-depth
 */
const DepthPlane = memo(
	({ zPosition, label, color, opacity = 0.15 }: DepthPlaneProps) => {
		return (
			<group position={[0, 0, zPosition]} name={`depth-plane-${label}`}>
				{/* Grid plane */}
				<mesh rotation={[0, 0, 0]}>
					<planeGeometry args={[40, 40, 20, 20]} />
					<meshBasicMaterial
						color={color}
						wireframe
						transparent
						opacity={opacity}
						side={THREE.DoubleSide}
						depthTest={false}
					/>
				</mesh>

				{/* Center marker */}
				<mesh>
					<ringGeometry args={[0.3, 0.5, 32]} />
					<meshBasicMaterial
						color={color}
						transparent
						opacity={opacity * 2}
						side={THREE.DoubleSide}
						depthTest={false}
					/>
				</mesh>
			</group>
		);
	},
);

/**
 * LayerPlanes - Visualizes z-depth layers in the scene
 *
 * Shows planes at key z-positions:
 * - Z=0: Scene center (breathing sphere)
 * - Z=8: User particles settled depth
 * - Z=18: User particles spread depth
 * - Z=50: Peripheral particles / Camera position
 */
export const LayerPlanes = memo(() => {
	return (
		<group name="layer-planes">
			{/* Scene center - breathing sphere origin */}
			<DepthPlane
				zPosition={LAYER_DEPTHS.BREATHING_SPHERE}
				label="center"
				color="#ffffff"
				opacity={0.2}
			/>

			{/* User particles settled depth */}
			<DepthPlane
				zPosition={LAYER_DEPTHS.USER_PARTICLES_SETTLED}
				label="settled"
				color="#4ade80"
				opacity={0.12}
			/>

			{/* User particles spread depth */}
			<DepthPlane
				zPosition={LAYER_DEPTHS.USER_PARTICLES_SPREAD}
				label="spread"
				color="#f97316"
				opacity={0.12}
			/>

			{/* Peripheral particles / Camera */}
			<DepthPlane
				zPosition={LAYER_DEPTHS.PERIPHERAL_PARTICLES_Z}
				label="peripheral"
				color="#06b6d4"
				opacity={0.08}
			/>
		</group>
	);
});
