import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import Nebula, {
	Alpha,
	Body,
	Color,
	Emitter,
	Life,
	Mass,
	Position,
	RadialVelocity,
	Radius,
	Rate,
	Scale,
	Span,
	SpriteRenderer,
	Vector3D,
} from 'three-nebula';
import { calculateTargetScale } from '../../hooks/useBreathingSpring';
import type { BreathState } from '../../hooks/useBreathSync';
import type { VisualizationConfig } from '../../lib/config';

interface NebulaParticlesProps {
	breathState: BreathState;
	config: VisualizationConfig;
	moodColor: string;
}

// Create a soft, beautiful particle texture
function createParticleTexture(size = 128): THREE.Texture {
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d')!;
	const center = size / 2;

	// Beautiful soft radial gradient
	const gradient = ctx.createRadialGradient(
		center,
		center,
		0,
		center,
		center,
		center,
	);
	gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
	gradient.addColorStop(0.1, 'rgba(255, 255, 255, 0.9)');
	gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.5)');
	gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.15)');
	gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, size, size);

	const texture = new THREE.CanvasTexture(canvas);
	texture.needsUpdate = true;
	return texture;
}

export function NebulaParticles({
	breathState,
	config,
	moodColor,
}: NebulaParticlesProps) {
	const nebulaRef = useRef<Nebula | null>(null);
	const coreEmitterRef = useRef<Emitter | null>(null);
	const ringEmitterRef = useRef<Emitter | null>(null);
	const containerRef = useRef<THREE.Group>(null);
	const scaleRef = useRef(1);
	const velocityRef = useRef(0);
	const materialRef = useRef<THREE.SpriteMaterial | null>(null);
	const textureRef = useRef<THREE.Texture | null>(null);

	// Create particle color from mood
	const particleColor = useMemo(() => {
		const color = new THREE.Color(moodColor || config.primaryColor);
		return { r: color.r, g: color.g, b: color.b };
	}, [moodColor, config.primaryColor]);

	// Initialize Nebula system with beautiful particles
	useEffect(() => {
		if (!containerRef.current) return;

		const texture = createParticleTexture();
		textureRef.current = texture;

		// Create beautiful sprite material
		const material = new THREE.SpriteMaterial({
			map: texture,
			color: new THREE.Color(moodColor || config.primaryColor),
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			opacity: 0.8,
		});
		materialRef.current = material;

		const sprite = new THREE.Sprite(material);

		// Core emitter - gentle central pulsing
		const coreEmitter = new Emitter();
		coreEmitter
			.setRate(new Rate(new Span(2, 4), new Span(0.1, 0.2)))
			.addInitializers([
				new Mass(1),
				new Life(3, 5),
				new Body(sprite),
				new Radius(0.03, 0.08),
				new Position(new Vector3D(0, 0, 0)),
				new RadialVelocity(new Span(0.02, 0.08), new Vector3D(0, 0, 1), 180),
			])
			.addBehaviours([
				new Alpha(0.7, 0),
				new Scale(1.2, 0.2),
				new Color(particleColor, { r: 0.2, g: 0.4, b: 0.5 }),
			])
			.emit();

		// Ring emitter - particles that orbit and flow
		const ringEmitter = new Emitter();
		ringEmitter
			.setRate(new Rate(new Span(1, 3), new Span(0.15, 0.25)))
			.addInitializers([
				new Mass(0.5),
				new Life(4, 7),
				new Body(sprite),
				new Radius(0.02, 0.05),
				new Position(new Vector3D(0.3, 0, 0)),
				new RadialVelocity(new Span(0.01, 0.04), new Vector3D(0, 1, 0), 60),
			])
			.addBehaviours([
				new Alpha(0.5, 0),
				new Scale(0.8, 0.1),
				new Color(particleColor, { r: 0.3, g: 0.5, b: 0.6 }),
			])
			.emit();

		// Create Nebula system
		const nebula = new Nebula();
		const renderer = new SpriteRenderer(containerRef.current, THREE);

		nebula.addEmitter(coreEmitter);
		nebula.addEmitter(ringEmitter);
		nebula.addRenderer(renderer);

		nebulaRef.current = nebula;
		coreEmitterRef.current = coreEmitter;
		ringEmitterRef.current = ringEmitter;

		return () => {
			nebula.destroy();
			texture.dispose();
			material.dispose();
		};
	}, []);

	// Update colors when mood changes
	useEffect(() => {
		if (materialRef.current) {
			materialRef.current.color.set(moodColor || config.primaryColor);
		}

		// Update core emitter color
		if (coreEmitterRef.current) {
			const colorBehavior = coreEmitterRef.current.behaviours.find(
				(b: unknown) => b instanceof Color,
			) as Color | undefined;
			if (colorBehavior) {
				colorBehavior.reset(particleColor, { r: 0.2, g: 0.4, b: 0.5 });
			}
		}

		// Update ring emitter color
		if (ringEmitterRef.current) {
			const colorBehavior = ringEmitterRef.current.behaviours.find(
				(b: unknown) => b instanceof Color,
			) as Color | undefined;
			if (colorBehavior) {
				colorBehavior.reset(particleColor, { r: 0.3, g: 0.5, b: 0.6 });
			}
		}
	}, [particleColor, moodColor, config.primaryColor]);

	// Animation loop
	useFrame((_state, delta) => {
		if (
			!nebulaRef.current ||
			!containerRef.current ||
			!coreEmitterRef.current ||
			!ringEmitterRef.current
		)
			return;

		// Calculate breathing scale with spring physics
		const targetScale = calculateTargetScale(breathState, config);
		const stiffness = config.mainSpringTension * 0.0001;
		const damping = config.mainSpringFriction * 0.05;
		const force = (targetScale - scaleRef.current) * stiffness;
		velocityRef.current = velocityRef.current * (1 - damping) + force;
		scaleRef.current += velocityRef.current;

		// Apply breathing scale to container
		const scale = scaleRef.current * 1.5;
		containerRef.current.scale.setScalar(scale);

		// Breathing-synchronized particle behavior
		const phase = breathState.phase;
		const progress = breathState.progress;

		// Modulate emission based on breathing phase
		if (phase === 'in') {
			// Inhale: more particles, gathering inward
			const intensity = 3 + progress * 4;
			coreEmitterRef.current.rate = new Rate(
				new Span(intensity, intensity + 3),
				new Span(0.05, 0.1),
			);
			ringEmitterRef.current.rate = new Rate(
				new Span(2, 4),
				new Span(0.1, 0.15),
			);
		} else if (phase === 'out') {
			// Exhale: particles flow outward gently
			const intensity = 5 - progress * 3;
			coreEmitterRef.current.rate = new Rate(
				new Span(intensity, intensity + 2),
				new Span(0.08, 0.15),
			);
			ringEmitterRef.current.rate = new Rate(
				new Span(1, 2),
				new Span(0.15, 0.25),
			);
		} else if (phase === 'hold-in') {
			// Hold after inhale: calm, sustained glow
			coreEmitterRef.current.rate = new Rate(
				new Span(3, 5),
				new Span(0.1, 0.18),
			);
			ringEmitterRef.current.rate = new Rate(
				new Span(1, 2),
				new Span(0.2, 0.3),
			);
		} else {
			// Hold after exhale: minimal, peaceful
			coreEmitterRef.current.rate = new Rate(
				new Span(1, 3),
				new Span(0.15, 0.25),
			);
			ringEmitterRef.current.rate = new Rate(
				new Span(0, 1),
				new Span(0.25, 0.4),
			);
		}

		// Rotate ring emitter position slowly for orbital effect
		const time = Date.now() * 0.0003;
		const orbitRadius = 0.25 + Math.sin(time * 2) * 0.05;
		ringEmitterRef.current.position.x = Math.cos(time) * orbitRadius;
		ringEmitterRef.current.position.y = Math.sin(time) * orbitRadius;

		// Update Nebula system
		nebulaRef.current.update(delta);
	});

	return <group ref={containerRef} position={[0, 0, 0]} />;
}
