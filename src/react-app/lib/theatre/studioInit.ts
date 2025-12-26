/**
 * Theatre.js Studio Initialization
 *
 * Dev-only initialization of Theatre.js Studio UI.
 * This module is dynamically imported only in development mode.
 */

import type { IStudio } from '@theatre/studio';

let studioInstance: IStudio | null = null;

/**
 * Initialize Theatre.js Studio in development mode only.
 * Returns the studio instance or null in production.
 *
 * @example
 * ```tsx
 * // In main.tsx
 * initializeStudio().then(() => {
 *   ReactDOM.createRoot(root).render(<App />);
 * });
 * ```
 */
export async function initializeStudio(): Promise<IStudio | null> {
	// Only initialize in development
	if (!import.meta.env.DEV) {
		return null;
	}

	// Return existing instance if already initialized
	if (studioInstance) {
		return studioInstance;
	}

	try {
		// Dynamic import to ensure tree-shaking in production
		const studioModule = await import('@theatre/studio');
		const studio = studioModule.default;

		// Initialize studio
		studio.initialize();

		studioInstance = studio;
		console.log('[Theatre.js] Studio initialized');

		return studio;
	} catch (error) {
		console.error('[Theatre.js] Failed to initialize studio:', error);
		return null;
	}
}

/**
 * Get the current studio instance (if initialized)
 */
export function getStudio(): IStudio | null {
	return studioInstance;
}
