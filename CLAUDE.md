# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev       # Start Vite dev server at localhost:5173
npm run build     # TypeScript compile + Vite production build
npm run check     # Type check + build + dry-run deploy (use before committing)
npm run deploy    # Deploy to Cloudflare Workers
npm run lint      # Run ESLint
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
- `components/BreathingOrb.tsx` - Main orchestrator with phase text and progress bar
- `components/GPGPUParticles/` - Three.js particle system with post-processing:
  - `GPGPUScene.tsx` - Main scene with bloom, vignette, and film grain effects
  - `BreathingSphere.tsx` - Central breathing sphere visualization
  - `UserParticles.tsx` - Dyson swarm of user particles with mood colors
  - `PeripheralParticles.tsx` - Sparse outer particle ring
  - `StarField.tsx` - Twinkling star layer
  - `GalaxyBackground.tsx` - Atmospheric background

### Custom Hooks
- `hooks/useBreathSync.ts` - UTC-synchronized breathing state (phase, progress, cycle position)
- `hooks/usePresence.ts` - Global presence tracking with heartbeat polling
- `hooks/useBreathingSpring.ts` - Framer Motion spring physics for breathing animation
- `hooks/useSimulation.ts` - Population simulation engine (M/M/∞ queueing model)
- `hooks/useLevaControls.ts` - Dev-mode parameter tuning via Leva GUI (Cmd+Shift+D to toggle)

### Configuration System
- `lib/config.ts` - Visualization parameters with Zod validation (VisualizationConfig type)
- `lib/patterns.ts` - Breathing patterns (Box 4-4-4-4, 4-7-8 Relaxation)
- `lib/colors.ts` - Color palettes and mood configurations

### Library Utilities
- `lib/breathEasing.ts` - Physiological easing functions (anticipation, overshoot, diaphragm simulation)
- `lib/simulation.ts` - SimulationEngine class for synthetic user testing
- `lib/simulationConfig.ts` - Configuration for population simulation
- `lib/userGenerator.ts` - Generates synthetic users with moods

### Rendering Patterns
- Three.js with React Three Fiber for 3D scene management
- Post-processing effects: bloom, vignette, film grain
- 60fps animation loops via requestAnimationFrame

### Global Synchronization
All users breathe together using UTC: `Date.now() % totalPatternDuration` determines current phase.
