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
- `components/BreathingOrb.tsx` - Main orchestrator combining all visual layers
- `components/ParticleField.tsx` - WebGL particle system (200+ particles with spring physics)
- `components/GlowOverlay.tsx` - 2D canvas radial gradient effects

### Custom Hooks
- `hooks/useBreathSync.ts` - UTC-synchronized breathing state (phase, progress, cycle position)
- `hooks/usePresence.ts` - Global presence tracking with heartbeat polling
- `hooks/useLevaControls.ts` - Dev-mode parameter tuning via Leva GUI (Cmd+Shift+D to toggle)

### Configuration System
- `lib/config.ts` - 22 visualization parameters (VisualizationConfig type)
- `lib/spring.ts` - Damped harmonic oscillator physics (tension, friction)
- `lib/patterns.ts` - Breathing patterns (Box 4-4-4-4, 4-7-8 Relaxation)
- `lib/colors.ts` - Color palettes and mood configurations

### Rendering Patterns
- WebGL POINTS for particle rendering with custom shaders
- Trail effect via partial buffer clear
- Separate 2D canvas layer for radial gradients (WebGL limitation)
- 60fps animation loops via requestAnimationFrame

### Global Synchronization
All users breathe together using UTC: `Date.now() % totalPatternDuration` determines current phase.
