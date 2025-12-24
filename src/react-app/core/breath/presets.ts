/**
 * Breathing pattern presets
 * All patterns are synchronized globally via UTC time
 */

export interface BreathPreset {
	id: string;
	name: string;
	description: string;
	inhale: number; // seconds
	holdFull: number; // seconds (after inhale)
	exhale: number; // seconds
	holdEmpty: number; // seconds (after exhale)
	totalDuration: number; // computed sum
}

export const BREATH_PRESETS = {
	box: {
		id: 'box',
		name: 'Box Breathing',
		description: 'Equal 4-second phases. Used by Navy SEALs for calm focus.',
		inhale: 4,
		holdFull: 4,
		exhale: 4,
		holdEmpty: 4,
		totalDuration: 16,
	},
	diaphragmatic: {
		id: 'diaphragmatic',
		name: 'Diaphragmatic',
		description: 'Simple in-out pattern for natural, relaxed breathing.',
		inhale: 4,
		holdFull: 0,
		exhale: 6,
		holdEmpty: 0,
		totalDuration: 10,
	},
	relaxation: {
		id: 'relaxation',
		name: '4-7-8 Relaxation',
		description: "Dr. Andrew Weil's technique for deep relaxation and sleep.",
		inhale: 4,
		holdFull: 7,
		exhale: 8,
		holdEmpty: 0,
		totalDuration: 19,
	},
} satisfies Record<string, BreathPreset>;

export type PresetId = keyof typeof BREATH_PRESETS;
export const DEFAULT_PRESET: PresetId = 'box';
