import { describe, expect, it } from 'vitest';
import {
	AVATARS,
	BASE_COLORS,
	getAvatarGradient,
	getMoodColor,
	MOODS,
} from './colors';

describe('getAvatarGradient', () => {
	it('should return gradient for valid avatar ID', () => {
		const result = getAvatarGradient('teal');
		expect(result).toContain('linear-gradient');
		expect(result).toContain('#7EB5C1');
		expect(result).toContain('#5A9BAA');
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
		expect(result).toBe('#7EB5C1');
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
