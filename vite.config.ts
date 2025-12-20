import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [react(), cloudflare()],
	build: {
		// Three.js is large but expected - suppress warning
		chunkSizeWarningLimit: 800,
		rollupOptions: {
			output: {
				manualChunks: {
					// Split Three.js into its own chunk for better caching
					three: ['three'],
					'react-three': ['@react-three/fiber', '@react-three/drei'],
					// Split Framer Motion
					'framer-motion': ['framer-motion'],
					// Split Radix UI primitives
					'radix-ui': [
						'@radix-ui/react-slider',
						'@radix-ui/react-dialog',
						'@radix-ui/react-collapsible',
						'@radix-ui/react-toggle-group',
						'@radix-ui/react-label',
						'@radix-ui/react-slot',
					],
				},
			},
		},
	},
});
