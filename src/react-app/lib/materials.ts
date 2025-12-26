/**
 * Material Factory
 *
 * Centralized creation of Three.js shader materials.
 * Separates material configuration from component logic.
 */
import * as THREE from 'three';
import {
	userParticleFragmentShader,
	userParticleVertexShader,
} from '../shaders';

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
