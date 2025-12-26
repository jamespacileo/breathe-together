import { useEffect, useRef } from 'react';

export interface ViewOffset {
	x: number;
	y: number;
}

/**
 * Hook to track mouse/touch position for micro-saccade parallax effect
 * Uses refs instead of state to avoid re-renders per R3F best practices
 */
export function useViewOffset(): React.MutableRefObject<ViewOffset> {
	const targetRef = useRef<ViewOffset>({ x: 0, y: 0 });
	const currentRef = useRef<ViewOffset>({ x: 0, y: 0 });
	const animFrameRef = useRef(0);

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			const x = (e.clientX / window.innerWidth - 0.5) * 2;
			const y = (e.clientY / window.innerHeight - 0.5) * 2;
			targetRef.current = { x: x * 0.02, y: y * 0.02 }; // Very subtle
		};

		const handleOrientation = (e: DeviceOrientationEvent) => {
			if (e.gamma !== null && e.beta !== null) {
				const x = (e.gamma / 90) * 0.02;
				const y = (e.beta / 90) * 0.02;
				targetRef.current = { x, y };
			}
		};

		// Smooth interpolation via refs (no setState to avoid re-renders)
		const animate = () => {
			currentRef.current.x +=
				(targetRef.current.x - currentRef.current.x) * 0.05;
			currentRef.current.y +=
				(targetRef.current.y - currentRef.current.y) * 0.05;
			animFrameRef.current = requestAnimationFrame(animate);
		};

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('deviceorientation', handleOrientation);
		animFrameRef.current = requestAnimationFrame(animate);

		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('deviceorientation', handleOrientation);
			cancelAnimationFrame(animFrameRef.current);
		};
	}, []);

	return currentRef;
}
