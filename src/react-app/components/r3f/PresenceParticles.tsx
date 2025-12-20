import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { calculateTargetScale } from '../../hooks/useBreathingSpring';
import type { BreathState } from '../../hooks/useBreathSync';
import type { PresenceData } from '../../hooks/usePresence';
import { getMoodColor } from '../../lib/colors';
import type { VisualizationConfig } from '../../lib/config';
import {
	createSamplerState,
	type FireflyParticle,
	type SamplerState,
	sampleParticles,
	updateParticleOpacities,
} from '../../lib/particleSampler';
import { MOOD_IDS, type MoodId } from '../../lib/simulationConfig';
import type { UserIdentity } from '../../stores/appStore';

interface PresenceParticlesProps {
	breathState: BreathState;
	presence: PresenceData;
	config: VisualizationConfig;
	currentUser?: UserIdentity | null;
}

// Firefly vertex shader with individual pulse
const fireflyVertexShader = `
  attribute float size;
  attribute vec3 particleColor;
  attribute float particleOpacity;
  attribute float phaseOffset;

  uniform float time;
  uniform float pulseSpeed;

  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    vColor = particleColor;

    // Individual pulse effect (firefly glow)
    float pulse = 0.6 + 0.4 * sin(time * pulseSpeed + phaseOffset);
    vOpacity = particleOpacity * pulse;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * pulse * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fireflyFragmentShader = `
  varying vec3 vColor;
  varying float vOpacity;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    // Soft glow with bright center
    float glow = smoothstep(0.5, 0.0, dist);
    float alpha = glow * vOpacity;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

// Aurora ribbon shaders
const ribbonVertexShader = `
  attribute vec4 ribbonColor;

  varying vec4 vColor;

  void main() {
    vColor = ribbonColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const ribbonFragmentShader = `
  varying vec4 vColor;

  void main() {
    gl_FragColor = vColor;
  }
`;

// "You Are Here" marker shaders
const youAreHereVertexShader = `
  uniform float size;
  uniform float breathPulse;

  varying float vGlowIntensity;

  void main() {
    vGlowIntensity = 0.5 + 0.5 * breathPulse;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (1.0 + breathPulse * 0.2) * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const youAreHereFragmentShader = `
  uniform vec3 color;
  uniform float glowRadius;
  uniform float glowOpacity;

  varying float vGlowIntensity;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;

    // Multi-layer glow effect
    float core = smoothstep(0.25, 0.0, dist);
    float glow = smoothstep(0.5, 0.1, dist) * glowOpacity * vGlowIntensity;
    float alpha = max(core, glow);

    // Brighter center
    vec3 finalColor = mix(color, vec3(1.0), core * 0.3);
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// "You Are Here" marker component
function YouAreHereMarker({
	config,
	scale,
	breathProgress,
	moodColor,
}: {
	config: VisualizationConfig;
	scale: number;
	breathProgress: number;
	moodColor: string;
}) {
	const pointsRef = useRef<THREE.Points>(null);
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	const angleRef = useRef(Math.random() * Math.PI * 2); // Random starting position

	useFrame(() => {
		if (!pointsRef.current || !materialRef.current) return;

		// Null check for geometry attribute
		const posAttr = pointsRef.current.geometry.attributes.position;
		if (!posAttr) return;

		// Slow orbit around the ring
		angleRef.current += 0.0002;
		const angle = angleRef.current;

		// Position on the presence ring
		const radius = scale * config.presenceRadius;
		const positions = posAttr.array as Float32Array;
		positions[0] = Math.cos(angle) * radius;
		positions[1] = Math.sin(angle) * radius;
		positions[2] = 0.02; // In front of fireflies
		posAttr.needsUpdate = true;

		// Update breath pulse
		materialRef.current.uniforms.breathPulse.value = Math.sin(
			breathProgress * Math.PI * 2,
		);
	});

	const color = new THREE.Color(moodColor);
	const size = config.fireflySize * config.youAreHereSizeMultiplier;

	return (
		<points ref={pointsRef}>
			<bufferGeometry>
				<bufferAttribute
					attach="attributes-position"
					args={[new Float32Array([0, 0, 0.02]), 3]}
				/>
			</bufferGeometry>
			<shaderMaterial
				ref={materialRef}
				vertexShader={youAreHereVertexShader}
				fragmentShader={youAreHereFragmentShader}
				uniforms={{
					size: { value: size },
					color: { value: color },
					breathPulse: { value: 0 },
					glowRadius: { value: config.youAreHereGlowRadius },
					glowOpacity: { value: config.youAreHereGlowOpacity },
				}}
				transparent
				depthWrite={false}
				blending={THREE.AdditiveBlending}
			/>
		</points>
	);
}

// Aurora Ribbon component
function AuroraRibbons({
	presence,
	config,
	scale,
	time,
}: {
	presence: PresenceData;
	config: VisualizationConfig;
	scale: number;
	time: number;
}) {
	const meshRef = useRef<THREE.Mesh>(null);
	// Pre-allocate buffers to avoid GC pressure (reused every frame)
	const buffersRef = useRef<{
		vertices: Float32Array;
		colors: Float32Array;
		size: number;
	} | null>(null);
	// Cache mood colors to avoid creating THREE.Color objects every frame
	const moodColorsRef = useRef<
		Map<MoodId, { r: number; g: number; b: number }>
	>(new Map());

	// Generate ribbon geometry data
	const ribbonData = useMemo(() => {
		const totalPresence = presence.count;
		if (totalPresence === 0 || !config.ribbonEnabled) {
			return null;
		}

		// Calculate mood angles
		const moodAngles: {
			moodId: MoodId;
			startAngle: number;
			arcSize: number;
		}[] = [];
		const activeMoods = MOOD_IDS.filter((id) => (presence.moods[id] ?? 0) > 0);
		const gapSize = 0.05;
		const totalGaps = activeMoods.length * gapSize;
		const availableArc = Math.PI * 2 - totalGaps;

		let currentAngle = -Math.PI / 2;
		for (const moodId of activeMoods) {
			const count = presence.moods[moodId] ?? 0;
			const proportion = count / totalPresence;
			const arcSize = proportion * availableArc;
			moodAngles.push({ moodId, startAngle: currentAngle, arcSize });
			currentAngle += arcSize + gapSize;
		}

		// Cache mood colors when ribbonData changes
		moodColorsRef.current.clear();
		for (const { moodId } of moodAngles) {
			const color = new THREE.Color(getMoodColor(moodId));
			moodColorsRef.current.set(moodId, { r: color.r, g: color.g, b: color.b });
		}

		return moodAngles;
	}, [presence.count, presence.moods, config.ribbonEnabled]);

	// Calculate buffer size and ensure buffers are allocated
	const totalVertices = ribbonData
		? ribbonData.length * (config.ribbonSegments + 1) * 2
		: 0;

	// Allocate or resize buffers when needed
	useMemo(() => {
		if (totalVertices === 0) {
			buffersRef.current = null;
			return;
		}
		const neededSize = totalVertices;
		if (!buffersRef.current || buffersRef.current.size < neededSize) {
			buffersRef.current = {
				vertices: new Float32Array(neededSize * 3),
				colors: new Float32Array(neededSize * 4),
				size: neededSize,
			};
		}
	}, [totalVertices]);

	// Update ribbon geometry each frame (reuse pre-allocated buffers)
	useFrame(() => {
		if (!meshRef.current || !ribbonData || !buffersRef.current) return;

		const { vertices, colors } = buffersRef.current;
		const segments = config.ribbonSegments;
		let vertexIndex = 0;
		let colorIndex = 0;

		for (const { moodId, startAngle, arcSize } of ribbonData) {
			const userCount = presence.moods[moodId] ?? 0;
			const ribbonWidth =
				(config.ribbonBaseWidth +
					Math.log(userCount + 1) * config.ribbonScaleFactor) /
				100;
			const moodColor = moodColorsRef.current.get(moodId) ?? {
				r: 0.5,
				g: 0.7,
				b: 0.76,
			};

			for (let i = 0; i <= segments; i++) {
				const t = i / segments;
				const angle = startAngle + t * arcSize;

				// Breathing pulse
				const breathPulse =
					Math.sin(time * 2 + t * Math.PI) * config.ribbonPulseAmount;
				// Organic wave
				const wave = Math.sin(time * 0.5 + angle * 3) * 0.005;

				const halfWidth = ribbonWidth / 2;
				const innerRadius =
					scale * (config.presenceRadius - halfWidth + breathPulse + wave);
				const outerRadius =
					scale * (config.presenceRadius + halfWidth + breathPulse + wave);

				const cosAngle = Math.cos(angle);
				const sinAngle = Math.sin(angle);

				// Inner vertex
				vertices[vertexIndex++] = cosAngle * innerRadius;
				vertices[vertexIndex++] = sinAngle * innerRadius;
				vertices[vertexIndex++] = 0;
				// Outer vertex
				vertices[vertexIndex++] = cosAngle * outerRadius;
				vertices[vertexIndex++] = sinAngle * outerRadius;
				vertices[vertexIndex++] = 0;

				// Edge fade for aurora effect
				const edgeFade = Math.min(t, 1 - t) / config.ribbonBlendWidth;
				const opacity = Math.min(1, edgeFade) * config.presenceOpacity;

				// Inner color (slightly darker)
				colors[colorIndex++] = moodColor.r * 0.8;
				colors[colorIndex++] = moodColor.g * 0.8;
				colors[colorIndex++] = moodColor.b * 0.8;
				colors[colorIndex++] = opacity * 0.7;
				// Outer color (brighter)
				colors[colorIndex++] = moodColor.r;
				colors[colorIndex++] = moodColor.g;
				colors[colorIndex++] = moodColor.b;
				colors[colorIndex++] = opacity;
			}
		}

		// Update existing buffer attributes in place
		const geometry = meshRef.current.geometry;
		const posAttr = geometry.attributes.position;
		const colorAttr = geometry.attributes.ribbonColor;

		if (posAttr && colorAttr) {
			(posAttr.array as Float32Array).set(vertices.subarray(0, vertexIndex));
			(colorAttr.array as Float32Array).set(colors.subarray(0, colorIndex));
			posAttr.needsUpdate = true;
			colorAttr.needsUpdate = true;
		}
	});

	if (!ribbonData || ribbonData.length === 0 || totalVertices === 0)
		return null;

	return (
		<mesh ref={meshRef}>
			<bufferGeometry>
				<bufferAttribute
					attach="attributes-position"
					args={[new Float32Array(totalVertices * 3), 3]}
				/>
				<bufferAttribute
					attach="attributes-ribbonColor"
					args={[new Float32Array(totalVertices * 4), 4]}
				/>
			</bufferGeometry>
			<shaderMaterial
				vertexShader={ribbonVertexShader}
				fragmentShader={ribbonFragmentShader}
				transparent
				depthWrite={false}
				blending={THREE.AdditiveBlending}
				side={THREE.DoubleSide}
			/>
		</mesh>
	);
}

// Firefly Particles component
function FireflyParticles({
	presence,
	config,
	scale,
}: {
	presence: PresenceData;
	config: VisualizationConfig;
	scale: number;
}) {
	const pointsRef = useRef<THREE.Points>(null);
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	const samplerStateRef = useRef<SamplerState>(createSamplerState());
	const [particles, setParticles] = useState<FireflyParticle[]>([]);

	// Sample particles when presence changes
	useEffect(() => {
		if (!presence.users || presence.users.length === 0) {
			setParticles([]);
			return;
		}

		const now = Date.now();
		samplerStateRef.current = sampleParticles(
			presence.users,
			presence.moods,
			samplerStateRef.current,
			config,
			now,
		);

		const updatedParticles = updateParticleOpacities(
			samplerStateRef.current.particles,
			config,
			now,
		);

		setParticles(updatedParticles);
	}, [presence.users, presence.moods, config]);

	// Update positions and shader uniforms each frame
	useFrame((state) => {
		if (!pointsRef.current || particles.length === 0) return;

		const time = state.clock.elapsedTime;
		const now = Date.now();

		// Update particle opacities for animations
		const updatedParticles = updateParticleOpacities(
			samplerStateRef.current.particles,
			config,
			now,
		);

		const positions = pointsRef.current.geometry.attributes.position
			.array as Float32Array;
		const opacities = pointsRef.current.geometry.attributes.particleOpacity
			.array as Float32Array;

		for (let i = 0; i < updatedParticles.length; i++) {
			const p = updatedParticles[i];
			const radiusVar = Math.sin(time * 0.5 + p.phaseOffset) * 0.02;
			const radius = scale * (config.presenceRadius + radiusVar);

			positions[i * 3] = Math.cos(p.angle) * radius;
			positions[i * 3 + 1] = Math.sin(p.angle) * radius;
			positions[i * 3 + 2] = 0.01; // Slightly in front of ribbons
			opacities[i] = p.opacity;
		}

		pointsRef.current.geometry.attributes.position.needsUpdate = true;
		pointsRef.current.geometry.attributes.particleOpacity.needsUpdate = true;

		// Update shader time
		if (materialRef.current) {
			materialRef.current.uniforms.time.value = time;
		}
	});

	if (particles.length === 0) return null;

	// Prepare buffer data
	const count = particles.length;
	const positions = new Float32Array(count * 3);
	const sizes = new Float32Array(count);
	const colors = new Float32Array(count * 3);
	const opacities = new Float32Array(count);
	const phases = new Float32Array(count);

	for (let i = 0; i < count; i++) {
		const p = particles[i];
		// Initialize at origin - first useFrame will position correctly with scale
		// This prevents one-frame position jump when scale != 1
		positions[i * 3] = 0;
		positions[i * 3 + 1] = 0;
		positions[i * 3 + 2] = 0.01;

		sizes[i] = config.fireflySize;
		opacities[i] = p.opacity;
		phases[i] = p.phaseOffset;

		const color = new THREE.Color(getMoodColor(p.user.mood));
		colors[i * 3] = color.r;
		colors[i * 3 + 1] = color.g;
		colors[i * 3 + 2] = color.b;
	}

	return (
		<points ref={pointsRef}>
			<bufferGeometry>
				<bufferAttribute attach="attributes-position" args={[positions, 3]} />
				<bufferAttribute attach="attributes-size" args={[sizes, 1]} />
				<bufferAttribute attach="attributes-particleColor" args={[colors, 3]} />
				<bufferAttribute
					attach="attributes-particleOpacity"
					args={[opacities, 1]}
				/>
				<bufferAttribute attach="attributes-phaseOffset" args={[phases, 1]} />
			</bufferGeometry>
			<shaderMaterial
				ref={materialRef}
				vertexShader={fireflyVertexShader}
				fragmentShader={fireflyFragmentShader}
				uniforms={{
					time: { value: 0 },
					pulseSpeed: { value: config.fireflyPulseSpeed * 1000 },
				}}
				transparent
				depthWrite={false}
				blending={THREE.AdditiveBlending}
			/>
		</points>
	);
}

export function PresenceParticles({
	breathState,
	presence,
	config,
	currentUser,
}: PresenceParticlesProps) {
	const scaleRef = useRef(1);
	const velocityRef = useRef(0);
	const timeRef = useRef(0);
	const breathProgressRef = useRef(0);

	// Update scale with spring physics
	useFrame((state) => {
		timeRef.current = state.clock.elapsedTime;
		breathProgressRef.current = breathState.progress;

		const targetScale = calculateTargetScale(breathState, config);
		const stiffness = config.mainSpringTension * 0.0001;
		const damping = config.mainSpringFriction * 0.05;
		const force = (targetScale - scaleRef.current) * stiffness;
		velocityRef.current = velocityRef.current * (1 - damping) + force;
		scaleRef.current += velocityRef.current;
	});

	// Get mood color for current user
	const currentUserMoodColor = currentUser?.mood
		? getMoodColor(currentUser.mood)
		: config.primaryColor;

	if (presence.count === 0 && !currentUser) return null;

	return (
		<group>
			{/* Aurora ribbons (density visualization) */}
			{config.ribbonEnabled && presence.count > 0 && (
				<AuroraRibbons
					presence={presence}
					config={config}
					scale={scaleRef.current}
					time={timeRef.current}
				/>
			)}

			{/* Firefly particles (sampled individuals) */}
			{presence.users && presence.users.length > 0 && (
				<FireflyParticles
					presence={presence}
					config={config}
					scale={scaleRef.current}
				/>
			)}

			{/* "You Are Here" marker for current user */}
			{currentUser && (
				<YouAreHereMarker
					config={config}
					scale={scaleRef.current}
					breathProgress={breathProgressRef.current}
					moodColor={currentUserMoodColor}
				/>
			)}
		</group>
	);
}
