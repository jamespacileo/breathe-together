# Refactoring Plan: Three-Nebula Integration

## Current State Analysis

### Problems with Current Implementation
1. **Complex custom code** - `ParticleSystem.tsx` is 372 lines of manual particle management
2. **Custom shaders** - Hand-written vertex/fragment shaders are hard to maintain
3. **Manual position calculations** - Spiral arm, core, halo logic is complex and fragile
4. **No visual editor** - Tweaking effects requires code changes and rebuilds
5. **Doesn't look like a nebula** - Despite complexity, the visual result is underwhelming

### Current File Structure
```
src/react-app/components/r3f/
├── ParticleSystem.tsx    # 372 lines - custom particles (REPLACE)
├── GlowEffect.tsx        # 117 lines - radial glow (SIMPLIFY/REMOVE)
├── BreathingScene.tsx    # 95 lines - canvas wrapper (KEEP, modify)
└── PresenceParticles.tsx # presence indicators (KEEP)
```

---

## Proposed Solution: Three-Nebula

### Why Three-Nebula?
- **Declarative JSON config** - Define particle systems without code
- **Built-in behaviors** - Alpha, Scale, Color, Rotate, Force, etc.
- **Professional particle physics** - Gravity, attraction, repulsion
- **Visual editor available** - Nebula Editor for designing effects
- **Battle-tested** - Used in production 3D applications

### New Architecture

```
src/react-app/components/r3f/
├── NebulaSystem.tsx      # ~80 lines - three-nebula wrapper
├── nebulaConfigs/
│   └── galaxy.json       # Declarative particle config
├── BreathingScene.tsx    # Simplified, uses NebulaSystem
└── PresenceParticles.tsx # (unchanged)

lib/
└── nebulaEngine.ts       # Singleton engine for nebula management
```

---

## Implementation Steps

### Step 1: Install three-nebula
```bash
npm install three-nebula
```

### Step 2: Create Nebula Engine (lib/nebulaEngine.ts)
Simple singleton class to manage particle system lifecycle:
- `loadSystem(json, scene)` - Initialize from JSON config
- `update()` - Called each frame
- `setBreathingState(factor)` - Control contraction/expansion

### Step 3: Create Galaxy JSON Config (nebulaConfigs/galaxy.json)
Declarative particle system definition:
```json
{
  "emitters": [
    {
      "rate": { "particlesMin": 5, "particlesMax": 10, "perSecondMin": 0.01, "perSecondMax": 0.02 },
      "initializers": [
        { "type": "Position", "properties": { "zone": { "type": "SphereZone", "radius": 50 }}},
        { "type": "Life", "properties": { "min": 2, "max": 4 }},
        { "type": "Radius", "properties": { "min": 1, "max": 3 }}
      ],
      "behaviours": [
        { "type": "Alpha", "properties": { "start": 1, "end": 0 }},
        { "type": "Scale", "properties": { "start": 0.5, "end": 1.5 }},
        { "type": "Color", "properties": { "start": "#9B7EBD", "end": "#7EB5C1" }}
      ]
    }
  ]
}
```

### Step 4: Create NebulaSystem Component (~80 lines)
```tsx
// Simplified React component
export function NebulaSystem({ breathState, config, moodColor }) {
  const { scene } = useThree();
  const [system, setSystem] = useState(null);

  useEffect(() => {
    // Load nebula from JSON
    nebulaEngine.loadSystem(galaxyConfig, scene).then(setSystem);
    return () => system?.destroy();
  }, []);

  useFrame(() => {
    if (!system) return;
    // Update breathing state
    const breathFactor = calculateBreathFactor(breathState, config);
    nebulaEngine.setBreathingState(breathFactor);
    system.update();
  });

  return null; // Nebula renders directly to scene
}
```

### Step 5: Add Bloom Post-Processing
Use already-installed `@react-three/postprocessing`:
```tsx
import { EffectComposer, Bloom } from '@react-three/postprocessing';

<EffectComposer>
  <Bloom luminanceThreshold={0.2} intensity={0.5} />
</EffectComposer>
```

### Step 6: Remove Old Code
- Delete `ParticleSystem.tsx` (372 lines)
- Delete or simplify `GlowEffect.tsx` (bloom replaces it)
- Clean up unused config parameters

---

## Code Reduction Summary

| File | Before | After | Change |
|------|--------|-------|--------|
| ParticleSystem.tsx | 372 lines | 0 (deleted) | -372 |
| NebulaSystem.tsx | 0 | ~80 lines | +80 |
| nebulaEngine.ts | 0 | ~40 lines | +40 |
| galaxy.json | 0 | ~50 lines | +50 |
| GlowEffect.tsx | 117 lines | 0 (deleted) | -117 |
| BreathingScene.tsx | 95 lines | ~70 lines | -25 |
| **Total** | **584 lines** | **~240 lines** | **-344 lines (59% reduction)** |

---

## Benefits

1. **Simpler code** - 59% less code to maintain
2. **Better visuals** - Professional particle behaviors out of the box
3. **Easier tweaking** - JSON config instead of shader code
4. **Bloom effect** - Beautiful glow like music visualizers
5. **Future-proof** - Easy to add new effects (trails, sparks, etc.)

---

## Alternative: Sparkles + Bloom (Even Simpler)

If three-nebula feels too heavy, we could use `@react-three/drei`'s `Sparkles`:

```tsx
import { Sparkles } from '@react-three/drei';

<Sparkles
  count={500}
  scale={breathScale}
  size={3}
  speed={0.3}
  color="#9B7EBD"
/>
```

This is ~10 lines vs 372, but less customizable than three-nebula.

---

## Recommendation

**Go with three-nebula** because:
- More control over particle behavior
- Better nebula/galaxy effect
- JSON config is easy to tweak
- Still much simpler than current custom code

Would you like me to proceed with implementation?
