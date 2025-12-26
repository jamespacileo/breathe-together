import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig, type AliasOptions } from 'vite';

export default defineConfig(({ mode }) => {
	// Exclude Theatre.js Studio from production builds
	const productionAlias: AliasOptions =
		mode === 'production'
			? {
					'@theatre/studio': new URL(
						'./src/react-app/lib/theatre/studioStub.ts',
						import.meta.url,
					).pathname,
				}
			: {};

	return {
		plugins: [react(), cloudflare()],
		resolve: {
			alias: productionAlias,
		},
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
						// Split Theatre.js core (studio excluded in production via alias)
						theatre: ['@theatre/core'],
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
	};
});
