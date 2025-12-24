import { describe, expect, it } from 'vitest';
import {
	AVATARS,
	BASE_COLORS,
	createColorScale,
	darken,
	getAvatarGradient,
	getContrastingText,
	getMoodColor,
	hasContrast,
	hexToRgb,
	hexToRgba,
	lerpColor,
	lighten,
	MOODS,
} from './colors';

describe('hexToRgb', () => {
	it('should convert hex to RGB values in 0-1 range', () => {
		const result = hexToRgb('#ffffff');
		expect(result.r).toBeCloseTo(1, 1);
		expect(result.g).toBeCloseTo(1, 1);
		expect(result.b).toBeCloseTo(1, 1);
	});

	it('should convert black correctly', () => {
		const result = hexToRgb('#000000');
		expect(result.r).toBeCloseTo(0, 1);
		expect(result.g).toBeCloseTo(0, 1);
		expect(result.b).toBeCloseTo(0, 1);
	});

	it('should return fallback for invalid hex', () => {
		const result = hexToRgb('invalid');
		// Fallback is now cyan (#00D4FF)
		expect(result).toEqual({ r: 0, g: 0.83, b: 1 });
	});
});

describe('hexToRgba', () => {
	it('should convert hex to RGBA string with alpha', () => {
		const result = hexToRgba('#ff0000', 0.5);
		// Modern CSS format uses "rgb(r g b / a)" syntax
		expect(result).toMatch(/rgb\(255\s+0\s+0\s*\/\s*0\.5\)/);
	});

	it('should handle full opacity', () => {
		const result = hexToRgba('#00ff00', 1);
		expect(result).toContain('rgb');
	});

	it('should return fallback for invalid input', () => {
		const result = hexToRgba('invalid', 0.5);
		// Fallback is now cyan (#00D4FF)
		expect(result).toBe('rgba(0, 212, 255, 0.5)');
	});
});

describe('getAvatarGradient', () => {
	it('should return gradient for valid avatar ID', () => {
		const result = getAvatarGradient('teal');
		expect(result).toContain('linear-gradient');
		// Updated teal avatar colors
		expect(result).toContain('#00D4FF');
		expect(result).toContain('#0099CC');
	});

	it('should return default gradient for invalid avatar ID', () => {
		const result = getAvatarGradient('nonexistent');
		expect(result).toContain('linear-gradient');
		expect(result).toContain(AVATARS[0].colors[0]);
	});
});

describe('getMoodColor', () => {
	it('should return correct color for mood ID', () => {
		const result = getMoodColor('moment');
		// Updated to cyan primary color
		expect(result).toBe('#00D4FF');
	});

	it('should return base color for undefined mood', () => {
		const result = getMoodColor(undefined);
		expect(result).toBe(BASE_COLORS.primary);
	});

	it('should return base color for empty string', () => {
		const result = getMoodColor('');
		expect(result).toBe(BASE_COLORS.primary);
	});
});

describe('lerpColor', () => {
	it('should return first color at t=0', () => {
		const result = lerpColor('#ff0000', '#0000ff', 0);
		expect(result.toLowerCase()).toBe('#ff0000');
	});

	it('should return second color at t=1', () => {
		const result = lerpColor('#ff0000', '#0000ff', 1);
		expect(result.toLowerCase()).toBe('#0000ff');
	});

	it('should return interpolated color at t=0.5', () => {
		const result = lerpColor('#ff0000', '#0000ff', 0.5);
		// Should be somewhere between red and blue
		expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
	});
});

describe('createColorScale', () => {
	it('should create correct number of color steps', () => {
		const result = createColorScale(['#ff0000', '#0000ff'], 5);
		expect(result).toHaveLength(5);
	});

	it('should use default of 10 steps', () => {
		const result = createColorScale(['#ff0000', '#0000ff']);
		expect(result).toHaveLength(10);
	});

	it('should return valid hex colors', () => {
		const result = createColorScale(['#ff0000', '#0000ff'], 3);
		for (const color of result) {
			expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
		}
	});
});

describe('lighten', () => {
	it('should lighten a color', () => {
		const original = '#555555';
		const result = lighten(original, 0.5);
		// Result should be a valid hex
		expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
	});
});

describe('darken', () => {
	it('should darken a color', () => {
		const original = '#aaaaaa';
		const result = darken(original, 0.5);
		expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
	});
});

describe('hasContrast', () => {
	it('should return true for high contrast colors', () => {
		expect(hasContrast('#ffffff', '#000000')).toBe(true);
	});

	it('should return false for low contrast colors', () => {
		expect(hasContrast('#888888', '#999999')).toBe(false);
	});
});

describe('getContrastingText', () => {
	it('should return black for light backgrounds', () => {
		expect(getContrastingText('#ffffff')).toBe('#000000');
	});

	it('should return white for dark backgrounds', () => {
		expect(getContrastingText('#000000')).toBe('#ffffff');
	});
});

describe('MOODS configuration', () => {
	it('should have at least one mood', () => {
		expect(MOODS.length).toBeGreaterThan(0);
	});

	it('should have valid hex colors for all moods', () => {
		for (const mood of MOODS) {
			expect(mood.color).toMatch(/^#[0-9a-fA-F]{6}$/);
		}
	});
});
