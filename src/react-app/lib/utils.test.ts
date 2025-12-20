import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn (className utility)', () => {
	it('should merge class names', () => {
		const result = cn('foo', 'bar');
		expect(result).toBe('foo bar');
	});

	it('should handle conditional classes', () => {
		// biome-ignore lint/complexity/useSimplifiedLogicExpression: Testing cn() with conditional class patterns
		const result = cn('base', true && 'truthy', false && 'falsy');
		expect(result).toBe('base truthy');
	});

	it('should merge Tailwind classes correctly', () => {
		const result = cn('px-2 py-1', 'px-4');
		expect(result).toBe('py-1 px-4');
	});

	it('should handle undefined and null values', () => {
		const result = cn('base', undefined, null, 'end');
		expect(result).toBe('base end');
	});

	it('should handle empty input', () => {
		const result = cn();
		expect(result).toBe('');
	});

	it('should handle array of classes', () => {
		const result = cn(['foo', 'bar']);
		expect(result).toBe('foo bar');
	});

	it('should handle object notation', () => {
		const result = cn({ foo: true, bar: false, baz: true });
		expect(result).toBe('foo baz');
	});
});
