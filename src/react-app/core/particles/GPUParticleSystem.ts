/**
 * GPU Particle System using GPUComputationRenderer
 * Manages 50K particles with GPGPU simulation
 */

import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import {
	PALETTE_RGB,
	PARTICLE_TYPE,
	SPHERE,
	TEXTURE_SIZE,
	TOTAL_PARTICLES,
} from '../constants';
import type { Vec3 } from '../types';
import { generateColorData, generateFibonacciSphere } from './particleUtils';
import { renderFragmentShader } from './render.frag';
import { renderVertexShader } from './render.vert';
import { simulationShader } from './simulation.glsl';

export interface GPUParticleSystemOptions {
	renderer: THREE.WebGLRenderer;
}

export class GPUParticleSystem {
	private gpuCompute: GPUComputationRenderer;
	private positionVariable: ReturnType<
		GPUComputationRenderer['addVariable']
	> | null = null;
	private velocityVariable: ReturnType<
		GPUComputationRenderer['addVariable']
	> | null = null;

	private positionTexture: THREE.DataTexture;
	private colorTexture: THREE.DataTexture;
	private velocityTexture: THREE.DataTexture;
	private wordTargetTexture: THREE.DataTexture;

	private pointsGeometry: THREE.BufferGeometry;
	private pointsMaterial: THREE.ShaderMaterial;
	public points: THREE.Points;

	private renderer: THREE.WebGLRenderer;
	private positionData: Float32Array;
	private colorData: Float32Array;

	constructor(options: GPUParticleSystemOptions) {
		this.renderer = options.renderer;

		// Initialize GPUComputationRenderer
		this.gpuCompute = new GPUComputationRenderer(
			TEXTURE_SIZE,
			TEXTURE_SIZE,
			this.renderer,
		);

		// Check for float texture support
		if (!this.renderer.capabilities.isWebGL2) {
			console.warn('WebGL2 not available, falling back to WebGL1');
		}

		// Generate initial data
		this.positionData = generateFibonacciSphere(TOTAL_PARTICLES);
		this.colorData = generateColorData(TOTAL_PARTICLES, this.positionData);

		// Create data textures
		this.positionTexture = this.createDataTexture(this.positionData);
		this.colorTexture = this.createDataTexture(this.colorData);
		this.velocityTexture = this.createDataTexture(
			new Float32Array(TOTAL_PARTICLES * 4),
		);
		this.wordTargetTexture = this.createDataTexture(
			new Float32Array(TOTAL_PARTICLES * 4),
		);

		// Setup GPGPU variables
		this.setupGPGPU();

		// Create renderable points
		this.pointsGeometry = this.createGeometry();
		this.pointsMaterial = this.createMaterial();
		this.points = new THREE.Points(this.pointsGeometry, this.pointsMaterial);
	}

	private createDataTexture(data: Float32Array): THREE.DataTexture {
		const texture = new THREE.DataTexture(
			data,
			TEXTURE_SIZE,
			TEXTURE_SIZE,
			THREE.RGBAFormat,
			THREE.FloatType,
		);
		texture.needsUpdate = true;
		return texture;
	}

	private setupGPGPU(): void {
		// Create position variable
		const positionInit = this.gpuCompute.createTexture();
		if (positionInit.image.data) {
			(positionInit.image.data as Float32Array).set(this.positionData);
		}

		this.positionVariable = this.gpuCompute.addVariable(
			'tPosition',
			simulationShader,
			positionInit,
		);

		// Create velocity variable
		const velocityInit = this.gpuCompute.createTexture();
		this.velocityVariable = this.gpuCompute.addVariable(
			'tVelocity',
			`
        precision highp float;
        uniform sampler2D tVelocity;
        void main() {
          vec2 uv = gl_FragCoord.xy / resolution.xy;
          gl_FragColor = texture2D(tVelocity, uv);
        }
      `,
			velocityInit,
		);

		// Set dependencies
		this.gpuCompute.setVariableDependencies(this.positionVariable, [
			this.positionVariable,
			this.velocityVariable,
		]);
		this.gpuCompute.setVariableDependencies(this.velocityVariable, [
			this.velocityVariable,
		]);

		// Add uniforms to position shader
		const posUniforms = this.positionVariable.material.uniforms;
		posUniforms.tVelocity = { value: null };
		posUniforms.tWordTargets = { value: this.wordTargetTexture };
		posUniforms.uEasedProgress = { value: 0 };
		posUniforms.uPhaseType = { value: 0 };
		posUniforms.uSphereRadius = { value: SPHERE.BASE_RADIUS };
		posUniforms.uBreathDepth = { value: SPHERE.BREATH_DEPTH };
		posUniforms.uTime = { value: 0 };
		posUniforms.uWordProgress = { value: 0 };
		posUniforms.uWordActive = { value: 0 };
		posUniforms.uLetterCount = { value: 0 };

		// Add uniforms to velocity shader
		const velUniforms = this.velocityVariable.material.uniforms;
		velUniforms.tPosition = { value: null };
		velUniforms.uTime = { value: 0 };

		// Initialize computation
		const error = this.gpuCompute.init();
		if (error !== null) {
			console.error('GPUComputationRenderer error:', error);
		}
	}

	private createGeometry(): THREE.BufferGeometry {
		const geometry = new THREE.BufferGeometry();

		// Reference coordinates (UV in texture)
		const references = new Float32Array(TOTAL_PARTICLES * 2);
		const letterIndices = new Float32Array(TOTAL_PARTICLES);

		for (let i = 0; i < TOTAL_PARTICLES; i++) {
			const u = (i % TEXTURE_SIZE) / TEXTURE_SIZE;
			const v = Math.floor(i / TEXTURE_SIZE) / TEXTURE_SIZE;
			references[i * 2] = u;
			references[i * 2 + 1] = v;
			letterIndices[i] = -1; // Not part of any letter
		}

		geometry.setAttribute(
			'aReference',
			new THREE.BufferAttribute(references, 2),
		);
		geometry.setAttribute(
			'aLetterIndex',
			new THREE.BufferAttribute(letterIndices, 1),
		);

		// Dummy position (actual position comes from texture)
		geometry.setAttribute(
			'position',
			new THREE.BufferAttribute(new Float32Array(TOTAL_PARTICLES * 3), 3),
		);

		return geometry;
	}

	private createMaterial(): THREE.ShaderMaterial {
		return new THREE.ShaderMaterial({
			vertexShader: renderVertexShader,
			fragmentShader: renderFragmentShader,
			uniforms: {
				tPosition: { value: null },
				tVelocity: { value: null },
				tColor: { value: this.colorTexture },
				uTime: { value: 0 },
				uBaseSize: { value: 3.0 },
				uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
				uPhaseType: { value: 0 },
				uEasedProgress: { value: 0 },
				uTemperatureShift: { value: 0 },
			},
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			depthTest: true,
		});
	}

	/**
	 * Update simulation and render
	 */
	public compute(): void {
		if (!(this.positionVariable && this.velocityVariable)) return;

		// Run GPU computation
		this.gpuCompute.compute();

		// Update render material with computed textures
		const positionTexture = this.gpuCompute.getCurrentRenderTarget(
			this.positionVariable,
		).texture;
		const velocityTexture = this.gpuCompute.getCurrentRenderTarget(
			this.velocityVariable,
		).texture;

		this.pointsMaterial.uniforms.tPosition.value = positionTexture;
		this.pointsMaterial.uniforms.tVelocity.value = velocityTexture;
	}

	/**
	 * Update uniforms for current frame
	 */
	public update(params: {
		time: number;
		phaseType: number;
		easedProgress: number;
		temperatureShift?: number;
	}): void {
		if (!(this.positionVariable && this.velocityVariable)) return;

		const { time, phaseType, easedProgress, temperatureShift = 0 } = params;

		// Update simulation uniforms
		const posUniforms = this.positionVariable.material.uniforms;
		posUniforms.uTime.value = time;
		posUniforms.uPhaseType.value = phaseType;
		posUniforms.uEasedProgress.value = easedProgress;

		const velUniforms = this.velocityVariable.material.uniforms;
		velUniforms.uTime.value = time;

		// Update render uniforms
		this.pointsMaterial.uniforms.uTime.value = time;
		this.pointsMaterial.uniforms.uPhaseType.value = phaseType;
		this.pointsMaterial.uniforms.uEasedProgress.value = easedProgress;
		this.pointsMaterial.uniforms.uTemperatureShift.value = temperatureShift;
	}

	/**
	 * Spawn user particles with spark effect
	 */
	public spawnUserParticles(
		colourIndex: number,
		count: number,
		_currentTime: number,
	): void {
		// Find scaffold particles to convert
		let spawned = 0;
		for (let i = 0; i < TOTAL_PARTICLES && spawned < count; i++) {
			const typeIdx = i * 4 + 3;
			if (this.positionData[typeIdx] === PARTICLE_TYPE.SCAFFOLD) {
				// Convert to user particle
				this.positionData[typeIdx] = colourIndex;

				// Set spawn time for spark effect
				// (This would need to be synced to GPU texture, simplified here)

				// Set color based on colour index
				const colorIdx = i * 4;
				const rgb = this.getColorForIndex(colourIndex);
				this.colorData[colorIdx] = rgb[0];
				this.colorData[colorIdx + 1] = rgb[1];
				this.colorData[colorIdx + 2] = rgb[2];

				spawned++;
			}
		}

		// Update textures
		this.colorTexture.needsUpdate = true;
	}

	/**
	 * Despawn user particles (fade to scaffold)
	 */
	public despawnUserParticles(colourIndex: number, count: number): void {
		let despawned = 0;
		for (let i = 0; i < TOTAL_PARTICLES && despawned < count; i++) {
			const typeIdx = i * 4 + 3;
			if (this.positionData[typeIdx] === colourIndex) {
				// Convert back to scaffold
				this.positionData[typeIdx] = PARTICLE_TYPE.SCAFFOLD;

				// Reset to scaffold color
				const colorIdx = i * 4;
				this.colorData[colorIdx] = PALETTE_RGB.scaffold[0];
				this.colorData[colorIdx + 1] = PALETTE_RGB.scaffold[1];
				this.colorData[colorIdx + 2] = PALETTE_RGB.scaffold[2];

				despawned++;
			}
		}

		this.colorTexture.needsUpdate = true;
	}

	/**
	 * Set word formation targets
	 */
	public setWordTargets(targets: Map<number, Vec3>, letterCount: number): void {
		if (!this.positionVariable) return;

		const wordTargetData = new Float32Array(TOTAL_PARTICLES * 4);

		targets.forEach((target, particleIndex) => {
			const idx = particleIndex * 4;
			wordTargetData[idx] = target.x;
			wordTargetData[idx + 1] = target.y;
			wordTargetData[idx + 2] = target.z;
			// Store letter index (1-based) to indicate valid target
			wordTargetData[idx + 3] = 1; // Mark as valid

			// Also mark particle as word-recruited
			this.positionData[particleIndex * 4 + 3] = PARTICLE_TYPE.WORD_RECRUITED;
		});

		if (this.wordTargetTexture.image.data) {
			(this.wordTargetTexture.image.data as Float32Array).set(wordTargetData);
		}
		this.wordTargetTexture.needsUpdate = true;

		// Update uniforms
		const posUniforms = this.positionVariable.material.uniforms;
		posUniforms.uWordActive.value = 1.0;
		posUniforms.uLetterCount.value = letterCount;
	}

	/**
	 * Clear word formation
	 */
	public clearWordTargets(): void {
		if (!this.positionVariable) return;

		// Reset word-recruited particles back to scaffold
		for (let i = 0; i < TOTAL_PARTICLES; i++) {
			const typeIdx = i * 4 + 3;
			if (this.positionData[typeIdx] === PARTICLE_TYPE.WORD_RECRUITED) {
				this.positionData[typeIdx] = PARTICLE_TYPE.SCAFFOLD;

				// Reset color
				const colorIdx = i * 4;
				this.colorData[colorIdx] = PALETTE_RGB.scaffold[0];
				this.colorData[colorIdx + 1] = PALETTE_RGB.scaffold[1];
				this.colorData[colorIdx + 2] = PALETTE_RGB.scaffold[2];
			}
		}

		this.colorTexture.needsUpdate = true;

		const posUniforms = this.positionVariable.material.uniforms;
		posUniforms.uWordActive.value = 0.0;
		posUniforms.uWordProgress.value = 0.0;
	}

	/**
	 * Update word reveal progress
	 */
	public setWordProgress(progress: number): void {
		if (!this.positionVariable) return;
		this.positionVariable.material.uniforms.uWordProgress.value = progress;
	}

	private getColorForIndex(index: number): [number, number, number] {
		switch (index) {
			case PARTICLE_TYPE.USER_SAPPHIRE:
				return PALETTE_RGB.sapphire;
			case PARTICLE_TYPE.USER_EMERALD:
				return PALETTE_RGB.emerald;
			case PARTICLE_TYPE.USER_RUBY:
				return PALETTE_RGB.ruby;
			case PARTICLE_TYPE.USER_AMETHYST:
				return PALETTE_RGB.amethyst;
			case PARTICLE_TYPE.USER_TOPAZ:
				return PALETTE_RGB.topaz;
			default:
				return PALETTE_RGB.scaffold;
		}
	}

	/**
	 * Cleanup resources
	 */
	public dispose(): void {
		this.pointsGeometry.dispose();
		this.pointsMaterial.dispose();
		this.positionTexture.dispose();
		this.colorTexture.dispose();
		this.velocityTexture.dispose();
		this.wordTargetTexture.dispose();
		// GPUComputationRenderer doesn't have dispose, but render targets should be cleaned
	}
}
