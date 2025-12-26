import { memo, useEffect, useState } from 'react';
import { debugObj } from '../../../lib/theatre';
import type { DebugProps } from '../../../lib/theatre/types';
import { LayerPlanes } from './LayerPlanes';
import { OrbitRings } from './OrbitRings';
import { SceneAxes } from './SceneAxes';

/**
 * DebugGuides - Main debug visualization wrapper
 *
 * Subscribes to Theatre.js debugObj and conditionally renders:
 * - SceneAxes: Origin marker with XYZ axes
 * - OrbitRings: Particle orbit boundary visualization
 * - LayerPlanes: Z-depth layer planes
 *
 * All controlled via Theatre.js Studio UI
 */
export const DebugGuides = memo(() => {
	const [debugProps, setDebugProps] = useState<DebugProps>(debugObj.value);

	// Subscribe to Theatre.js debug object changes
	useEffect(() => {
		const unsubscribe = debugObj.onValuesChange((values) => {
			setDebugProps(values);
		});
		return unsubscribe;
	}, []);

	// Don't render anything if debug is disabled
	if (!debugProps.enabled) {
		return null;
	}

	return (
		<group name="debug-guides" renderOrder={1000}>
			{!!debugProps.showAxes && <SceneAxes />}

			{!!debugProps.showOrbitRings && (
				<OrbitRings
					ringOpacity={debugProps.ringOpacity}
					settledRingColor={debugProps.settledRingColor}
					spreadRingColor={debugProps.spreadRingColor}
				/>
			)}

			{!!debugProps.showLayerPlanes && <LayerPlanes />}
		</group>
	);
});
