/**
 * Theatre.js Subscription Helpers
 *
 * Provides unified patterns for subscribing to Theatre.js objects
 * with proper separation of animation (ref-based) vs structural (state-based) props.
 *
 * Animation props: High-frequency updates, read in useFrame, no re-renders
 * Structural props: Affect material/geometry creation, trigger re-renders when changed
 */

import type { ISheetObject } from '@theatre/core';
import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Options for useTheatreObject hook
 */
export interface UseTheatreObjectOptions<T> {
	/**
	 * Keys that should trigger React re-renders when changed.
	 * Use for props that affect material/geometry creation (e.g., color, count).
	 * All other keys will be ref-only (for useFrame animation loops).
	 */
	structuralKeys?: (keyof T)[];
}

/**
 * Return type for useTheatreObject hook
 */
export interface UseTheatreObjectResult<T> {
	/**
	 * Ref containing all current values - read in useFrame loops.
	 * Updates every frame without causing re-renders.
	 */
	ref: React.MutableRefObject<T>;

	/**
	 * Structural values that trigger re-renders when changed.
	 * Only populated if structuralKeys option is provided.
	 */
	structural: Partial<T>;
}

/**
 * Hook for subscribing to Theatre.js objects with unified pattern
 *
 * Separates animation props (ref-based, no re-renders) from structural props
 * (state-based, triggers re-renders for material/geometry updates).
 *
 * @example
 * ```tsx
 * // All props as ref-only (for pure animation)
 * const { ref } = useTheatreObject(orbGlowObj);
 *
 * useFrame(() => {
 *   const { scale, glowIntensity } = ref.current;
 *   // Animate...
 * });
 * ```
 *
 * @example
 * ```tsx
 * // With structural props that trigger re-renders
 * const { ref, structural } = useTheatreObject(orbitalParticlesObj, {
 *   structuralKeys: ['colorR', 'colorG', 'colorB', 'opacity']
 * });
 *
 * // structural.colorR etc. will cause re-renders when changed
 * const color = useMemo(() =>
 *   new THREE.Color(structural.colorR, structural.colorG, structural.colorB),
 *   [structural.colorR, structural.colorG, structural.colorB]
 * );
 *
 * useFrame(() => {
 *   const { orbitSpeed, particleSize } = ref.current;
 *   // Animate without re-renders...
 * });
 * ```
 */
export function useTheatreObject<T extends Record<string, unknown>>(
	obj: ISheetObject<T>,
	options?: UseTheatreObjectOptions<T>,
): UseTheatreObjectResult<T> {
	const structuralKeys = options?.structuralKeys ?? [];

	// Ref for all values (animation props read here)
	const ref = useRef<T>(obj.value);

	// State for structural props only
	const [structural, setStructural] = useState<Partial<T>>(() => {
		if (structuralKeys.length === 0) return {};
		const initial: Partial<T> = {};
		for (const key of structuralKeys) {
			initial[key] = obj.value[key];
		}
		return initial;
	});

	// Subscribe to Theatre.js object changes
	useEffect(() => {
		const unsubscribe = obj.onValuesChange((values) => {
			// Always update ref (no re-render)
			ref.current = values;

			// Check if any structural keys changed
			if (structuralKeys.length > 0) {
				setStructural((prev) => {
					let hasChanged = false;
					const next: Partial<T> = { ...prev };

					for (const key of structuralKeys) {
						if (prev[key] !== values[key]) {
							next[key] = values[key];
							hasChanged = true;
						}
					}

					// Only trigger re-render if structural props actually changed
					return hasChanged ? next : prev;
				});
			}
		});

		return unsubscribe;
	}, [obj, structuralKeys]);

	return { ref, structural };
}

/**
 * Simple ref-only subscription for Theatre.js objects
 *
 * Use when all props are animation-only and no re-renders are needed.
 * This is the most common case for visualization components.
 *
 * @example
 * ```tsx
 * const propsRef = useTheatreRef(glassOrbObj);
 *
 * useFrame(() => {
 *   const { scale, transmission, thickness } = propsRef.current;
 *   materialRef.current.thickness = thickness;
 * });
 * ```
 */
export function useTheatreRef<T>(
	obj: ISheetObject<T>,
): React.MutableRefObject<T> {
	const ref = useRef<T>(obj.value);

	useEffect(() => {
		const unsubscribe = obj.onValuesChange((values) => {
			ref.current = values;
		});
		return unsubscribe;
	}, [obj]);

	return ref;
}

/**
 * Extract color from Theatre.js props with RGB components
 *
 * Helper for components that store color as separate R, G, B props.
 *
 * @example
 * ```tsx
 * const { structural } = useTheatreObject(orbGlowObj, {
 *   structuralKeys: ['colorR', 'colorG', 'colorB']
 * });
 *
 * const color = useTheatreColor(structural);
 * ```
 */
export function useTheatreColor(props: {
	colorR?: number;
	colorG?: number;
	colorB?: number;
}): [number, number, number] {
	return useMemo(
		() => [props.colorR ?? 1, props.colorG ?? 1, props.colorB ?? 1],
		[props.colorR, props.colorG, props.colorB],
	);
}
