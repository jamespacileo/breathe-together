/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				// PlayStation + Apple inspired palette
				primary: {
					DEFAULT: '#00D4FF', // Bright cyan accent
					soft: '#7EB5C1',
					glow: '#00D4FF40',
				},
				surface: {
					DEFAULT: 'rgba(0, 0, 0, 0.6)',
					solid: '#0a0e14',
					elevated: 'rgba(20, 28, 40, 0.8)',
				},
				background: {
					DEFAULT: '#060a10',
					mid: '#0d1219',
					gradient: '#0a1020',
				},
				// Refined mood colors with better saturation
				mood: {
					moment: '#00D4FF',
					anxious: '#B088C0',
					processing: '#88A0B8',
					preparing: '#88B088',
					grateful: '#A0C888',
					celebrating: '#D4B888',
					here: '#88B8C8',
				},
			},
			fontFamily: {
				// SF Pro inspired stack
				sans: [
					'-apple-system',
					'BlinkMacSystemFont',
					'SF Pro Display',
					'Segoe UI',
					'Roboto',
					'Helvetica Neue',
					'sans-serif',
				],
			},
			fontSize: {
				'2xs': ['0.625rem', { lineHeight: '0.875rem' }],
			},
			letterSpacing: {
				'widest-plus': '0.15em',
			},
			borderRadius: {
				'4xl': '2rem',
			},
			boxShadow: {
				'glow-sm': '0 0 10px rgba(0, 212, 255, 0.3)',
				'glow-md': '0 0 20px rgba(0, 212, 255, 0.4)',
				'glow-lg': '0 0 30px rgba(0, 212, 255, 0.5)',
				'inner-glow': 'inset 0 1px 1px rgba(255, 255, 255, 0.1)',
				glass: '0 8px 32px rgba(0, 0, 0, 0.4)',
			},
			animation: {
				'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'fade-in': 'fadeIn 0.3s ease-out',
				'fade-in-up': 'fadeInUp 0.4s ease-out',
				'scale-in': 'scaleIn 0.2s ease-out',
				'glow-pulse': 'glowPulse 3s ease-in-out infinite',
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				fadeInUp: {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
				scaleIn: {
					'0%': { opacity: '0', transform: 'scale(0.95)' },
					'100%': { opacity: '1', transform: 'scale(1)' },
				},
				glowPulse: {
					'0%, 100%': { boxShadow: '0 0 15px rgba(0, 212, 255, 0.3)' },
					'50%': { boxShadow: '0 0 25px rgba(0, 212, 255, 0.5)' },
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
			backdropBlur: {
				xs: '2px',
			},
		},
	},
	plugins: [],
};
