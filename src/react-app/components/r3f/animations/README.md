# Animation System

This folder contains the modular animation system for the breathing visualizer. Each animation is a self-contained React component that renders within a React Three Fiber canvas.

## Architecture

```
animations/
├── types.ts           # Shared types (AnimationProps, AnimationId)
├── registry.ts        # Animation registry and metadata
├── index.ts           # Public exports
├── OrbAnimation.tsx   # Classic breathing orb
├── GalaxyAnimation.tsx # Spiral galaxy animation
└── README.md          # This file
```

## Adding a New Animation

### Step 1: Create the Animation Component

Create a new file `YourAnimation.tsx`:

```tsx
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { calculateTargetScale } from '../../../hooks/useBreathingSpring';
import type { AnimationProps } from './types';

export function YourAnimation({
  breathState,
  config,
  moodColor,
}: AnimationProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Use breathState to sync with breathing cycle:
  // - breathState.phase: 'inhale' | 'holdIn' | 'exhale' | 'holdOut'
  // - breathState.progress: 0-1 progress within current phase
  // - breathState.cyclePosition: 0-1 position in full breathing cycle

  // Calculate target scale based on breath phase
  const targetScale = calculateTargetScale(breathState, config);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Animate based on targetScale and time
    const time = state.clock.elapsedTime;
    // Your animation logic here
  });

  return (
    <mesh ref={meshRef}>
      {/* Your Three.js geometry and materials */}
    </mesh>
  );
}
```

### Step 2: Register the Animation

Update `types.ts` to add your animation ID:

```ts
export type AnimationId = 'orb' | 'galaxy' | 'yourAnimation';
```

Update `registry.ts`:

```ts
// Add lazy import at top
const YourAnimation = () =>
  import('./YourAnimation').then((m) => ({ default: m.YourAnimation }));

// Add to ANIMATION_REGISTRY
export const ANIMATION_REGISTRY: Record<AnimationId, AnimationMeta> = {
  // ... existing animations
  yourAnimation: {
    id: 'yourAnimation',
    name: 'Your Animation',
    description: 'Description of what it does',
    component: null as never,
  },
};

// Add to ANIMATION_LOADERS
export const ANIMATION_LOADERS: Record<...> = {
  // ... existing loaders
  yourAnimation: YourAnimation,
};
```

### Step 3: Add to AnimationRenderer

Update `AnimationRenderer.tsx`:

```ts
import { YourAnimation } from './animations';

const ANIMATION_COMPONENTS: Record<AnimationId, ...> = {
  orb: OrbAnimation,
  galaxy: GalaxyAnimation,
  yourAnimation: YourAnimation,
};
```

### Step 4: Export the Animation

Update `index.ts`:

```ts
export { YourAnimation } from './YourAnimation';
```

### Step 5: Add UI Option

Update `AnimationSelector.tsx`:

```ts
const ANIMATION_OPTIONS = [
  { id: 'orb', label: 'Orb', icon: '○' },
  { id: 'galaxy', label: 'Galaxy', icon: '✦' },
  { id: 'yourAnimation', label: 'Your Anim', icon: '◇' },
];
```

## AnimationProps Reference

```ts
interface AnimationProps {
  breathState: BreathState;  // Current breathing state
  config: VisualizationConfig;  // Visual parameters (colors, sizes, etc.)
  moodColor: string;  // User's mood color (hex string)
}

interface BreathState {
  phase: 'inhale' | 'holdIn' | 'exhale' | 'holdOut';
  progress: number;      // 0-1 within current phase
  cyclePosition: number; // 0-1 within full cycle
  timestamp: number;
}
```

## Key Config Values

From `VisualizationConfig` (see `lib/config.ts`):

| Property | Description |
|----------|-------------|
| `particleCount` | Number of particles (10-500) |
| `baseRadius` | Base size of animation (0.1-0.45) |
| `breatheInScale` | Scale when inhaling (0.3-1.0) |
| `breatheOutScale` | Scale when exhaling (1.0-2.0) |
| `primaryColor` | Main color (hex string) |
| `glowIntensity` | Glow effect strength (0-1) |

## Error Handling

Animations are wrapped in `AnimationErrorBoundary`. If your animation throws an error:

1. An error panel displays with a copyable stack trace
2. Users can click "Try Again" to reset
3. The system can fall back to the default animation

## Tips

- Use `useMemo` for expensive particle data generation
- Use `useRef` for values that change every frame (avoid re-renders)
- Use `useFrame` for animation loops (not `requestAnimationFrame`)
- Use Three.js `AdditiveBlending` for glowing particle effects
- Keep shader code simple for mobile performance
- Test on mobile devices (lower particle counts may be needed)
