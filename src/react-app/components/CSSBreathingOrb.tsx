import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { BreathState } from '../hooks/useBreathSync';
import type { VisualizationConfig } from '../lib/config';

interface CSSBreathingOrbProps {
	breathState: BreathState;
	config: VisualizationConfig;
	moodColor: string;
	userCount?: number;
}

/**
 * Pure CSS breathing orb - no WebGL required.
 * Simple, beautiful, reliable animation for iOS.
 *
 * Design:
 * - Inhale: contracts, gathering energy
 * - Exhale: expands, releasing energy
 * - More users = denser particle field
 */
export function CSSBreathingOrb({
	breathState,
	config,
	moodColor,
	userCount = 1,
}: CSSBreathingOrbProps) {
	const { phase, progress } = breathState;
	const color = moodColor || config.primaryColor;

	// Simple scale calculation based on breath phase
	const scale = useMemo(() => {
		switch (phase) {
			case 'in':
				// Inhale: grow from 0.7 to 1.1
				return 0.7 + progress * 0.4;
			case 'out':
				// Exhale: shrink from 1.1 to 0.7
				return 1.1 - progress * 0.4;
			case 'hold-in':
				return 1.1;
			case 'hold-out':
				return 0.7;
			default:
				return 0.9;
		}
	}, [phase, progress]);

	// User presence affects glow intensity
	// More users = brighter, more vibrant
	const userGlow = Math.min(1 + Math.log10(Math.max(userCount, 1)) * 0.2, 1.5);

	// Generate particles - more users = more particles
	const particleCount = Math.min(24 + Math.floor(userCount / 5), 48);
	const particles = useMemo(() => {
		return Array.from({ length: particleCount }, (_, i) => {
			const angle = (i / particleCount) * Math.PI * 2;
			const radius = 0.8 + Math.random() * 0.4;
			const size = 3 + Math.random() * 3;
			const delay = (i / particleCount) * 2;

			return { angle, radius, size, delay, id: i };
		});
	}, [particleCount]);

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
			{/* Ambient background glow */}
			<motion.div
				animate={{ scale: scale * 1.3, opacity: 0.3 * userGlow }}
				transition={{ type: 'spring', stiffness: 80, damping: 20 }}
				style={{
					position: 'absolute',
					width: '90vmin',
					height: '90vmin',
					borderRadius: '50%',
					background: `radial-gradient(circle, ${color}25 0%, ${color}10 40%, transparent 70%)`,
					filter: 'blur(40px)',
				}}
			/>

			{/* Core glow */}
			<motion.div
				animate={{ scale, opacity: 0.7 * userGlow }}
				transition={{ type: 'spring', stiffness: 100, damping: 18 }}
				style={{
					position: 'absolute',
					width: '35vmin',
					height: '35vmin',
					borderRadius: '50%',
					background: `radial-gradient(circle, ${color}80 0%, ${color}40 40%, ${color}10 70%, transparent 100%)`,
					filter: 'blur(8px)',
				}}
			/>

			{/* Main breathing ring */}
			<motion.div
				animate={{ scale, opacity: 0.8 }}
				transition={{ type: 'spring', stiffness: 120, damping: 15 }}
				style={{
					position: 'absolute',
					width: '40vmin',
					height: '40vmin',
					borderRadius: '50%',
					border: `2px solid ${color}`,
					boxShadow: `
						0 0 20px ${color}50,
						0 0 40px ${color}25,
						inset 0 0 20px ${color}20
					`,
				}}
			/>

			{/* Particle ring */}
			<motion.div
				animate={{
					scale,
					rotate: phase === 'in' ? -3 : phase === 'out' ? 3 : 0,
				}}
				transition={{ type: 'spring', stiffness: 60, damping: 20 }}
				style={{
					position: 'absolute',
					width: '45vmin',
					height: '45vmin',
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
							background: `radial-gradient(circle, ${color} 0%, ${color}50 50%, transparent 100%)`,
							boxShadow: `0 0 ${p.size * 2}px ${color}40`,
						}}
						animate={{
							x: `${Math.cos(p.angle) * 20 * p.radius}vmin`,
							y: `${Math.sin(p.angle) * 20 * p.radius}vmin`,
							opacity: [0.4, 0.8, 0.4],
							scale: [0.8, 1.1, 0.8],
						}}
						transition={{
							x: { type: 'spring', stiffness: 100, damping: 20 },
							y: { type: 'spring', stiffness: 100, damping: 20 },
							opacity: {
								duration: 2,
								repeat: Infinity,
								ease: 'easeInOut',
								delay: p.delay,
							},
							scale: {
								duration: 2,
								repeat: Infinity,
								ease: 'easeInOut',
								delay: p.delay,
							},
						}}
					/>
				))}
			</motion.div>

			{/* User count indicator - subtle ring that grows with more users */}
			{userCount > 1 && (
				<motion.div
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{
						opacity: Math.min(0.15 + userCount * 0.02, 0.4),
						scale: scale * (1 + Math.log10(userCount) * 0.1),
					}}
					transition={{ type: 'spring', stiffness: 80, damping: 25 }}
					style={{
						position: 'absolute',
						width: '55vmin',
						height: '55vmin',
						borderRadius: '50%',
						border: `1px solid ${color}40`,
						boxShadow: `0 0 30px ${color}15`,
					}}
				/>
			)}
		</div>
	);
}
