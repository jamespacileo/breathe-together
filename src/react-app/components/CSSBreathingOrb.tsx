import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useBreathingSpring } from '../hooks/useBreathingSpring';
import type { BreathState } from '../hooks/useBreathSync';
import type { VisualizationConfig } from '../lib/config';

interface CSSBreathingOrbProps {
	breathState: BreathState;
	config: VisualizationConfig;
	moodColor: string;
}

/**
 * Pure CSS breathing orb - no WebGL required.
 * Uses CSS transforms, gradients, and blur for a beautiful effect.
 * 100% compatible with iOS Safari.
 */
export function CSSBreathingOrb({
	breathState,
	config,
	moodColor,
}: CSSBreathingOrbProps) {
	const scale = useBreathingSpring(breathState, config);

	// Generate particles using CSS
	const particles = useMemo(() => {
		const count = Math.min(config.particleCount, 60); // Limit for performance
		return Array.from({ length: count }, (_, i) => {
			const angle = (i / count) * Math.PI * 2;
			const radiusVar =
				config.radiusVarianceMin +
				Math.random() * (config.radiusVarianceMax - config.radiusVarianceMin);
			const size =
				config.particleMinSize +
				Math.random() * (config.particleMaxSize - config.particleMinSize);
			const opacity =
				config.particleMinOpacity +
				Math.random() * (config.particleMaxOpacity - config.particleMinOpacity);
			const delay = Math.random() * 2;

			return { angle, radiusVar, size, opacity, delay, id: i };
		});
	}, [config.particleCount]);

	const color = moodColor || config.primaryColor;

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
			{/* Background glow */}
			<motion.div
				style={{
					position: 'absolute',
					width: '80vmin',
					height: '80vmin',
					borderRadius: '50%',
					background: `radial-gradient(circle, ${color}40 0%, ${color}20 30%, ${color}05 60%, transparent 70%)`,
					filter: 'blur(20px)',
					scale,
				}}
			/>

			{/* Core glow */}
			<motion.div
				style={{
					position: 'absolute',
					width: '30vmin',
					height: '30vmin',
					borderRadius: '50%',
					background: `radial-gradient(circle, ${color}60 0%, ${color}30 40%, transparent 70%)`,
					filter: 'blur(10px)',
					scale,
				}}
			/>

			{/* Main breathing ring */}
			<motion.div
				style={{
					position: 'absolute',
					width: '50vmin',
					height: '50vmin',
					borderRadius: '50%',
					border: `2px solid ${color}80`,
					boxShadow: `
						0 0 20px ${color}40,
						0 0 40px ${color}20,
						inset 0 0 20px ${color}20
					`,
					scale,
				}}
			/>

			{/* Particles */}
			<motion.div
				style={{
					position: 'absolute',
					width: '50vmin',
					height: '50vmin',
					scale,
				}}
			>
				{particles.map((p) => (
					<motion.div
						key={p.id}
						style={{
							position: 'absolute',
							left: '50%',
							top: '50%',
							width: p.size * 3,
							height: p.size * 3,
							marginLeft: -(p.size * 3) / 2,
							marginTop: -(p.size * 3) / 2,
							borderRadius: '50%',
							background: `radial-gradient(circle, ${color} 0%, ${color}80 30%, transparent 70%)`,
							opacity: p.opacity,
							transform: `
								rotate(${p.angle}rad)
								translateX(${25 * p.radiusVar}vmin)
							`,
						}}
						animate={{
							opacity: [p.opacity * 0.5, p.opacity, p.opacity * 0.5],
						}}
						transition={{
							duration: 2 + p.delay,
							repeat: Infinity,
							ease: 'easeInOut',
						}}
					/>
				))}
			</motion.div>

			{/* Inner pulse ring */}
			<motion.div
				style={{
					position: 'absolute',
					width: '40vmin',
					height: '40vmin',
					borderRadius: '50%',
					border: `1px solid ${color}40`,
					scale,
				}}
			/>
		</div>
	);
}
