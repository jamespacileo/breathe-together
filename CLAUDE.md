# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev       # Start Vite dev server at localhost:5173
npm run build     # TypeScript compile + Vite production build
npm run check     # Type check + build + dry-run deploy (use before committing)
npm run deploy    # Deploy to Cloudflare Workers
npm run lint      # Run Biome linter
npm run preview   # Build and preview production locally
npx wrangler tail # Monitor deployed worker logs
```

## Architecture

Full-stack React + Hono application deployed on Cloudflare Workers.

### Frontend (`src/react-app/`)
- React 19 + TypeScript + Vite
- Entry point: `main.tsx` → `App.tsx`
- TypeScript config: `tsconfig.app.json`

### Backend (`src/worker/`)
- Hono framework on Cloudflare Workers
- Entry point: `index.ts`
- TypeScript config: `tsconfig.worker.json`
- Static assets served from `./dist/client` with SPA fallback

## Application: Breathing Meditation Visualizer

A collaborative breathing app where all users worldwide are synchronized via UTC time.

### Key Components
- `components/BreathingOrb.tsx` - Main orchestrator for breathing visualization
- `components/GPGPUParticles/` - Three.js GPGPU particle system with custom shaders
- `components/DebugPanel.tsx` - Live parameter tuning UI (dev mode)

### Custom Hooks
- `hooks/useBreathSync.ts` - UTC-synchronized breathing state (phase, progress, cycle position)
- `hooks/usePresence.ts` - Global presence tracking with heartbeat polling
- `hooks/useSimulation.ts` - Development user population simulation

### Configuration System
- `lib/config.ts` - Visualization parameters (VisualizationConfig type)
- `lib/patterns.ts` - Breathing patterns (Box 4-4-4-4, 4-7-8 Relaxation)
- `lib/colors.ts` - Color palettes and mood configurations
- `lib/simulationConfig.ts` - User simulation configuration

### Rendering Patterns
- Three.js with React Three Fiber for 3D rendering
- GPGPU simulation for particle physics on GPU
- Custom GLSL shaders for particle appearance and motion
- Post-processing effects (vignette, noise)

### Global Synchronization
All users breathe together using UTC: `Date.now() % totalPatternDuration` determines current phase.
