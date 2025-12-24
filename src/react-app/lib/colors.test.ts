import { describe, expect, it } from 'vitest';
import { BASE_COLORS, getMoodColor, MOODS } from './colors';

describe('getMoodColor', () => {
	it('should return correct color for mood ID', () => {
		const result = getMoodColor('moment');
		expect(result).toBe('#7EC8D4'); // Soft Cyan
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
