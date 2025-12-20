import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { calculateTargetScale } from '../../hooks/useBreathingSpring';
import type { BreathState } from '../../hooks/useBreathSync';
import type { PresenceData } from '../../hooks/usePresence';
import type { VisualizationConfig } from '../../lib/config';

interface ParticleSystemProps {
	breathState: BreathState;
	presence: PresenceData;
	config: VisualizationConfig;
	moodColor: string;
}

// Custom shader material for galaxy particles with color variation
const particleVertexShader = `
  attribute float size;
  attribute float opacity;
  attribute vec3 particleColor;

  varying float vOpacity;
  varying vec3 vColor;

  void main() {
    vOpacity = opacity;
    vColor = particleColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const particleFragmentShader = `
  varying float vOpacity;
  varying vec3 vColor;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    // Soft glow with brighter center
    float alpha = smoothstep(0.5, 0.0, dist) * vOpacity;
    float core = smoothstep(0.3, 0.0, dist) * 0.5;

    gl_FragColor = vec4(vColor * (1.0 + core), alpha);
  }
`;

// Galaxy color palette - cosmic nebula colors
const GALAXY_COLORS = [
	new THREE.Color('#9B7EBD'), // Purple
	new THREE.Color('#7EB5C1'), // Teal
	new THREE.Color('#C17EB5'), // Pink/Magenta
	new THREE.Color('#5A9BAA'), // Deep teal
	new THREE.Color('#B8A9C9'), // Lavender
	new THREE.Color('#FFFFFF'), // White stars
	new THREE.Color('#87CEEB'), // Sky blue
];

export function ParticleSystem({
	breathState,
	config,
	moodColor,
}: ParticleSystemProps) {
	const pointsRef = useRef<THREE.Points>(null);
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	const scaleRef = useRef(1);
	const velocityRef = useRef(0);

	// Parse mood color once
	const moodColorObj = useMemo(
		() => new THREE.Color(moodColor || config.primaryColor),
		[moodColor, config.primaryColor],
	);

	// Generate galaxy particle data
	const particleData = useMemo(() => {
		// Increase particle count for richer galaxy
		const count = Math.min(config.particleCount * 3, 600);
		const positions = new Float32Array(count * 3);
		const sizes = new Float32Array(count);
		const opacities = new Float32Array(count);
		const colors = new Float32Array(count * 3);

		// Store base positions for animation
		const basePositions = new Float32Array(count * 3);
		// Store diffuse positions (expanded state)
		const diffuseOffsets = new Float32Array(count * 3);
		const phaseOffsets = new Float32Array(count);
		const particleTypes = new Float32Array(count); // 0=arm, 1=core, 2=halo

		const numArms = 3;
		const armSpread = 0.3;

		for (let i = 0; i < count; i++) {
			phaseOffsets[i] = Math.random() * Math.PI * 2;

			// Determine particle type
			const typeRoll = Math.random();
			let type: number;
			if (typeRoll < 0.15) {
				type = 1; // Core (15%)
			} else if (typeRoll < 0.75) {
				type = 0; // Spiral arm (60%)
			} else {
				type = 2; // Halo (25%)
			}
			particleTypes[i] = type;

			let x: number, y: number, z: number;
			let colorIndex: number;

			if (type === 1) {
				// Core particles - dense center
				const coreRadius = 0.15 * Math.random() ** 0.5;
				const coreAngle = Math.random() * Math.PI * 2;
				x = Math.cos(coreAngle) * coreRadius;
				y = Math.sin(coreAngle) * coreRadius;
				z = (Math.random() - 0.5) * 0.1;
				colorIndex = Math.random() < 0.3 ? 5 : Math.floor(Math.random() * 5); // More white in core
			} else if (type === 0) {
				// Spiral arm particles - logarithmic spiral
				const armIndex = Math.floor(Math.random() * numArms);
				const armOffset = (armIndex / numArms) * Math.PI * 2;

				// Logarithmic spiral: r = a * e^(b*theta)
				const spiralProgress = 0.1 + Math.random() * 0.9;
				const a = 0.1;
				const b = 0.15;
				const theta = spiralProgress * Math.PI * 3; // 1.5 turns
				const r = a * Math.exp(b * theta);

				// Add spread to the arm
				const spreadAngle = (Math.random() - 0.5) * armSpread;
				const spreadRadius = (Math.random() - 0.5) * 0.15 * spiralProgress;

				const finalAngle = theta + armOffset + spreadAngle;
				const finalRadius = r + spreadRadius;

				x = Math.cos(finalAngle) * finalRadius;
				y = Math.sin(finalAngle) * finalRadius;
				z = (Math.random() - 0.5) * 0.15 * (1 - spiralProgress * 0.5);

				// Color based on distance from center
				if (Math.random() < 0.1) {
					colorIndex = 5; // White stars scattered
				} else {
					colorIndex =
						spiralProgress < 0.5
							? Math.floor(Math.random() * 3)
							: Math.floor(Math.random() * 5);
				}
			} else {
				// Halo particles - diffuse outer region
				const haloRadius = 0.4 + Math.random() * 0.8;
				const haloAngle = Math.random() * Math.PI * 2;
				const haloZ = (Math.random() - 0.5) * 0.6;
				x = Math.cos(haloAngle) * haloRadius * (0.5 + Math.random() * 0.5);
				y = Math.sin(haloAngle) * haloRadius * (0.5 + Math.random() * 0.5);
				z = haloZ;
				colorIndex = Math.random() < 0.2 ? 5 : Math.floor(Math.random() * 7);
			}

			// Base positions (contracted/galaxy shape)
			basePositions[i * 3] = x;
			basePositions[i * 3 + 1] = y;
			basePositions[i * 3 + 2] = z;

			// Diffuse offsets (how much to spread when exhaling)
			const diffuseAmount = type === 1 ? 0.3 : type === 0 ? 0.6 : 1.2;
			diffuseOffsets[i * 3] = (Math.random() - 0.5) * diffuseAmount;
			diffuseOffsets[i * 3 + 1] = (Math.random() - 0.5) * diffuseAmount;
			diffuseOffsets[i * 3 + 2] = (Math.random() - 0.5) * diffuseAmount * 0.5;

			// Initial position
			positions[i * 3] = x;
			positions[i * 3 + 1] = y;
			positions[i * 3 + 2] = z;

			// Size based on type
			const baseSize =
				config.particleMinSize +
				Math.random() * (config.particleMaxSize - config.particleMinSize);
			if (type === 1) {
				sizes[i] = baseSize * 1.2; // Core particles slightly larger
			} else if (type === 2) {
				sizes[i] = baseSize * 0.7; // Halo particles smaller
			} else {
				sizes[i] = baseSize;
			}

			// Opacity based on type
			const baseOpacity =
				config.particleMinOpacity +
				Math.random() * (config.particleMaxOpacity - config.particleMinOpacity);
			if (type === 1) {
				opacities[i] = Math.min(baseOpacity * 1.5, 1.0);
			} else if (type === 2) {
				opacities[i] = baseOpacity * 0.5;
			} else {
				opacities[i] = baseOpacity;
			}

			// Blend galaxy color with mood color
			const galaxyColor = GALAXY_COLORS[colorIndex];
			const blendedColor = new THREE.Color().lerpColors(
				galaxyColor,
				moodColorObj,
				0.3,
			);
			colors[i * 3] = blendedColor.r;
			colors[i * 3 + 1] = blendedColor.g;
			colors[i * 3 + 2] = blendedColor.b;
		}

		return {
			positions,
			sizes,
			opacities,
			colors,
			basePositions,
			diffuseOffsets,
			phaseOffsets,
			particleTypes,
			count,
		};
	}, [
		config.particleCount,
		config.particleMinSize,
		config.particleMaxSize,
		config.particleMinOpacity,
		config.particleMaxOpacity,
		moodColorObj,
	]);

	// Update colors when mood changes
	useEffect(() => {
		if (pointsRef.current) {
			const colorAttr = pointsRef.current.geometry.attributes.particleColor;
			if (colorAttr) {
				const colors = colorAttr.array as Float32Array;
				for (let i = 0; i < particleData.count; i++) {
					const colorIndex = Math.floor(Math.random() * GALAXY_COLORS.length);
					const galaxyColor = GALAXY_COLORS[colorIndex];
					const blendedColor = new THREE.Color().lerpColors(
						galaxyColor,
						moodColorObj,
						0.3,
					);
					colors[i * 3] = blendedColor.r;
					colors[i * 3 + 1] = blendedColor.g;
					colors[i * 3 + 2] = blendedColor.b;
				}
				colorAttr.needsUpdate = true;
			}
		}
	}, [moodColorObj, particleData.count]);

	// Animation loop
	useFrame((state) => {
		if (!pointsRef.current) return;

		const time = state.clock.elapsedTime;

		// Calculate breathing state
		// Scale: breatheInScale (contracted) -> breatheOutScale (expanded)
		// We INVERT this for the galaxy: contracted = defined shape, expanded = diffuse
		const targetScale = calculateTargetScale(breathState, config);

		// Manual spring simulation
		const stiffness = config.mainSpringTension * 0.0001;
		const damping = config.mainSpringFriction * 0.05;
		const force = (targetScale - scaleRef.current) * stiffness;
		velocityRef.current = velocityRef.current * (1 - damping) + force;
		scaleRef.current += velocityRef.current;

		// Diffuse factor: 0 = tight galaxy, 1 = diffuse nebula
		// When scale is at breatheInScale (0.7), we want tight (diffuse=0)
		// When scale is at breatheOutScale (1.2), we want diffuse (diffuse=1)
		const normalizedScale =
			(scaleRef.current - config.breatheInScale) /
			(config.breatheOutScale - config.breatheInScale);
		const diffuseFactor = Math.max(0, Math.min(1, normalizedScale));

		// Update particle positions
		const positions = pointsRef.current.geometry.attributes.position
			.array as Float32Array;
		const {
			basePositions,
			diffuseOffsets,
			phaseOffsets,
			particleTypes,
			count,
		} = particleData;

		// Slow rotation of the whole galaxy
		const galaxyRotation = time * 0.05;

		for (let i = 0; i < count; i++) {
			// Base position (galaxy shape)
			const baseX = basePositions[i * 3];
			const baseY = basePositions[i * 3 + 1];
			const baseZ = basePositions[i * 3 + 2];

			// Diffuse offset
			const diffX = diffuseOffsets[i * 3];
			const diffY = diffuseOffsets[i * 3 + 1];
			const diffZ = diffuseOffsets[i * 3 + 2];

			// Wobble animation (more subtle when contracted)
			const wobbleAmount = config.wobbleAmount * (0.3 + diffuseFactor * 0.7);
			const wobble = Math.sin(time * 2 + phaseOffsets[i]) * wobbleAmount;

			// Interpolate between tight galaxy and diffuse nebula
			const x = baseX + diffX * diffuseFactor + wobble;
			const y = baseY + diffY * diffuseFactor + wobble * 0.5;
			const z = baseZ + diffZ * diffuseFactor;

			// Apply galaxy rotation (faster for arm particles when contracted)
			const type = particleTypes[i];
			const rotationMultiplier = type === 0 ? 1.5 : type === 1 ? 0.5 : 0.8;
			const effectiveRotation =
				galaxyRotation * rotationMultiplier * (1.2 - diffuseFactor * 0.5);

			const cos = Math.cos(effectiveRotation);
			const sin = Math.sin(effectiveRotation);
			const rotatedX = x * cos - y * sin;
			const rotatedY = x * sin + y * cos;

			positions[i * 3] = rotatedX;
			positions[i * 3 + 1] = rotatedY;
			positions[i * 3 + 2] = z;
		}

		pointsRef.current.geometry.attributes.position.needsUpdate = true;

		// Slight tilt for 3D effect
		pointsRef.current.rotation.x = 0.3;
	});

	return (
		<points ref={pointsRef}>
			<bufferGeometry>
				<bufferAttribute
					attach="attributes-position"
					args={[particleData.positions, 3]}
				/>
				<bufferAttribute
					attach="attributes-size"
					args={[particleData.sizes, 1]}
				/>
				<bufferAttribute
					attach="attributes-opacity"
					args={[particleData.opacities, 1]}
				/>
				<bufferAttribute
					attach="attributes-particleColor"
					args={[particleData.colors, 3]}
				/>
			</bufferGeometry>
			<shaderMaterial
				ref={materialRef}
				vertexShader={particleVertexShader}
				fragmentShader={particleFragmentShader}
				transparent
				depthWrite={false}
				blending={THREE.AdditiveBlending}
			/>
		</points>
	);
}
