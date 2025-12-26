/**
 * Material Factory
 *
 * Centralized creation of Three.js shader materials.
 * Separates material configuration from component logic.
 */
import * as THREE from 'three';
import {
	glowFragmentShader,
	glowVertexShader,
	sphereFragmentShader,
	sphereVertexShader,
	userParticleFragmentShader,
	userParticleVertexShader,
} from '../shaders';
import { SPHERE_PHASE_COLORS } from './colors';

/**
 * Creates the central breathing sphere material
 * Soft transparent shader with phase-specific coloring
 */
export function createSphereMaterial(): THREE.ShaderMaterial {
	return new THREE.ShaderMaterial({
		vertexShader: sphereVertexShader,
		fragmentShader: sphereFragmentShader,
		uniforms: {
			uTime: { value: 0 },
			uBreathPhase: { value: 0 },
			uPhaseType: { value: 0 },
			uColorTemperature: { value: 0 },
			uCrystallization: { value: 0 },
			uColor1: { value: new THREE.Color(0x1a2a3a) },
			uColor2: { value: new THREE.Color(0x2a3a4a) },
			// Phase-specific hue colors (darker/muted versions for sphere fill)
			uInhaleHue: { value: new THREE.Color(0.25, 0.42, 0.52) },
			uHoldInHue: { value: new THREE.Color(0.28, 0.45, 0.5) },
			uExhaleHue: { value: new THREE.Color(0.3, 0.42, 0.52) },
			uHoldOutHue: { value: new THREE.Color(0.22, 0.38, 0.48) },
		},
		transparent: true,
		side: THREE.FrontSide,
		depthWrite: false,
	});
}

/**
 * Creates the outer glow material for the breathing sphere
 * Uses fresnel effect with phase-specific coloring
 */
export function createGlowMaterial(): THREE.ShaderMaterial {
	const { inhale, holdIn, exhale, holdOut } = SPHERE_PHASE_COLORS;

	return new THREE.ShaderMaterial({
		vertexShader: glowVertexShader,
		fragmentShader: glowFragmentShader,
		uniforms: {
			uBreathPhase: { value: 0 },
			uPhaseType: { value: 0 },
			uTime: { value: 0 },
			uInhaleColor: { value: new THREE.Color(inhale.r, inhale.g, inhale.b) },
			uHoldInColor: { value: new THREE.Color(holdIn.r, holdIn.g, holdIn.b) },
			uExhaleColor: { value: new THREE.Color(exhale.r, exhale.g, exhale.b) },
			uHoldOutColor: { value: new THREE.Color(holdOut.r, holdOut.g, holdOut.b) },
		},
		transparent: true,
		side: THREE.BackSide,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
	});
}

/**
 * Creates the user particle material
 * Renders GPGPU particles with mood colors
 */
export function createUserParticleMaterial(
	positionTexture: THREE.Texture,
	totalUsers: number,
): THREE.ShaderMaterial {
	return new THREE.ShaderMaterial({
		vertexShader: userParticleVertexShader,
		fragmentShader: userParticleFragmentShader,
		uniforms: {
			uPositions: { value: positionTexture },
			uTime: { value: 0 },
			uBreathPhase: { value: 0 },
			uPhaseType: { value: 0 },
			uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
			uCrystallization: { value: 0 },
			uUserCount: { value: totalUsers },
		},
		transparent: true,
		blending: THREE.AdditiveBlending,
		depthWrite: false,
		depthTest: true,
	});
}

/**
 * Update sphere material uniforms from breath data
 */
export function updateSphereMaterialUniforms(
	material: THREE.ShaderMaterial,
	breathPhase: number,
	phaseType: number,
	colorTemperature: number,
	crystallization: number,
	time: number,
): void {
	const uniforms = material.uniforms;
	uniforms.uTime.value = time;
	uniforms.uBreathPhase.value = breathPhase;
	uniforms.uPhaseType.value = phaseType;
	uniforms.uColorTemperature.value = colorTemperature;
	uniforms.uCrystallization.value = crystallization;
}

/**
 * Update glow material uniforms from breath data
 */
export function updateGlowMaterialUniforms(
	material: THREE.ShaderMaterial,
	breathPhase: number,
	phaseType: number,
	time: number,
): void {
	const uniforms = material.uniforms;
	uniforms.uBreathPhase.value = breathPhase;
	uniforms.uPhaseType.value = phaseType;
	uniforms.uTime.value = time;
}

/**
 * Update user particle material uniforms from breath data
 */
export function updateUserParticleMaterialUniforms(
	material: THREE.ShaderMaterial,
	positionTexture: THREE.Texture,
	breathPhase: number,
	phaseType: number,
	crystallization: number,
	totalUsers: number,
	time: number,
): void {
	const uniforms = material.uniforms;
	uniforms.uPositions.value = positionTexture;
	uniforms.uTime.value = time;
	uniforms.uBreathPhase.value = breathPhase;
	uniforms.uPhaseType.value = phaseType;
	uniforms.uCrystallization.value = crystallization;
	uniforms.uUserCount.value = totalUsers;
}
