/**
 * GPU Particle System
 * Manages 50K particles using GPGPU compute with Three.js
 */

import * as THREE from 'three';
import {
	FBO_CAPACITY,
	FBO_SIZE,
	PALETTE_ARRAY,
	SPHERE_CONFIG,
	TOTAL_PARTICLES,
} from '../constants';
import type { BreathState, ColourIndex, WordFormationState } from '../types';
import {
	createOriginalPositionData,
	createPositionData,
	hexToRgb,
} from './particleUtils';
import { renderFragmentShader, renderVertexShader } from './render.glsl';
import {
	simulationFragmentShader,
	simulationVertexShader,
} from './simulation.glsl';

export interface GPUParticleSystemOptions {
	gl: THREE.WebGLRenderer;
}

export interface GPUParticleSystemState {
	userParticleCounts: Record<number, number>; // colourIndex -> count
	totalUserParticles: number;
	scaffoldCount: number;
}

export class GPUParticleSystem {
	private gl: THREE.WebGLRenderer;

	// FBO textures for GPGPU
	private positionTargetA!: THREE.WebGLRenderTarget;
	private positionTargetB!: THREE.WebGLRenderTarget;
	private currentTarget: number = 0;

	// Data textures
	private positionTexture!: THREE.DataTexture;
	private originalPositionTexture!: THREE.DataTexture;
	private recruitmentTexture!: THREE.DataTexture;

	// Materials
	private simulationMaterial!: THREE.ShaderMaterial;
	private renderMaterial!: THREE.ShaderMaterial;

	// Simulation scene
	private simulationScene!: THREE.Scene;
	private simulationCamera!: THREE.OrthographicCamera;

	// Particle geometry
	private geometry!: THREE.BufferGeometry;
	private points!: THREE.Points;

	// State
	private state: GPUParticleSystemState;

	constructor(options: GPUParticleSystemOptions) {
		this.gl = options.gl;
		this.state = {
			userParticleCounts: {},
			totalUserParticles: 0,
			scaffoldCount: TOTAL_PARTICLES,
		};

		// Initialize GPU resources
		this.initFBOs();
		this.initTextures();
		this.initSimulation();
		this.initGeometry();
	}

	private initFBOs(): void {
		const floatType = this.gl.capabilities.isWebGL2
			? THREE.FloatType
			: this.gl.extensions.get('OES_texture_float')
				? THREE.FloatType
				: THREE.HalfFloatType;

		const createTarget = () =>
			new THREE.WebGLRenderTarget(FBO_SIZE, FBO_SIZE, {
				minFilter: THREE.NearestFilter,
				magFilter: THREE.NearestFilter,
				format: THREE.RGBAFormat,
				type: floatType,
				depthBuffer: false,
				stencilBuffer: false,
			});

		this.positionTargetA = createTarget();
		this.positionTargetB = createTarget();
	}

	private initTextures(): void {
		const floatType = this.gl.capabilities.isWebGL2
			? THREE.FloatType
			: THREE.HalfFloatType;

		// Position data (Fibonacci sphere distribution)
		const positionData = createPositionData(TOTAL_PARTICLES, FBO_SIZE);
		this.positionTexture = new THREE.DataTexture(
			positionData,
			FBO_SIZE,
			FBO_SIZE,
			THREE.RGBAFormat,
			floatType,
		);
		this.positionTexture.needsUpdate = true;

		// Original positions (home positions)
		const originalData = createOriginalPositionData(TOTAL_PARTICLES, FBO_SIZE);
		this.originalPositionTexture = new THREE.DataTexture(
			originalData,
			FBO_SIZE,
			FBO_SIZE,
			THREE.RGBAFormat,
			floatType,
		);
		this.originalPositionTexture.needsUpdate = true;

		// Recruitment texture (for word formation)
		const recruitmentData = new Float32Array(FBO_CAPACITY * 4);
		// Initialize to -1 (not recruited)
		for (let i = 0; i < FBO_CAPACITY; i++) {
			recruitmentData[i * 4 + 3] = -1;
		}
		this.recruitmentTexture = new THREE.DataTexture(
			recruitmentData,
			FBO_SIZE,
			FBO_SIZE,
			THREE.RGBAFormat,
			floatType,
		);
		this.recruitmentTexture.needsUpdate = true;
	}

	private initSimulation(): void {
		this.simulationMaterial = new THREE.ShaderMaterial({
			vertexShader: simulationVertexShader,
			fragmentShader: simulationFragmentShader,
			uniforms: {
				uPositions: { value: this.positionTexture },
				uOriginalPositions: { value: this.originalPositionTexture },
				uRecruitmentTargets: { value: this.recruitmentTexture },
				uTime: { value: 0 },
				uEasedProgress: { value: 0 },
				uPhaseType: { value: 0 },
				uSphereRadius: { value: SPHERE_CONFIG.baseRadius },
				uBreathDepth: { value: SPHERE_CONFIG.breathDepth },
				uWordActive: { value: 0 },
				uWordProgress: { value: 0 },
				uLetterCount: { value: 0 },
			},
			defines: {
				resolution: `vec2(${FBO_SIZE}.0, ${FBO_SIZE}.0)`,
			},
		});

		this.simulationScene = new THREE.Scene();
		this.simulationCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

		const quadGeometry = new THREE.PlaneGeometry(2, 2);
		const quadMesh = new THREE.Mesh(quadGeometry, this.simulationMaterial);
		this.simulationScene.add(quadMesh);
	}

	private initGeometry(): void {
		this.geometry = new THREE.BufferGeometry();

		const references = new Float32Array(TOTAL_PARTICLES * 2);
		const sizes = new Float32Array(TOTAL_PARTICLES);
		const phases = new Float32Array(TOTAL_PARTICLES);
		const spawnTimes = new Float32Array(TOTAL_PARTICLES);

		for (let i = 0; i < TOTAL_PARTICLES; i++) {
			// UV reference for position texture lookup
			references[i * 2] = (i % FBO_SIZE) / FBO_SIZE;
			references[i * 2 + 1] = Math.floor(i / FBO_SIZE) / FBO_SIZE;

			// Random size variation
			sizes[i] = 0.8 + Math.random() * 0.8;

			// Random phase offset
			phases[i] = Math.random();

			// Spawn time (0 = original, updated for user particles)
			spawnTimes[i] = 0;
		}

		this.geometry.setAttribute(
			'aReference',
			new THREE.BufferAttribute(references, 2),
		);
		this.geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
		this.geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
		this.geometry.setAttribute(
			'aSpawnTime',
			new THREE.BufferAttribute(spawnTimes, 1),
		);

		// Dummy position attribute (required by Three.js)
		const positions = new Float32Array(TOTAL_PARTICLES * 3);
		this.geometry.setAttribute(
			'position',
			new THREE.BufferAttribute(positions, 3),
		);

		// Palette as uniform array
		const paletteVec3 = PALETTE_ARRAY.map((hex) => {
			const [r, g, b] = hexToRgb(hex);
			return new THREE.Vector3(r, g, b);
		});

		this.renderMaterial = new THREE.ShaderMaterial({
			vertexShader: renderVertexShader,
			fragmentShader: renderFragmentShader,
			uniforms: {
				uPositions: { value: this.positionTexture },
				uTime: { value: 0 },
				uPhaseType: { value: 0 },
				uTemperatureShift: { value: 0 },
				uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
				uPalette: { value: paletteVec3 },
				uSparkActive: { value: 0 },
				uSparkTime: { value: 0 },
			},
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			depthTest: true,
		});

		this.points = new THREE.Points(this.geometry, this.renderMaterial);
	}

	/**
	 * Run one simulation step
	 */
	compute(
		time: number,
		breathState: BreathState,
		wordState?: WordFormationState,
	): void {
		// Update simulation uniforms
		const simUniforms = this.simulationMaterial.uniforms;
		simUniforms.uTime.value = time;
		simUniforms.uEasedProgress.value = breathState.easedProgress;
		simUniforms.uPhaseType.value = breathState.phaseTypeNumber;

		// Word formation
		if (wordState?.isActive) {
			simUniforms.uWordActive.value = 1;
			simUniforms.uWordProgress.value = wordState.progress;
			simUniforms.uLetterCount.value = wordState.word.length;
		} else {
			simUniforms.uWordActive.value = 0;
		}

		// Ping-pong between FBOs
		const readTarget =
			this.currentTarget === 0 ? this.positionTargetA : this.positionTargetB;
		const writeTarget =
			this.currentTarget === 0 ? this.positionTargetB : this.positionTargetA;

		simUniforms.uPositions.value =
			this.currentTarget === 0 && time < 0.1
				? this.positionTexture
				: readTarget.texture;

		this.gl.setRenderTarget(writeTarget);
		this.gl.render(this.simulationScene, this.simulationCamera);
		this.gl.setRenderTarget(null);

		this.currentTarget = 1 - this.currentTarget;

		// Update render material
		this.renderMaterial.uniforms.uPositions.value = writeTarget.texture;
		this.renderMaterial.uniforms.uTime.value = time;
		this.renderMaterial.uniforms.uPhaseType.value = breathState.phaseTypeNumber;
	}

	/**
	 * Update temperature shift for color effect
	 */
	setTemperatureShift(value: number): void {
		this.renderMaterial.uniforms.uTemperatureShift.value = value;
	}

	/**
	 * Set sphere radius (for config changes)
	 */
	setSphereRadius(radius: number, breathDepth: number): void {
		this.simulationMaterial.uniforms.uSphereRadius.value = radius;
		this.simulationMaterial.uniforms.uBreathDepth.value = breathDepth;
	}

	/**
	 * Spawn user particles with optional spark effect
	 */
	spawnUserParticles(
		colourIndex: ColourIndex,
		count: number,
		spark = true,
	): void {
		// Find available scaffold particles
		// This would need access to the position data - simplified for now
		const currentTime = performance.now() / 1000;

		if (spark) {
			this.renderMaterial.uniforms.uSparkActive.value = 1;
			this.renderMaterial.uniforms.uSparkTime.value = currentTime;
		}

		// Update state
		this.state.userParticleCounts[colourIndex] =
			(this.state.userParticleCounts[colourIndex] || 0) + count;
		this.state.totalUserParticles += count;
		this.state.scaffoldCount -= count;
	}

	/**
	 * Despawn user particles
	 */
	despawnUserParticles(colourIndex: ColourIndex, count: number): void {
		const current = this.state.userParticleCounts[colourIndex] || 0;
		const toRemove = Math.min(current, count);

		this.state.userParticleCounts[colourIndex] = current - toRemove;
		this.state.totalUserParticles -= toRemove;
		this.state.scaffoldCount += toRemove;
	}

	/**
	 * Update recruitment texture for word formation
	 */
	updateRecruitmentTexture(data: Float32Array): void {
		const image = this.recruitmentTexture.image as { data: Float32Array };
		image.data.set(data);
		this.recruitmentTexture.needsUpdate = true;
	}

	/**
	 * Get the Points mesh for adding to scene
	 */
	getPoints(): THREE.Points {
		return this.points;
	}

	/**
	 * Get current state
	 */
	getState(): GPUParticleSystemState {
		return { ...this.state };
	}

	/**
	 * Cleanup GPU resources
	 */
	dispose(): void {
		this.positionTargetA.dispose();
		this.positionTargetB.dispose();
		this.positionTexture.dispose();
		this.originalPositionTexture.dispose();
		this.recruitmentTexture.dispose();
		this.simulationMaterial.dispose();
		this.renderMaterial.dispose();
		this.geometry.dispose();
	}
}
