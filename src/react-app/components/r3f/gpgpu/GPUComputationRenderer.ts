/**
 * GPUComputationRenderer - GPGPU utility for Three.js
 * Based on the three.js examples GPUComputationRenderer
 * Allows running compute shaders on textures for GPU-based physics
 */
import * as THREE from 'three';

export interface GPUVariable {
	name: string;
	initialValueTexture: THREE.DataTexture;
	renderTargets: THREE.WebGLRenderTarget[];
	material: THREE.ShaderMaterial;
	dependencies: GPUVariable[];
	wrapS: number;
	wrapT: number;
	minFilter: number;
	magFilter: number;
}

export class GPUComputationRenderer {
	private renderer: THREE.WebGLRenderer;
	private sizeX: number;
	private sizeY: number;
	private variables: GPUVariable[] = [];
	private currentTextureIndex = 0;
	private scene: THREE.Scene;
	private camera: THREE.OrthographicCamera;
	private passThruUniforms: {
		passThruTexture: { value: THREE.Texture | null };
	};
	private passThruShader: THREE.ShaderMaterial;
	private mesh: THREE.Mesh;

	constructor(sizeX: number, sizeY: number, renderer: THREE.WebGLRenderer) {
		this.sizeX = sizeX;
		this.sizeY = sizeY;
		this.renderer = renderer;

		// Scene and camera for render-to-texture
		this.scene = new THREE.Scene();
		this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

		// Pass-through shader for copying textures
		this.passThruUniforms = { passThruTexture: { value: null } };
		this.passThruShader = this.createShaderMaterial(
			this.getPassThroughVertexShader(),
			this.getPassThroughFragmentShader(),
		);
		this.passThruShader.uniforms = this.passThruUniforms;

		// Full-screen quad
		const geometry = new THREE.PlaneGeometry(2, 2);
		this.mesh = new THREE.Mesh(geometry, this.passThruShader);
		this.scene.add(this.mesh);
	}

	/**
	 * Set data dependencies for a variable
	 */
	setVariableDependencies(
		variable: GPUVariable,
		dependencies: GPUVariable[],
	): void {
		variable.dependencies = dependencies;
	}

	/**
	 * Initialize the computation renderer
	 * Creates render targets and sets up initial textures
	 */
	init(): string | null {
		// Check WebGL capabilities
		if (this.renderer.capabilities.maxVertexTextures === 0) {
			return 'No support for vertex textures';
		}

		// Initialize variables
		for (let i = 0; i < this.variables.length; i++) {
			const variable = this.variables[i];

			// Create 2 render targets for ping-pong
			variable.renderTargets[0] = this.createRenderTarget();
			variable.renderTargets[1] = this.createRenderTarget();

			// Copy initial texture to render targets
			this.renderTexture(
				variable.initialValueTexture,
				variable.renderTargets[0],
			);
			this.renderTexture(
				variable.initialValueTexture,
				variable.renderTargets[1],
			);

			// Set up material uniforms for dependencies
			const material = variable.material;
			const uniforms = material.uniforms;

			// Add dependency textures
			for (let d = 0; d < variable.dependencies.length; d++) {
				const dependency = variable.dependencies[d];
				uniforms[dependency.name] = { value: null };
			}

			// Resolution uniform
			uniforms.resolution = {
				value: new THREE.Vector2(this.sizeX, this.sizeY),
			};
		}

		return null;
	}

	/**
	 * Create a compute variable with initial data and shader
	 */
	addVariable(
		variableName: string,
		computeFragmentShader: string,
		initialValueTexture: THREE.DataTexture,
	): GPUVariable {
		const material = this.createShaderMaterial(
			this.getPassThroughVertexShader(),
			computeFragmentShader,
		);

		const variable: GPUVariable = {
			name: variableName,
			initialValueTexture,
			renderTargets: [],
			material,
			dependencies: [],
			wrapS: THREE.ClampToEdgeWrapping,
			wrapT: THREE.ClampToEdgeWrapping,
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
		};

		this.variables.push(variable);
		return variable;
	}

	/**
	 * Run one compute pass for all variables
	 */
	compute(): void {
		const currentIndex = this.currentTextureIndex;
		const nextIndex = this.currentTextureIndex === 0 ? 1 : 0;

		for (let i = 0; i < this.variables.length; i++) {
			const variable = this.variables[i];
			const uniforms = variable.material.uniforms;

			// Set dependency textures to current values
			for (let d = 0; d < variable.dependencies.length; d++) {
				const dependency = variable.dependencies[d];
				uniforms[dependency.name].value =
					dependency.renderTargets[currentIndex].texture;
			}

			// Render to next target
			this.doRenderTarget(variable.material, variable.renderTargets[nextIndex]);
		}

		this.currentTextureIndex = nextIndex;
	}

	/**
	 * Get current texture for a variable (for use in render shaders)
	 */
	getCurrentRenderTarget(variable: GPUVariable): THREE.WebGLRenderTarget {
		return variable.renderTargets[this.currentTextureIndex];
	}

	/**
	 * Get alternate texture for a variable
	 */
	getAlternateRenderTarget(variable: GPUVariable): THREE.WebGLRenderTarget {
		return variable.renderTargets[this.currentTextureIndex === 0 ? 1 : 0];
	}

	/**
	 * Create a DataTexture with initial values
	 */
	createTexture(): THREE.DataTexture {
		const data = new Float32Array(this.sizeX * this.sizeY * 4);
		const texture = new THREE.DataTexture(
			data,
			this.sizeX,
			this.sizeY,
			THREE.RGBAFormat,
			THREE.FloatType,
		);
		texture.needsUpdate = true;
		return texture;
	}

	/**
	 * Dispose of all resources
	 */
	dispose(): void {
		for (const variable of this.variables) {
			variable.renderTargets[0]?.dispose();
			variable.renderTargets[1]?.dispose();
			variable.material.dispose();
			variable.initialValueTexture.dispose();
		}
		this.passThruShader.dispose();
		this.mesh.geometry.dispose();
	}

	private createRenderTarget(): THREE.WebGLRenderTarget {
		return new THREE.WebGLRenderTarget(this.sizeX, this.sizeY, {
			wrapS: THREE.ClampToEdgeWrapping,
			wrapT: THREE.ClampToEdgeWrapping,
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			depthBuffer: false,
		});
	}

	private createShaderMaterial(
		vertexShader: string,
		fragmentShader: string,
	): THREE.ShaderMaterial {
		return new THREE.ShaderMaterial({
			uniforms: {},
			vertexShader,
			fragmentShader,
		});
	}

	private renderTexture(
		input: THREE.Texture,
		output: THREE.WebGLRenderTarget,
	): void {
		this.passThruUniforms.passThruTexture.value = input;
		this.doRenderTarget(this.passThruShader, output);
		this.passThruUniforms.passThruTexture.value = null;
	}

	private doRenderTarget(
		material: THREE.ShaderMaterial,
		output: THREE.WebGLRenderTarget,
	): void {
		this.mesh.material = material;
		this.renderer.setRenderTarget(output);
		this.renderer.render(this.scene, this.camera);
		this.renderer.setRenderTarget(null);
	}

	private getPassThroughVertexShader(): string {
		return `
			void main() {
				gl_Position = vec4(position, 1.0);
			}
		`;
	}

	private getPassThroughFragmentShader(): string {
		return `
			uniform sampler2D passThruTexture;
			uniform vec2 resolution;

			void main() {
				vec2 uv = gl_FragCoord.xy / resolution.xy;
				gl_FragColor = texture2D(passThruTexture, uv);
			}
		`;
	}
}
