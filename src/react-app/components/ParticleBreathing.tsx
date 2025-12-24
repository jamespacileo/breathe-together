import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { BreathState } from '../hooks/useBreathSync';
import type { VisualizationConfig } from '../lib/config';

interface ParticleBreathingProps {
	breathState: BreathState;
	config: VisualizationConfig;
}

/**
 * Three.js particle breathing visualization
 * Uses UTC-synchronized breathing from useBreathSync hook
 */
export function ParticleBreathing({
	breathState,
	config: _config,
}: ParticleBreathingProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const animationRef = useRef<number | null>(null);
	const sceneRef = useRef<{
		scene: THREE.Scene;
		camera: THREE.PerspectiveCamera;
		renderer: THREE.WebGLRenderer;
		particles: THREE.Points;
		geometry: THREE.BufferGeometry;
		material: THREE.ShaderMaterial;
		glowSphere: THREE.Mesh;
		glowMaterial: THREE.MeshBasicMaterial;
		originalPositions: Float32Array;
		phases: Float32Array;
	} | null>(null);
	const breathStateRef = useRef(breathState);

	// Keep breath state ref updated for animation loop
	useEffect(() => {
		breathStateRef.current = breathState;
	}, [breathState]);

	useEffect(() => {
		if (!containerRef.current) return;

		// Scene setup
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(0x0a0a12);

		const camera = new THREE.PerspectiveCamera(
			60,
			containerRef.current.clientWidth / containerRef.current.clientHeight,
			0.1,
			1000,
		);
		camera.position.z = 50;

		const renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(
			containerRef.current.clientWidth,
			containerRef.current.clientHeight,
		);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		containerRef.current.appendChild(renderer.domElement);

		// Avatar/mood color palette
		const colorPalette = [
			new THREE.Color(0x4ecdc4), // Teal
			new THREE.Color(0xff6b6b), // Coral
			new THREE.Color(0xffe66d), // Yellow
			new THREE.Color(0x95e1d3), // Mint
			new THREE.Color(0xf38181), // Salmon
			new THREE.Color(0xaa96da), // Lavender
			new THREE.Color(0xfcbad3), // Pink
			new THREE.Color(0xa8d8ea), // Sky blue
			new THREE.Color(0xf9f871), // Lemon
			new THREE.Color(0x88d8b0), // Seafoam
			new THREE.Color(0xffaaa5), // Peach
			new THREE.Color(0xb5e2fa), // Light blue
			new THREE.Color(0xdcedc2), // Pale green
			new THREE.Color(0xffd3b5), // Apricot
			new THREE.Color(0xc9b1ff), // Lilac
		];

		// Particle system
		const particleCount = 3000;
		const geometry = new THREE.BufferGeometry();

		const positions = new Float32Array(particleCount * 3);
		const originalPositions = new Float32Array(particleCount * 3);
		const colors = new Float32Array(particleCount * 3);
		const phases = new Float32Array(particleCount);
		const sizes = new Float32Array(particleCount);

		// Initialize particles in a spherical distribution
		for (let i = 0; i < particleCount; i++) {
			const i3 = i * 3;

			// Random spherical distribution
			const radius = 8 + Math.random() * 12;
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.acos(2 * Math.random() - 1);

			positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
			positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
			positions[i3 + 2] = radius * Math.cos(phi);

			originalPositions[i3] = positions[i3];
			originalPositions[i3 + 1] = positions[i3 + 1];
			originalPositions[i3 + 2] = positions[i3 + 2];

			// Assign random color from palette
			const color =
				colorPalette[Math.floor(Math.random() * colorPalette.length)];
			colors[i3] = color.r;
			colors[i3 + 1] = color.g;
			colors[i3 + 2] = color.b;

			phases[i] = Math.random() * Math.PI * 2;
			sizes[i] = 0.5 + Math.random() * 1.5;
		}

		geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
		geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

		// Shader material for particles with color and breath-based brightness
		const vertexShader = `
      attribute float size;
      attribute vec3 color;

      uniform float breathPhase;
      uniform float phaseType; // 0=in, 1=hold-in, 2=out, 3=hold-out

      varying vec3 vColor;
      varying float vAlpha;
      varying float vBreathPhase;
      varying float vPhaseType;

      void main() {
        vColor = color;
        vBreathPhase = breathPhase;
        vPhaseType = phaseType;

        // Brighter on inhale (breathPhase = 1), more transparent on exhale (breathPhase = 0)
        vAlpha = 0.4 + breathPhase * 0.5;

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

		const fragmentShader = `
      varying vec3 vColor;
      varying float vAlpha;
      varying float vBreathPhase;
      varying float vPhaseType;

      // RGB to HSL conversion
      vec3 rgb2hsl(vec3 c) {
        float maxC = max(max(c.r, c.g), c.b);
        float minC = min(min(c.r, c.g), c.b);
        float l = (maxC + minC) / 2.0;
        float s = 0.0;
        float h = 0.0;

        if (maxC != minC) {
          float d = maxC - minC;
          s = l > 0.5 ? d / (2.0 - maxC - minC) : d / (maxC + minC);

          if (maxC == c.r) {
            h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
          } else if (maxC == c.g) {
            h = (c.b - c.r) / d + 2.0;
          } else {
            h = (c.r - c.g) / d + 4.0;
          }
          h /= 6.0;
        }

        return vec3(h, s, l);
      }

      // HSL to RGB conversion
      float hue2rgb(float p, float q, float t) {
        if (t < 0.0) t += 1.0;
        if (t > 1.0) t -= 1.0;
        if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
        if (t < 1.0/2.0) return q;
        if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
        return p;
      }

      vec3 hsl2rgb(vec3 hsl) {
        float h = hsl.x;
        float s = hsl.y;
        float l = hsl.z;

        if (s == 0.0) {
          return vec3(l);
        }

        float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
        float p = 2.0 * l - q;

        return vec3(
          hue2rgb(p, q, h + 1.0/3.0),
          hue2rgb(p, q, h),
          hue2rgb(p, q, h - 1.0/3.0)
        );
      }

      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;

        float alpha = smoothstep(0.5, 0.1, dist) * vAlpha;

        // Convert to HSL for subtle hue shifting
        vec3 hsl = rgb2hsl(vColor);

        // Subtle hue shifts based on breathing phase (barely noticeable)
        // Inhale (phaseType 0): slight warm shift (+0.02 hue, toward yellow/orange)
        // Hold-in (phaseType 1): slight golden warmth (+0.01 hue)
        // Exhale (phaseType 2): slight cool shift (-0.02 hue, toward blue/purple)
        // Hold-out (phaseType 3): slight deep cool (-0.01 hue)
        float hueShift = 0.0;
        if (vPhaseType < 0.5) {
          hueShift = 0.015; // inhale - warm
        } else if (vPhaseType < 1.5) {
          hueShift = 0.008; // hold-in - gentle warm
        } else if (vPhaseType < 2.5) {
          hueShift = -0.015; // exhale - cool
        } else {
          hueShift = -0.008; // hold-out - gentle cool
        }

        hsl.x = mod(hsl.x + hueShift, 1.0);

        // Subtle saturation boost during inhale, slight desaturation during exhale
        hsl.y = clamp(hsl.y + (vBreathPhase - 0.5) * 0.08, 0.0, 1.0);

        vec3 color = hsl2rgb(hsl);

        // Add brightness boost on inhale
        float brightness = 1.0 + vBreathPhase * 0.4;
        color *= brightness;

        // Add slight glow in center
        color += vec3(0.1) * (1.0 - dist * 2.0) * vBreathPhase;

        gl_FragColor = vec4(color, alpha);
      }
    `;

		const material = new THREE.ShaderMaterial({
			vertexShader,
			fragmentShader,
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			uniforms: {
				breathPhase: { value: 0 },
				phaseType: { value: 0 },
			},
		});

		const particles = new THREE.Points(geometry, material);
		scene.add(particles);

		// Add ambient glow sphere with additive blending (won't occlude particles)
		const glowGeometry = new THREE.SphereGeometry(3, 32, 32);
		const glowMaterial = new THREE.MeshBasicMaterial({
			color: 0x4080a0,
			transparent: true,
			opacity: 0.03,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
		});
		const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
		glowSphere.renderOrder = -1; // Render behind particles
		scene.add(glowSphere);

		// Store refs
		sceneRef.current = {
			scene,
			camera,
			renderer,
			particles,
			geometry,
			material,
			glowSphere,
			glowMaterial,
			originalPositions,
			phases,
		};

		// Simple noise function for fluid motion
		const noise3D = (x: number, y: number, z: number, t: number) => {
			return (
				Math.sin(x * 0.5 + t) *
					Math.cos(y * 0.5 + t * 0.7) *
					Math.sin(z * 0.5 + t * 0.3) *
					0.5 +
				Math.sin(x * 1.2 + t * 1.3) * Math.cos(y * 0.8 + t) * 0.3 +
				Math.cos(z * 0.9 + t * 0.9) * Math.sin(x * 0.7 + t * 0.5) * 0.2
			);
		};

		// Easing function for smooth breathing
		const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

		// Get breath phase from useBreathSync state (0 = fully exhaled, 1 = fully inhaled)
		// Also returns phaseType: 0=in, 1=hold-in, 2=out, 3=hold-out
		const getBreathData = (): { breathPhase: number; phaseType: number } => {
			const state = breathStateRef.current;
			const { phase, progress } = state;

			// Map phase types to breath phase value
			// 'in' = inhaling (0 -> 1), 'hold-in' = holding at full (1)
			// 'out' = exhaling (1 -> 0), 'hold-out' = holding at empty (0)
			switch (phase) {
				case 'in':
					return { breathPhase: easeInOutSine(progress), phaseType: 0 };
				case 'hold-in':
					return { breathPhase: 1, phaseType: 1 };
				case 'out':
					return { breathPhase: 1 - easeInOutSine(progress), phaseType: 2 };
				case 'hold-out':
					return { breathPhase: 0, phaseType: 3 };
				default:
					return { breathPhase: 0, phaseType: 0 };
			}
		};

		// Animation
		const startTime = Date.now();

		const animate = () => {
			animationRef.current = requestAnimationFrame(animate);

			const refs = sceneRef.current;
			if (!refs) return;

			const elapsed = Date.now() - startTime;
			const time = elapsed * 0.001;
			const { breathPhase, phaseType } = getBreathData();

			// Update shader uniforms
			refs.material.uniforms.breathPhase.value = breathPhase;
			refs.material.uniforms.phaseType.value = phaseType;

			// Compression settings - much tighter sphere on inhale
			const expandedRadius = 22; // Exhaled - spread out
			const compressedRadius = 4; // Inhaled - tight sphere

			const positionAttribute = refs.geometry.getAttribute('position');
			const posArray = positionAttribute.array as Float32Array;

			for (let i = 0; i < particleCount; i++) {
				const i3 = i * 3;

				// Get original position
				const ox = refs.originalPositions[i3];
				const oy = refs.originalPositions[i3 + 1];
				const oz = refs.originalPositions[i3 + 2];

				// Calculate original distance from center
				const originalDist = Math.sqrt(ox * ox + oy * oy + oz * oz);

				// Normalize direction
				const nx = ox / originalDist;
				const ny = oy / originalDist;
				const nz = oz / originalDist;

				// Target radius based on breath phase
				// breathPhase 1 = inhaled (compressed), breathPhase 0 = exhaled (expanded)
				const targetRadius =
					expandedRadius - breathPhase * (expandedRadius - compressedRadius);

				// Add variation based on original position for organic feel
				const radiusVariation = (originalDist / 20) * 0.3;
				const particleTargetRadius = targetRadius * (0.85 + radiusVariation);

				// Calculate base position
				let x = nx * particleTargetRadius;
				let y = ny * particleTargetRadius;
				let z = nz * particleTargetRadius;

				// Add fluid noise displacement - less when compressed, more when expanded
				const noiseScale = 0.15;
				const noiseTime = time * 0.5;
				const phase = refs.phases[i];

				const noiseX = noise3D(
					ox * noiseScale,
					oy * noiseScale,
					oz * noiseScale,
					noiseTime + phase,
				);
				const noiseY = noise3D(
					oy * noiseScale,
					oz * noiseScale,
					ox * noiseScale,
					noiseTime + phase + 100,
				);
				const noiseZ = noise3D(
					oz * noiseScale,
					ox * noiseScale,
					oy * noiseScale,
					noiseTime + phase + 200,
				);

				// Noise strength decreases when inhaled (tighter formation)
				const noiseStrength = 1 + (1 - breathPhase) * 4;
				x += noiseX * noiseStrength;
				y += noiseY * noiseStrength;
				z += noiseZ * noiseStrength;

				// Add gentle floating motion - reduced when compressed
				const floatSpeed = 0.3;
				const floatAmount = 0.3 + (1 - breathPhase) * 0.5;
				x += Math.sin(time * floatSpeed + phase) * floatAmount;
				y += Math.cos(time * floatSpeed * 0.7 + phase) * floatAmount;
				z += Math.sin(time * floatSpeed * 0.5 + phase * 1.3) * floatAmount;

				posArray[i3] = x;
				posArray[i3 + 1] = y;
				posArray[i3 + 2] = z;
			}

			positionAttribute.needsUpdate = true;

			// Rotate the entire particle system slowly
			refs.particles.rotation.y += 0.002;
			refs.particles.rotation.x = Math.sin(time * 0.1) * 0.1;

			// Update glow sphere - subtle ambient glow that follows compression
			// Much smaller scale to stay inside the particle sphere
			const glowScale = 1 + breathPhase * 1.5;
			refs.glowSphere.scale.set(glowScale, glowScale, glowScale);
			refs.glowMaterial.opacity = 0.015 + breathPhase * 0.025;

			refs.renderer.render(refs.scene, refs.camera);
		};

		animate();

		// Handle resize
		const handleResize = () => {
			if (!(containerRef.current && sceneRef.current)) return;

			const { camera: cam, renderer: rend } = sceneRef.current;
			cam.aspect =
				containerRef.current.clientWidth / containerRef.current.clientHeight;
			cam.updateProjectionMatrix();
			rend.setSize(
				containerRef.current.clientWidth,
				containerRef.current.clientHeight,
			);
		};

		window.addEventListener('resize', handleResize);

		// Cleanup
		return () => {
			window.removeEventListener('resize', handleResize);
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
			if (sceneRef.current) {
				const refs = sceneRef.current;
				if (containerRef.current && refs.renderer.domElement) {
					containerRef.current.removeChild(refs.renderer.domElement);
				}
				refs.geometry.dispose();
				refs.material.dispose();
				refs.glowSphere.geometry.dispose();
				refs.glowMaterial.dispose();
				refs.renderer.dispose();
				sceneRef.current = null;
			}
		};
	}, []);

	return (
		<div className="relative w-full h-full">
			<div ref={containerRef} className="w-full h-full" />

			{/* Subtle vignette overlay */}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					background:
						'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
				}}
			/>
		</div>
	);
}
