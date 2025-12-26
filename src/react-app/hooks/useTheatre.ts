import { useEffect, useRef, useState } from 'react';
import type { ISheetObject } from '@theatre/core';

/**
 * Hook to subscribe to Theatre.js object changes with minimal re-renders.
 * Returns a ref with the current values and a reactive state for values that need to trigger re-renders.
 * 
 * @param object The Theatre.js object to subscribe to
 * @param reactiveKeys Optional list of keys that should trigger a React re-render when they change
 */
export function useTheatre<T extends Record<string, any>>(
	object: ISheetObject<T>,
	reactiveKeys: (keyof T)[] = []
) {
	const valuesRef = useRef<T>(object.value);
	const [reactiveValues, setReactiveValues] = useState<Partial<T>>(() => {
		const initial: Partial<T> = {};
		for (const key of reactiveKeys) {
			initial[key] = object.value[key];
		}
		return initial;
	});

	useEffect(() => {
		const unsubscribe = object.onValuesChange((values) => {
			valuesRef.current = values;

			if (reactiveKeys.length > 0) {
				setReactiveValues((prev) => {
					let changed = false;
					const next: Partial<T> = { ...prev };
					for (const key of reactiveKeys) {
						if (prev[key] !== values[key]) {
							next[key] = values[key];
							changed = true;
						}
					}
					return changed ? next : prev;
				});
			}
		});
		return unsubscribe;
	}, [object, ...reactiveKeys]);

	return { valuesRef, ...reactiveValues };
}
