import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import Nebula, {
	Alpha,
	Body,
	Emitter,
	Life,
	Position,
	RadialVelocity,
	Radius,
	Rate,
	Scale,
	Span,
	SpriteRenderer,
	Vector3D,
} from 'three-nebula';
import type { ParticleAnimationProps } from './types';

/**
 * Create a soft glowing particle texture
 */
function createGlowTexture(size = 64): THREE.Texture {
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
	gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
	gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
	gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
	gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, size, size);

	const texture = new THREE.CanvasTexture(canvas);
	texture.needsUpdate = true;
	return texture;
}

/**
 * Simple breathing nebula animation.
 *
 * Design philosophy:
 * - Single emitter at center
 * - Particles drift outward gently
 * - Breathing controls emission intensity + group scale
 * - More users = denser particle field
 */
export function NebulaAnimation({
	breathState,
	config,
	moodColor,
	userCount = 1,
}: ParticleAnimationProps) {
	const containerRef = useRef<THREE.Group>(null);
	const nebulaRef = useRef<Nebula | null>(null);
	const emitterRef = useRef<Emitter | null>(null);
	const materialRef = useRef<THREE.SpriteMaterial | null>(null);

	// Smooth scale animation
	const currentScale = useRef(1);
	const targetScale = useRef(1);

	// Initialize nebula system
	useEffect(() => {
		if (!containerRef.current) return;

		const texture = createGlowTexture();
		const material = new THREE.SpriteMaterial({
			map: texture,
			color: new THREE.Color(moodColor || config.primaryColor),
			transparent: true,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
		});
		materialRef.current = material;

		const sprite = new THREE.Sprite(material);

		// Single, simple emitter
		const emitter = new Emitter();
		emitter
			.setRate(new Rate(new Span(3, 6), new Span(0.1, 0.2)))
			.addInitializers([
				new Life(2, 4),
				new Body(sprite),
				new Radius(0.02, 0.06),
				new Position(new Vector3D(0, 0, 0)),
				// Gentle outward drift
				new RadialVelocity(new Span(0.02, 0.05), new Vector3D(0, 0, 1), 180),
			])
			.addBehaviours([
				// Fade out over lifetime
				new Alpha(0.8, 0),
				// Shrink slightly
				new Scale(1, 0.3),
			])
			.emit();

		const nebula = new Nebula();
		const renderer = new SpriteRenderer(containerRef.current, THREE);

		nebula.addEmitter(emitter);
		nebula.addRenderer(renderer);

		nebulaRef.current = nebula;
		emitterRef.current = emitter;

		return () => {
			nebula.destroy();
			texture.dispose();
			material.dispose();
		};
	}, []);

	// Update color when mood changes
	useEffect(() => {
		if (materialRef.current) {
			materialRef.current.color.set(moodColor || config.primaryColor);
		}
	}, [moodColor, config.primaryColor]);

	// Animation loop
	useFrame((_, delta) => {
		if (!(nebulaRef.current && containerRef.current && emitterRef.current))
			return;

		const { phase, progress } = breathState;

		// Calculate target scale based on breath phase
		if (phase === 'in') {
			// Inhale: grow from 0.8 to 1.2
			targetScale.current = 0.8 + progress * 0.4;
		} else if (phase === 'out') {
			// Exhale: shrink from 1.2 to 0.8
			targetScale.current = 1.2 - progress * 0.4;
		} else if (phase === 'hold-in') {
			// Hold at full with subtle pulse
			targetScale.current = 1.2 + Math.sin(Date.now() * 0.005) * 0.02;
		} else {
			// Hold at rest
			targetScale.current = 0.8 + Math.sin(Date.now() * 0.003) * 0.02;
		}

		// Smooth scale transition
		currentScale.current += (targetScale.current - currentScale.current) * 0.1;
		containerRef.current.scale.setScalar(currentScale.current * 2);

		// Adjust emission rate based on breath phase
		// More particles during inhale (gathering energy)
		// Fewer during exhale (releasing)
		let baseRate = 3;
		if (phase === 'in') {
			baseRate = 4 + progress * 4; // 4-8 particles
		} else if (phase === 'out') {
			baseRate = 6 - progress * 4; // 6-2 particles
		} else if (phase === 'hold-in') {
			baseRate = 5;
		} else {
			baseRate = 2;
		}

		// More users = denser particle field
		const userMultiplier = Math.min(
			1 + Math.log10(Math.max(userCount, 1)) * 0.3,
			2,
		);
		const finalRate = baseRate * userMultiplier;

		emitterRef.current.rate = new Rate(
			new Span(finalRate, finalRate + 2),
			new Span(0.08, 0.15),
		);

		// Update nebula
		nebulaRef.current.update(delta);
	});

	return <group ref={containerRef} />;
}
