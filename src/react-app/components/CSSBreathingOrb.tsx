import { motion, useSpring, useTransform } from 'framer-motion';
import { useMemo } from 'react';
import type { BreathState } from '../hooks/useBreathSync';
import type { VisualizationConfig } from '../lib/config';

interface CSSBreathingOrbProps {
	breathState: BreathState;
	config: VisualizationConfig;
	moodColor: string;
}

/**
 * Pure CSS breathing orb - no WebGL required.
 * Inhale: contracted, focused circle
 * Exhale: expanded, relaxed, scattered
 */
export function CSSBreathingOrb({
	breathState,
	config,
	moodColor,
}: CSSBreathingOrbProps) {
	const { phase, progress } = breathState;

	// Calculate scale: inhale = contract (small), exhale = expand (large)
	const targetScale = useMemo(() => {
		if (phase === 'in') {
			// Inhale: contract from 1.0 to 0.6 (getting smaller/tighter)
			return 1.0 - progress * 0.4;
		} else if (phase === 'out') {
			// Exhale: expand from 0.6 to 1.2 (getting larger/relaxed)
			return 0.6 + progress * 0.6;
		} else if (phase === 'hold-in') {
			// Hold after inhale: stay contracted with subtle pulse
			return 0.6 + Math.sin(Date.now() * 0.003) * 0.02;
		} else {
			// Hold after exhale: stay expanded with gentle drift
			return 1.2 + Math.sin(Date.now() * 0.002) * 0.03;
		}
	}, [phase, progress]);

	const scale = useSpring(targetScale, {
		stiffness: 120,
		damping: 20,
	});

	// Particles scatter on exhale, gather on inhale
	const particleSpread = useSpring(
		phase === 'out' || phase === 'hold-out' ? 1.3 : 0.85,
		{ stiffness: 80, damping: 15 },
	);

	// Glow intensity: brighter when contracted (focused), softer when expanded
	const glowIntensity = useTransform(scale, [0.6, 1.2], [1, 0.5]);

	// Ring opacity: more visible when contracted
	const ringOpacity = useTransform(scale, [0.6, 1.2], [0.9, 0.4]);

	// Generate particles
	const particles = useMemo(() => {
		const count = 48;
		return Array.from({ length: count }, (_, i) => {
			const baseAngle = (i / count) * Math.PI * 2;
			const radiusOffset = 0.85 + Math.random() * 0.3;
			const size = 2 + Math.random() * 4;
			const opacity = 0.3 + Math.random() * 0.5;
			const pulseDelay = Math.random() * Math.PI * 2;
			const driftSpeed = 0.5 + Math.random() * 1;

			return {
				baseAngle,
				radiusOffset,
				size,
				opacity,
				pulseDelay,
				driftSpeed,
				id: i,
			};
		});
	}, []);

	const color = moodColor || config.primaryColor;

	// Phase-based rotation for organic feel
	const rotation = useSpring(phase === 'in' ? -5 : phase === 'out' ? 5 : 0, {
		stiffness: 30,
		damping: 20,
	});

	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				overflow: 'hidden',
			}}
		>
			{/* Outer ambient glow - expands on exhale */}
			<motion.div
				style={{
					position: 'absolute',
					width: '100vmin',
					height: '100vmin',
					borderRadius: '50%',
					background: `radial-gradient(circle, ${color}30 0%, ${color}15 30%, ${color}05 50%, transparent 70%)`,
					filter: 'blur(30px)',
					scale: useTransform(scale, (s) => s * 1.2),
					opacity: useTransform(scale, [0.6, 1.2], [0.4, 0.8]),
				}}
			/>

			{/* Middle glow ring */}
			<motion.div
				style={{
					position: 'absolute',
					width: '60vmin',
					height: '60vmin',
					borderRadius: '50%',
					background: `radial-gradient(circle, transparent 40%, ${color}20 60%, ${color}40 75%, transparent 90%)`,
					filter: 'blur(8px)',
					scale,
					opacity: glowIntensity,
				}}
			/>

			{/* Core glow - bright when contracted */}
			<motion.div
				style={{
					position: 'absolute',
					width: '25vmin',
					height: '25vmin',
					borderRadius: '50%',
					background: `radial-gradient(circle, ${color}90 0%, ${color}50 30%, ${color}20 60%, transparent 80%)`,
					filter: 'blur(5px)',
					scale,
					opacity: glowIntensity,
				}}
			/>

			{/* Main breathing ring */}
			<motion.div
				style={{
					position: 'absolute',
					width: '45vmin',
					height: '45vmin',
					borderRadius: '50%',
					border: `2px solid ${color}`,
					boxShadow: `
						0 0 15px ${color}60,
						0 0 30px ${color}30,
						inset 0 0 15px ${color}30
					`,
					scale,
					opacity: ringOpacity,
					rotate: rotation,
				}}
			/>

			{/* Secondary inner ring */}
			<motion.div
				style={{
					position: 'absolute',
					width: '35vmin',
					height: '35vmin',
					borderRadius: '50%',
					border: `1px solid ${color}60`,
					scale,
					opacity: useTransform(scale, [0.6, 1.2], [0.7, 0.2]),
					rotate: useTransform(rotation, (r) => -r * 0.5),
				}}
			/>

			{/* Particles container with rotation */}
			<motion.div
				style={{
					position: 'absolute',
					width: '50vmin',
					height: '50vmin',
					rotate: useTransform(rotation, (r) => r * 0.3),
					scale: particleSpread,
				}}
			>
				{particles.map((p) => (
					<motion.div
						key={p.id}
						style={{
							position: 'absolute',
							left: '50%',
							top: '50%',
							width: p.size,
							height: p.size,
							marginLeft: -p.size / 2,
							marginTop: -p.size / 2,
							borderRadius: '50%',
							background: `radial-gradient(circle, ${color} 0%, ${color}60 40%, transparent 70%)`,
							boxShadow: `0 0 ${p.size}px ${color}40`,
						}}
						animate={{
							opacity: [p.opacity * 0.4, p.opacity, p.opacity * 0.4],
							x: [
								Math.cos(p.baseAngle) * 22 * p.radiusOffset,
								Math.cos(p.baseAngle + 0.05) * 23 * p.radiusOffset,
								Math.cos(p.baseAngle) * 22 * p.radiusOffset,
							].map((v) => `${v}vmin`),
							y: [
								Math.sin(p.baseAngle) * 22 * p.radiusOffset,
								Math.sin(p.baseAngle + 0.05) * 23 * p.radiusOffset,
								Math.sin(p.baseAngle) * 22 * p.radiusOffset,
							].map((v) => `${v}vmin`),
							scale: [1, 1.2, 1],
						}}
						transition={{
							duration: 2 + p.driftSpeed,
							repeat: Infinity,
							ease: 'easeInOut',
							delay: p.pulseDelay * 0.3,
						}}
					/>
				))}
			</motion.div>

			{/* Outer scattered particles - more visible on exhale */}
			<motion.div
				style={{
					position: 'absolute',
					width: '70vmin',
					height: '70vmin',
					opacity: useTransform(scale, [0.6, 1.2], [0.2, 0.8]),
				}}
			>
				{particles.slice(0, 24).map((p) => (
					<motion.div
						key={`outer-${p.id}`}
						style={{
							position: 'absolute',
							left: '50%',
							top: '50%',
							width: p.size * 0.6,
							height: p.size * 0.6,
							marginLeft: (-p.size * 0.6) / 2,
							marginTop: (-p.size * 0.6) / 2,
							borderRadius: '50%',
							background: `radial-gradient(circle, ${color}80 0%, transparent 70%)`,
						}}
						animate={{
							opacity: [0.2, 0.5, 0.2],
							x: `${Math.cos(p.baseAngle + Math.PI / 6) * 32 * p.radiusOffset}vmin`,
							y: `${Math.sin(p.baseAngle + Math.PI / 6) * 32 * p.radiusOffset}vmin`,
						}}
						transition={{
							duration: 3 + p.driftSpeed,
							repeat: Infinity,
							ease: 'easeInOut',
							delay: p.pulseDelay * 0.5,
						}}
					/>
				))}
			</motion.div>
		</div>
	);
}
