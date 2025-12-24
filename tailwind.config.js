/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				// Cosmic void - deep space blacks
				void: {
					DEFAULT: '#050714',
					deep: '#020408',
					light: '#0a0f1f',
				},
				// Nebula palette - ethereal purples and magentas
				nebula: {
					DEFAULT: '#6b21a8',
					glow: '#a855f7',
					soft: '#c4b5fd',
					deep: '#3b0764',
					mist: 'rgba(168, 85, 247, 0.15)',
				},
				// Aurora - cosmic greens and teals
				aurora: {
					DEFAULT: '#22d3ee',
					bright: '#67e8f9',
					soft: '#a5f3fc',
					deep: '#0891b2',
					glow: 'rgba(34, 211, 238, 0.3)',
				},
				// Stardust - warm celestial accents
				stardust: {
					DEFAULT: '#fbbf24',
					bright: '#fcd34d',
					soft: '#fef3c7',
					rose: '#fb7185',
					copper: '#f97316',
				},
				// Cosmic whites and silvers
				stellar: {
					DEFAULT: 'rgba(255, 255, 255, 0.95)',
					soft: 'rgba(255, 255, 255, 0.7)',
					muted: 'rgba(255, 255, 255, 0.5)',
					dim: 'rgba(255, 255, 255, 0.3)',
					faint: 'rgba(255, 255, 255, 0.15)',
					ghost: 'rgba(255, 255, 255, 0.08)',
				},
				// Legacy support
				primary: '#22d3ee',
				background: {
					DEFAULT: '#050714',
					mid: '#0a0f1f',
				},
				// Cosmic moods
				mood: {
					moment: '#67e8f9',
					anxious: '#c4b5fd',
					processing: '#94a3b8',
					preparing: '#86efac',
					grateful: '#fcd34d',
					celebrating: '#fb923c',
					here: '#a5f3fc',
				},
			},
			fontFamily: {
				serif: ['Spectral', 'Georgia', 'serif'],
				sans: ['Outfit', 'system-ui', 'sans-serif'],
				display: ['Spectral', 'Georgia', 'serif'],
			},
			fontSize: {
				'display-lg': ['4rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '300' }],
				'display': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.01em', fontWeight: '300' }],
				'display-sm': ['2rem', { lineHeight: '1.2', letterSpacing: '0', fontWeight: '400' }],
				'title': ['1.5rem', { lineHeight: '1.3', letterSpacing: '0.05em', fontWeight: '300' }],
				'body': ['1rem', { lineHeight: '1.6', fontWeight: '300' }],
				'caption': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.1em', fontWeight: '400' }],
			},
			animation: {
				'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'fade-in': 'fadeIn 0.5s ease-out',
				'fade-in-up': 'fadeInUp 0.6s ease-out',
				'fade-in-down': 'fadeInDown 0.6s ease-out',
				'scale-in': 'scaleIn 0.4s ease-out',
				'glow-pulse': 'glowPulse 3s ease-in-out infinite',
				'float': 'float 6s ease-in-out infinite',
				'shimmer': 'shimmer 2.5s linear infinite',
				'twinkle': 'twinkle 4s ease-in-out infinite',
				'aurora-shift': 'auroraShift 8s ease-in-out infinite',
				'nebula-drift': 'nebulaDrift 20s linear infinite',
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				fadeInUp: {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
				fadeInDown: {
					'0%': { opacity: '0', transform: 'translateY(-20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
				scaleIn: {
					'0%': { opacity: '0', transform: 'scale(0.9)' },
					'100%': { opacity: '1', transform: 'scale(1)' },
				},
				glowPulse: {
					'0%, 100%': { opacity: '0.4', filter: 'blur(20px)' },
					'50%': { opacity: '0.8', filter: 'blur(30px)' },
				},
				float: {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' },
				},
				shimmer: {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' },
				},
				twinkle: {
					'0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
					'50%': { opacity: '1', transform: 'scale(1.2)' },
				},
				auroraShift: {
					'0%, 100%': { opacity: '0.3', transform: 'translateX(-5%) rotate(0deg)' },
					'50%': { opacity: '0.5', transform: 'translateX(5%) rotate(2deg)' },
				},
				nebulaDrift: {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' },
				},
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
			},
			backgroundImage: {
				'cosmic-gradient': 'radial-gradient(ellipse at center, rgba(107, 33, 168, 0.15) 0%, transparent 70%)',
				'aurora-gradient': 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(168, 85, 247, 0.1) 50%, rgba(251, 113, 133, 0.05) 100%)',
				'stardust-gradient': 'radial-gradient(circle at 30% 20%, rgba(251, 191, 36, 0.1) 0%, transparent 50%)',
				'nebula-radial': 'radial-gradient(ellipse at 50% 50%, rgba(168, 85, 247, 0.2) 0%, rgba(107, 33, 168, 0.1) 40%, transparent 70%)',
			},
			boxShadow: {
				'glow-sm': '0 0 15px rgba(168, 85, 247, 0.3)',
				'glow': '0 0 30px rgba(168, 85, 247, 0.4)',
				'glow-lg': '0 0 60px rgba(168, 85, 247, 0.5)',
				'glow-aurora': '0 0 40px rgba(34, 211, 238, 0.4)',
				'glow-stardust': '0 0 30px rgba(251, 191, 36, 0.3)',
				'cosmic': '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 60px rgba(168, 85, 247, 0.1)',
				'cosmic-inset': 'inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
			},
			backdropBlur: {
				xs: '2px',
			},
		},
	},
	plugins: [],
};
