# Breathe Together

A collaborative breathing meditation app where users worldwide breathe in sync via UTC time synchronization.

## Features

- **Global Synchronization** - All users breathe together using UTC-based timing
- **3D Particle Visualization** - Three.js scene with bloom, vignette, and film grain effects
- **Multiple Breathing Patterns** - Box breathing (4-4-4-4) and 4-7-8 Relaxation
- **Mood-Based Presence** - See other users as colored particles based on their mood
- **Responsive Design** - Works on desktop and mobile devices

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Development

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build
npm run check     # Type check + build + dry-run deploy
npm run test      # Run test suite
npm run deploy    # Deploy to Cloudflare Workers
```

## Tech Stack

**Frontend**
- React 19 + TypeScript
- Three.js with React Three Fiber
- Framer Motion for animations
- Tailwind CSS

**Backend**
- Hono framework on Cloudflare Workers
- Cloudflare KV for presence storage

## Architecture

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation.
