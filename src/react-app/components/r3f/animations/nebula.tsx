import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ParticleAnimationProps } from './types';

/**
 * Vertex shader for morphing particles between orb and cloud states
 */
const vertexShader = `
	uniform float uTime;
	uniform float uBreathProgress;
	uniform float uExpansionRadius;
	uniform float uParticleSize;

	attribute float aRandom;
	attribute vec3 aDirection;
	attribute vec3 aTargetPos;

	varying float vProgress;
	varying float vRandom;

	// Organic noise for fluid movement
	vec3 noise(vec3 p) {
		return vec3(
			sin(p.y * 2.0 + uTime * 0.5),
			sin(p.z * 2.0 + uTime * 0.4),
			sin(p.x * 2.0 + uTime * 0.6)
		) * 0.2;
	}

	void main() {
		vRandom = aRandom;
		vProgress = uBreathProgress;

		// Inhale state: ring/orb shape
		vec3 orbPos = aTargetPos;

		// Exhale state: expanded cloud
		float explosionRadius = uExpansionRadius * (0.5 + aRandom * 0.5);
		vec3 cloudPos = aDirection * explosionRadius;

		// Morph between states
		vec3 finalPos = mix(orbPos, cloudPos, uBreathProgress);

		// Add organic movement (more when expanded)
		vec3 organicOffset = noise(finalPos * 0.5 + uTime * 0.15) * (0.1 + uBreathProgress * 0.8);
		finalPos += organicOffset;

		// Gentle rotation
		float angle = uTime * 0.05;
		float s = sin(angle);
		float c = cos(angle);
		mat2 rot = mat2(c, -s, s, c);
		finalPos.xz = rot * finalPos.xz;

		vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
		gl_Position = projectionMatrix * mvPosition;

		// Size attenuation
		gl_PointSize = uParticleSize * (10.0 / -mvPosition.z);
	}
`;

/**
 * Fragment shader for particle appearance
 */
const fragmentShader = `
	uniform vec3 uColorCore;
	uniform vec3 uColorCloud;
	uniform sampler2D uTexture;
	uniform float uTime;
	uniform float uUserGlow;

	varying float vProgress;
	varying float vRandom;

	void main() {
		vec4 texColor = texture2D(uTexture, gl_PointCoord);
		if (texColor.a < 0.01) discard;

		// Color interpolation: core color -> cloud color
		vec3 baseColor = mix(uColorCore, uColorCloud, vProgress);

		// Subtle shimmer
		float shimmer = 0.08 * sin(uTime * 2.5 + vRandom * 8.0);
		vec3 finalColor = baseColor + vec3(shimmer);

		// User glow effect
		finalColor *= uUserGlow;

		// Alpha: more transparent when condensed, more visible when expanded
		float alpha = texColor.a * (0.3 + vProgress * 0.5);

		// Core particles glow more
		if (vProgress < 0.15) {
			alpha += 0.15;
		}

		gl_FragColor = vec4(finalColor, alpha);
	}
`;

/**
 * Generate a point on a ring/orb surface
 */
function getOrbPoint(radius: number): THREE.Vector3 {
	// Create points distributed on a torus-like ring
	const theta = Math.random() * Math.PI * 2; // Around the ring
	const phi = (Math.random() - 0.5) * Math.PI * 0.6; // Variation in height
	const r = radius * (0.8 + Math.random() * 0.4); // Radius variation

	return new THREE.Vector3(
		Math.cos(theta) * r * Math.cos(phi),
		Math.sin(phi) * r * 0.3, // Flatten vertically
		Math.sin(theta) * r * Math.cos(phi),
	);
}

/**
 * Create soft particle texture
 */
function createParticleTexture(): THREE.Texture {
	const size = 128;
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Could not get canvas context');

	const center = size / 2;
	const gradient = ctx.createRadialGradient(
		center,
		center,
		0,
		center,
		center,
		center,
	);

	gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
	gradient.addColorStop(0.15, 'rgba(255, 255, 255, 0.7)');
	gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.2)');
	gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, size, size);

	return new THREE.CanvasTexture(canvas);
}

/**
 * Shader-based morphing particle animation.
 *
 * Particles morph between:
 * - Inhale: Condensed ring/orb shape
 * - Exhale: Expanded cloud
 *
 * Uses custom GLSL shaders for smooth morphing and organic movement.
 */
export function NebulaAnimation({
	breathState,
	config,
	moodColor,
	userCount = 1,
}: ParticleAnimationProps) {
	const pointsRef = useRef<THREE.Points>(null);
	const materialRef = useRef<THREE.ShaderMaterial>(null);

	// Smooth breath progress
	const breathProgress = useRef(0);
	const targetProgress = useRef(0);

	// Parse colors
	const colors = useMemo(() => {
		const core = new THREE.Color(moodColor || config.primaryColor);
		// Create a slightly different cloud color
		const cloud = core.clone();
		cloud.offsetHSL(0.1, -0.2, -0.1);
		return { core, cloud };
	}, [moodColor, config.primaryColor]);

	// Create geometry with custom attributes
	const geometry = useMemo(() => {
		const particleCount = Math.min(15000 + userCount * 100, 25000);
		const orbRadius = 1.2;

		const positions: number[] = [];
		const targetPositions: number[] = [];
		const directions: number[] = [];
		const randoms: number[] = [];

		for (let i = 0; i < particleCount; i++) {
			// Initial position (will be computed in shader)
			positions.push(0, 0, 0);

			// Target position: ring/orb shape
			const orbPoint = getOrbPoint(orbRadius);
			targetPositions.push(orbPoint.x, orbPoint.y, orbPoint.z);

			// Direction for explosion (unit sphere)
			const dir = new THREE.Vector3(
				Math.random() * 2 - 1,
				Math.random() * 2 - 1,
				Math.random() * 2 - 1,
			).normalize();
			directions.push(dir.x, dir.y, dir.z);

			randoms.push(Math.random());
		}

		const geo = new THREE.BufferGeometry();
		geo.setAttribute(
			'position',
			new THREE.Float32BufferAttribute(positions, 3),
		);
		geo.setAttribute(
			'aTargetPos',
			new THREE.Float32BufferAttribute(targetPositions, 3),
		);
		geo.setAttribute(
			'aDirection',
			new THREE.Float32BufferAttribute(directions, 3),
		);
		geo.setAttribute('aRandom', new THREE.Float32BufferAttribute(randoms, 1));

		return geo;
	}, [userCount]);

	// Create shader material
	const material = useMemo(() => {
		const texture = createParticleTexture();

		return new THREE.ShaderMaterial({
			uniforms: {
				uTime: { value: 0 },
				uBreathProgress: { value: 0 },
				uExpansionRadius: { value: 3.0 },
				uParticleSize: { value: 15.0 },
				uColorCore: { value: colors.core },
				uColorCloud: { value: colors.cloud },
				uTexture: { value: texture },
				uUserGlow: { value: 1.0 },
			},
			vertexShader,
			fragmentShader,
			transparent: true,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
		});
	}, [colors]);

	// Store material ref
	useEffect(() => {
		materialRef.current = material;
	}, [material]);

	// Update colors when mood changes
	useEffect(() => {
		if (materialRef.current) {
			materialRef.current.uniforms.uColorCore.value = colors.core;
			materialRef.current.uniforms.uColorCloud.value = colors.cloud;
		}
	}, [colors]);

	// Animation loop
	useFrame((state) => {
		if (!materialRef.current) return;

		const { phase, progress } = breathState;

		// Calculate target breath progress (0 = orb, 1 = cloud)
		if (phase === 'in') {
			// Inhale: condense from cloud to orb
			targetProgress.current = 1.0 - progress;
		} else if (phase === 'out') {
			// Exhale: expand from orb to cloud
			targetProgress.current = progress;
		} else if (phase === 'hold-in') {
			// Hold at orb
			targetProgress.current = 0;
		} else {
			// Hold at cloud
			targetProgress.current = 1;
		}

		// Smooth transition with easing
		breathProgress.current +=
			(targetProgress.current - breathProgress.current) * 0.08;

		// User glow effect
		const userGlow = Math.min(
			1 + Math.log10(Math.max(userCount, 1)) * 0.15,
			1.4,
		);

		// Update uniforms
		materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
		materialRef.current.uniforms.uBreathProgress.value = breathProgress.current;
		materialRef.current.uniforms.uUserGlow.value = userGlow;
	});

	// Cleanup
	useEffect(() => {
		return () => {
			geometry.dispose();
			material.dispose();
			if (material.uniforms.uTexture.value) {
				material.uniforms.uTexture.value.dispose();
			}
		};
	}, [geometry, material]);

	return <points ref={pointsRef} geometry={geometry} material={material} />;
}
