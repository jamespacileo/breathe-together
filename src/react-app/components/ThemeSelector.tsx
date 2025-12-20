import { motion } from 'framer-motion';
import type { VisualizationTheme } from '../stores/appStore';

interface ThemeSelectorProps {
	theme: VisualizationTheme;
	onChange: (theme: VisualizationTheme) => void;
}

const THEMES: { id: VisualizationTheme; label: string; icon: string }[] = [
	{ id: 'orb', label: 'Orb', icon: '◯' },
	{ id: 'water', label: 'Water', icon: '〰' },
];

export function ThemeSelector({ theme, onChange }: ThemeSelectorProps) {
	return (
		<div
			style={{
				display: 'flex',
				gap: '0.5rem',
				background: 'rgba(255, 255, 255, 0.08)',
				borderRadius: '0.5rem',
				padding: '0.25rem',
				backdropFilter: 'blur(8px)',
			}}
		>
			{THEMES.map((t) => (
				<motion.button
					key={t.id}
					onClick={() => onChange(t.id)}
					style={{
						background:
							theme === t.id ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
						border: 'none',
						borderRadius: '0.375rem',
						padding: '0.5rem 0.75rem',
						color: theme === t.id ? 'white' : 'rgba(255, 255, 255, 0.6)',
						cursor: 'pointer',
						fontSize: '0.875rem',
						display: 'flex',
						alignItems: 'center',
						gap: '0.375rem',
						transition: 'all 0.2s ease',
					}}
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
				>
					<span style={{ fontSize: '1rem' }}>{t.icon}</span>
					{t.label}
				</motion.button>
			))}
		</div>
	);
}
