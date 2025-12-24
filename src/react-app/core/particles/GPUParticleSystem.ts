/**
 * GPUParticleSystem - Manages 50K particles with GPU computation
 * Uses ping-pong render targets for position simulation
 */
import * as THREE from 'three';
import type { BreathState } from '../breath';
import {
	BASE_SPHERE_RADIUS,
	BREATH_DEPTH,
	FBO_SIZE,
	getPaletteUniform,
	TOTAL_PARTICLES,
} from './constants';
import { initializeParticleTextures } from './particleUtils';
import { renderFragmentShader } from './render.frag';
import { renderVertexShader } from './render.vert';
import {
	simulationFragmentShader,
	simulationVertexShader,
} from './simulation.glsl';

export interface GPUParticleSystemConfig {
	gl: THREE.WebGLRenderer;
}

export class GPUParticleSystem {
	private gl: THREE.WebGLRenderer;

	// Ping-pong render targets
	private positionTargetA: THREE.WebGLRenderTarget;
	private positionTargetB: THREE.WebGLRenderTarget;
	private currentTarget = 0;

	// Textures
	private positionTexture: THREE.DataTexture;
	private originalPositionTexture: THREE.DataTexture;
	private colorTexture: THREE.DataTexture;

	// Simulation
	private simulationMaterial: THREE.ShaderMaterial;
	private simulationScene: THREE.Scene;
	private simulationCamera: THREE.OrthographicCamera;

	// Render
	private geometry: THREE.BufferGeometry;
	private material: THREE.ShaderMaterial;
	public points: THREE.Points;

	// Spawn tracking
	private spawnTime = 0;

	constructor(config: GPUParticleSystemConfig) {
		this.gl = config.gl;

		// Determine float texture type
		const floatType = this.gl.capabilities.isWebGL2
			? THREE.FloatType
			: THREE.HalfFloatType;

		// Create ping-pong render targets
		const targetOptions = {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat,
			type: floatType,
			depthBuffer: false,
			stencilBuffer: false,
		};

		this.positionTargetA = new THREE.WebGLRenderTarget(
			FBO_SIZE,
			FBO_SIZE,
			targetOptions,
		);
		this.positionTargetB = new THREE.WebGLRenderTarget(
			FBO_SIZE,
			FBO_SIZE,
			targetOptions,
		);

		// Initialize particle data
		const particleData = initializeParticleTextures();

		// Create data textures
		this.positionTexture = new THREE.DataTexture(
			particleData.positions,
			FBO_SIZE,
			FBO_SIZE,
			THREE.RGBAFormat,
			floatType,
		);
		this.positionTexture.needsUpdate = true;

		this.originalPositionTexture = new THREE.DataTexture(
			particleData.positions.slice(), // Clone for original positions
			FBO_SIZE,
			FBO_SIZE,
			THREE.RGBAFormat,
			floatType,
		);
		this.originalPositionTexture.needsUpdate = true;

		this.colorTexture = new THREE.DataTexture(
			particleData.colors,
			FBO_SIZE,
			FBO_SIZE,
			THREE.RGBAFormat,
			floatType,
		);
		this.colorTexture.needsUpdate = true;

		// Setup simulation
		this.simulationMaterial = new THREE.ShaderMaterial({
			vertexShader: simulationVertexShader,
			fragmentShader: simulationFragmentShader,
			uniforms: {
				tPosition: { value: this.positionTexture },
				tOriginalPosition: { value: this.originalPositionTexture },
				uTime: { value: 0 },
				uEasedProgress: { value: 0 },
				uPhaseType: { value: 0 },
				uSphereRadius: { value: BASE_SPHERE_RADIUS },
				uBreathDepth: { value: BREATH_DEPTH },
			},
		});

		this.simulationScene = new THREE.Scene();
		this.simulationCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
		const quadGeometry = new THREE.PlaneGeometry(2, 2);
		const quadMesh = new THREE.Mesh(quadGeometry, this.simulationMaterial);
		this.simulationScene.add(quadMesh);

		// Setup render geometry and material
		this.geometry = this.createParticleGeometry();
		this.material = this.createParticleMaterial();
		this.points = new THREE.Points(this.geometry, this.material);
	}

	private createParticleGeometry(): THREE.BufferGeometry {
		const geometry = new THREE.BufferGeometry();

		// Create references (UV coordinates for texture lookup)
		const references = new Float32Array(TOTAL_PARTICLES * 2);
		const sizes = new Float32Array(TOTAL_PARTICLES);
		const randomSeeds = new Float32Array(TOTAL_PARTICLES);

		for (let i = 0; i < TOTAL_PARTICLES; i++) {
			const x = (i % FBO_SIZE) / FBO_SIZE;
			const y = Math.floor(i / FBO_SIZE) / FBO_SIZE;

			references[i * 2] = x;
			references[i * 2 + 1] = y;

			sizes[i] = 0.8 + Math.random() * 0.4;
			randomSeeds[i] = Math.random();
		}

		geometry.setAttribute(
			'aReference',
			new THREE.BufferAttribute(references, 2),
		);
		geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
		geometry.setAttribute(
			'aRandomSeed',
			new THREE.BufferAttribute(randomSeeds, 1),
		);

		// Dummy position attribute (required by Three.js)
		const positions = new Float32Array(TOTAL_PARTICLES * 3);
		geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

		return geometry;
	}

	private createParticleMaterial(): THREE.ShaderMaterial {
		const palette = getPaletteUniform();
		const paletteVec3Array: THREE.Vector3[] = [];
		for (let i = 0; i < 6; i++) {
			paletteVec3Array.push(
				new THREE.Vector3(
					palette[i * 3],
					palette[i * 3 + 1],
					palette[i * 3 + 2],
				),
			);
		}

		return new THREE.ShaderMaterial({
			vertexShader: renderVertexShader,
			fragmentShader: renderFragmentShader,
			uniforms: {
				tPosition: { value: this.positionTexture },
				tColor: { value: this.colorTexture },
				uTime: { value: 0 },
				uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
				uSpawnTime: { value: 0 },
				uTemperatureShift: { value: 0 },
				uPalette: { value: paletteVec3Array },
			},
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			depthTest: true,
		});
	}

	/**
	 * Run simulation step
	 */
	compute(time: number, breathState: BreathState): void {
		// Update simulation uniforms
		const simUniforms = this.simulationMaterial.uniforms;
		simUniforms.uTime.value = time;
		simUniforms.uEasedProgress.value = breathState.easedProgress;
		simUniforms.uPhaseType.value = breathState.phaseType;

		// Ping-pong: read from one target, write to other
		const readTarget =
			this.currentTarget === 0 ? this.positionTargetA : this.positionTargetB;
		const writeTarget =
			this.currentTarget === 0 ? this.positionTargetB : this.positionTargetA;

		// First frame uses initial texture
		simUniforms.tPosition.value =
			time < 0.1 ? this.positionTexture : readTarget.texture;

		// Render simulation
		this.gl.setRenderTarget(writeTarget);
		this.gl.render(this.simulationScene, this.simulationCamera);
		this.gl.setRenderTarget(null);

		// Swap targets
		this.currentTarget = 1 - this.currentTarget;

		// Update render material
		const renderUniforms = this.material.uniforms;
		renderUniforms.tPosition.value = writeTarget.texture;
		renderUniforms.uTime.value = time;
		renderUniforms.uTemperatureShift.value = breathState.temperature;
		renderUniforms.uSpawnTime.value = this.spawnTime;
	}

	/**
	 * Spawn user particles with spark effect
	 */
	spawnUserParticles(_colorIndex: number, _count: number): void {
		this.spawnTime = performance.now() / 1000;
		// TODO: Update position texture to mark particles with new color type
		// This would require reading back the texture, modifying it, and re-uploading
		// For now, we'll handle this in a future update with user sync
	}

	/**
	 * Despawn user particles
	 */
	despawnUserParticles(_colorIndex: number, _count: number): void {
		// TODO: Similar to spawn - mark particles as scaffold again
	}

	/**
	 * Cleanup GPU resources
	 */
	dispose(): void {
		this.positionTargetA.dispose();
		this.positionTargetB.dispose();
		this.positionTexture.dispose();
		this.originalPositionTexture.dispose();
		this.colorTexture.dispose();
		this.simulationMaterial.dispose();
		this.geometry.dispose();
		this.material.dispose();
	}
}
