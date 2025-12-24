/**
 * TypeScript interfaces for the particle system
 */

import type { ParticleType } from './constants';

// Breath phase types matching existing patterns.ts
export type PhaseType = 'inhale' | 'hold-full' | 'exhale' | 'hold-empty';
export type PhaseIndex = 0 | 1 | 2 | 3;

export interface BreathState {
	phase: PhaseType;
	phaseIndex: PhaseIndex;
	phaseProgress: number; // 0-1 within current phase
	easedProgress: number; // Progress with easing applied
	cycleProgress: number; // 0-1 within entire cycle
}

export interface BreathPreset {
	id: string;
	name: string;
	inhale: number; // seconds
	holdFull: number;
	exhale: number;
	holdEmpty: number;
	totalDuration: number;
}

// User sync types
export interface UserSyncPayload {
	colours: Record<number, number>; // colour index -> count
	total: number;
}

export interface UserState {
	colourCounts: Map<number, number>;
	total: number;
}

// Word formation types
export interface GlyphPoint {
	x: number;
	y: number;
}

export interface GlyphData {
	points: GlyphPoint[];
	width: number;
}

export interface GlyphDatabase {
	[letter: string]: GlyphData;
}

export interface WordTarget {
	particleIndex: number;
	targetPosition: { x: number; y: number; z: number };
	letterIndex: number;
}

export interface WordFormationState {
	isActive: boolean;
	word: string;
	targets: WordTarget[];
	progress: number; // 0-1 for word reveal
	startTime: number;
}

// Particle system types
export interface ParticleData {
	index: number;
	type: ParticleType;
	position: { x: number; y: number; z: number };
	originalPosition: { x: number; y: number; z: number };
	spawnTime?: number;
}

// Vec3 helper type
export interface Vec3 {
	x: number;
	y: number;
	z: number;
}
