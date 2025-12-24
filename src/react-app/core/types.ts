/**
 * TypeScript interfaces for the particle system
 */

import type { ParticleType } from './constants';

// Re-export ParticleType
export type { ParticleType };

// Phase types for breathing
export type PhaseType = 'inhale' | 'hold-full' | 'exhale' | 'hold-empty';
export type PhaseTypeNumber = 0 | 1 | 2 | 3; // 0=inhale, 1=hold-full, 2=exhale, 3=hold-empty

// Breath state from UTC sync
export interface BreathState {
	phase: PhaseType;
	phaseProgress: number; // 0-1 within current phase
	easedProgress: number; // With bezier easing applied
	cycleProgress: number; // 0-1 within entire cycle
	phaseTypeNumber: PhaseTypeNumber;
}

// Breath preset configuration
export interface BreathPreset {
	inhale: number;
	holdFull: number;
	exhale: number;
	holdEmpty: number;
	total: number;
}

// User sync payload from server
export interface UserSyncPayload {
	colours: Record<number, number>; // colour index -> count
	total: number;
}

// Per-user colour assignment
export type ColourIndex = 1 | 2 | 3 | 4 | 5; // Matches USER_* types

// Word formation state
export interface WordFormationState {
	isActive: boolean;
	word: string;
	progress: number; // 0-1 across word reveal
	recruitedParticles: Map<number, Vec3>; // particle index -> target position
	startTime: number;
}

// 3D vector
export interface Vec3 {
	x: number;
	y: number;
	z: number;
}

// Glyph data for letter rendering
export interface GlyphData {
	[letter: string]: {
		points: [number, number][]; // Normalized 2D points
		width: number;
	};
}

// GPU uniform values
export interface SimulationUniforms {
	uPositions: { value: THREE.Texture };
	uOriginalPositions: { value: THREE.Texture };
	uTime: { value: number };
	uEasedProgress: { value: number };
	uPhaseType: { value: number };
	uSphereRadius: { value: number };
	uBreathDepth: { value: number };
	// Word formation
	uWordActive: { value: number };
	uWordProgress: { value: number };
	uLetterCount: { value: number };
}

export interface RenderUniforms {
	uPositions: { value: THREE.Texture };
	uTime: { value: number };
	uPhaseType: { value: number };
	uTemperatureShift: { value: number };
	uPixelRatio: { value: number };
	uPalette: { value: THREE.Color[] };
	// Spark effect
	uSparkActive: { value: number };
	uSparkTime: { value: number };
}

// Particle system state
export interface ParticleSystemState {
	scaffoldCount: number;
	userParticles: Map<number, ParticleType>; // particle index -> type
	wordRecruitedIndices: Set<number>;
}

// Spawn/despawn request
export interface ParticleSpawnRequest {
	colourIndex: ColourIndex;
	count: number;
	spark?: boolean;
}

export interface ParticleDespawnRequest {
	colourIndex: ColourIndex;
	count: number;
}

// Import THREE types for uniforms
import type * as THREE from 'three';
