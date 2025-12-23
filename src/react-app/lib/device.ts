/**
 * Device detection utilities for compatibility handling
 */

/**
 * Detect if running on iOS (iPhone, iPad, iPod)
 * Handles both traditional user agent and newer iPad detection
 */
export function isIOS(): boolean {
	if (typeof navigator === 'undefined') return false;

	const ua = navigator.userAgent;

	// Traditional iOS detection
	if (/iPad|iPhone|iPod/.test(ua)) {
		return true;
	}

	// iPad on iOS 13+ reports as Mac, detect via touch + Mac platform
	if (
		/Macintosh/.test(ua) &&
		navigator.maxTouchPoints &&
		navigator.maxTouchPoints > 1
	) {
		return true;
	}

	return false;
}

/**
 * Detect if running on mobile Safari specifically
 */
export function isMobileSafari(): boolean {
	if (typeof navigator === 'undefined') return false;

	const ua = navigator.userAgent;
	return isIOS() && /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS/.test(ua);
}

/**
 * Check if device likely has limited WebGL support
 * (iOS Safari has known issues with complex particle systems)
 */
export function hasLimitedWebGL(): boolean {
	return isIOS();
}
