/**
 * Breathing pattern presets
 * Re-exports from constants for convenient access
 */

import { BREATH_PRESETS, type BreathPresetId } from '../constants';
import type { BreathPreset } from '../types';

export type { BreathPresetId } from '../constants';
export { BREATH_PRESETS } from '../constants';

/**
 * Get preset by ID
 */
export function getPreset(id: BreathPresetId): BreathPreset {
	return BREATH_PRESETS[id];
}

/**
 * Get all available presets
 */
export function getAllPresets(): Record<BreathPresetId, BreathPreset> {
	return BREATH_PRESETS;
}

/**
 * Preset display names
 */
export const PRESET_NAMES: Record<BreathPresetId, string> = {
	box: 'Box Breathing (4-4-4-4)',
	diaphragmatic: 'Diaphragmatic (4-6)',
	relaxing: '4-7-8 Relaxation',
};

/**
 * Preset descriptions
 */
export const PRESET_DESCRIPTIONS: Record<BreathPresetId, string> = {
	box: 'Navy SEAL technique for calm focus',
	diaphragmatic: 'Natural breathing rhythm',
	relaxing: 'Dr. Andrew Weil technique for sleep',
};
