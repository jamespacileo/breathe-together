import { useEffect, useRef } from 'react';

export interface ViewOffset {
	x: number;
	y: number;
}

const PARALLAX_STRENGTH = 0.02;

/**
 * Track mouse/touch position for micro-saccade parallax effect.
 * Returns a ref to avoid re-renders - read in useFrame loops.
 */
export function useViewOffset(): React.MutableRefObject<ViewOffset> {
	const offsetRef = useRef<ViewOffset>({ x: 0, y: 0 });

	useEffect(() => {
		const onMouse = (e: MouseEvent) => {
			offsetRef.current.x =
				(e.clientX / window.innerWidth - 0.5) * 2 * PARALLAX_STRENGTH;
			offsetRef.current.y =
				(e.clientY / window.innerHeight - 0.5) * 2 * PARALLAX_STRENGTH;
		};
		const onOrientation = (e: DeviceOrientationEvent) => {
			if (e.gamma !== null && e.beta !== null) {
				offsetRef.current.x = (e.gamma / 90) * PARALLAX_STRENGTH;
				offsetRef.current.y = (e.beta / 90) * PARALLAX_STRENGTH;
			}
		};
		window.addEventListener('mousemove', onMouse);
		window.addEventListener('deviceorientation', onOrientation);
		return () => {
			window.removeEventListener('mousemove', onMouse);
			window.removeEventListener('deviceorientation', onOrientation);
		};
	}, []);

	return offsetRef;
}
