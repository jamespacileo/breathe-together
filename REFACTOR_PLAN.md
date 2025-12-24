# Refactor Plan: Pruning & Consolidation

Based on app review of the breathe-together codebase. Prioritized by impact and risk.

---

## Phase 1: Dead Code Removal (High Impact, Low Risk)

### 1.1 Remove Unused Dependency
**File:** `package.json`
**Action:** Remove `three-nebula` - never imported anywhere
**Impact:** ~10-20KB bundle reduction
**Risk:** None

### 1.2 Delete Dead Component Files
**Files to delete:**
- `src/react-app/components/ParticleBreathing.tsx` (~510 lines)
- `src/react-app/components/r3f/BreathingScene.tsx` (~183 lines)
- `src/react-app/components/r3f/nebula/BreathingSphere.tsx`
- `src/react-app/components/r3f/nebula/ConnectionLines.tsx`
- `src/react-app/components/r3f/nebula/HazeLayer.tsx`
- `src/react-app/components/r3f/nebula/index.ts`

**Action:** Delete entire `r3f/` folder and `ParticleBreathing.tsx`
**Impact:** ~800+ lines removed
**Risk:** None (verified no imports)

### 1.3 Remove Unused Hook Exports
**File:** `src/react-app/hooks/useSimulation.ts`
**Remove:**
- `useSimulationCount()` (lines 157-162)
- `useSimulationMoods()` (lines 167-172)
- `useSimulationCleanup()` (lines 178-180)

**Impact:** Cleaner API surface
**Risk:** None (never imported)

### 1.4 Remove Unused Utility Functions
**File:** `src/react-app/lib/userGenerator.ts`
**Remove:**
- `formatUserDisplay()` (lines 219-237)
- `getTimeRemaining()` (lines 242-244)

**File:** `src/react-app/lib/colors.ts`
**Remove:**
- `createColorScale()` (lines 128-133)
- `lighten()` (lines 138-142)
- `darken()` (lines 147-151)
- `hasContrast()` (lines 156-162)
- `getContrastingText()` (lines 167-169)

**File:** `src/react-app/hooks/useBreathingSpring.ts`
**Remove:**
- `toFramerSpringConfig()` (lines 110-119)

**Note:** Also remove corresponding tests in `*.test.ts` files
**Impact:** Cleaner codebase, smaller bundle
**Risk:** Low (only used in tests)

### 1.5 Fix CLAUDE.md Documentation
**File:** `CLAUDE.md`
**Action:** Remove reference to non-existent `lib/spring.ts`
**Impact:** Accurate documentation
**Risk:** None

---

## Phase 2: Config Cleanup (Medium Impact, Low Risk)

### 2.1 Remove Unused VisualizationConfig Parameters
**File:** `src/react-app/lib/config.ts`
**Remove from schema and DEFAULT_CONFIG:**
- `glowIntensity` - not used in GPGPU shaders
- `trailFade` - not used
- `fireflyCount`, `fireflyFadeIn`, `fireflyFadeOut`, `fireflyResampleInterval`, `fireflyPulseSpeed`, `fireflySize` - no firefly implementation
- `presenceRadius`, `presenceOpacity`, `ribbonSegments`, `ribbonBaseWidth`, `ribbonScaleFactor`, `ribbonPulseAmount`, `ribbonBlendWidth` - no ribbon implementation

**Impact:** Simpler config, smaller persisted state
**Risk:** Low (verify no usage first)

### 2.2 Simplify Zustand Store Simulation Setters
**File:** `src/react-app/stores/appStore.ts`
**Remove specialized setters, keep only `updateSimulationConfig`:**
- `setSimulationEnabled`
- `setTargetPopulation`
- `setMeanStayDuration`
- `setTimeScale`
- `setMoodDistribution`

**Impact:** Simpler API (6 functions → 1)
**Risk:** Low (update call sites)

---

## Phase 3: Consolidation (Medium Impact, Medium Risk)

### 3.1 Centralize Mood Definitions
**Current state:** Mood IDs defined in 3 places
- `lib/simulationConfig.ts` - `MOOD_IDS` constant
- `lib/colors.ts` - `MOODS` array
- `worker/index.ts` - `VALID_MOODS` Set

**Action:**
1. Keep `MOOD_IDS` in `simulationConfig.ts` as source of truth
2. Update `colors.ts` to import from simulationConfig
3. Update worker to import from shared location or validate against same list

**Impact:** Single source of truth, easier maintenance
**Risk:** Medium (touches multiple files)

### 3.2 Centralize Empty Moods Object
**Current state:** Duplicated in 3 files
- `hooks/usePresence.ts:43-51`
- `hooks/useSimulation.ts:39-47`
- `lib/simulation.ts:139-147`

**Action:** Export `EMPTY_MOODS` from `lib/simulationConfig.ts`, import elsewhere
**Impact:** DRY code
**Risk:** Low

### 3.3 Move Breathing Utilities to breathUtils
**Current state:** `easeInOutSine` defined in `GPGPUScene.tsx`

**Action:** Move to `lib/breathUtils.ts` alongside existing `getBreathValue`
**Impact:** Better code organization
**Risk:** Low

---

## Phase 4: Performance & Quality (Lower Priority)

### 4.1 Replace setInterval with requestAnimationFrame
**File:** `src/react-app/hooks/useBreathSync.ts`
**Line:** 51
**Current:** `setInterval(updateBreath, 16)`
**Improve:** Use `requestAnimationFrame` for proper display sync
**Impact:** Smoother animations, better battery life
**Risk:** Low

### 4.2 Review Unused Store Selectors
**File:** `src/react-app/stores/appStore.ts`
**Selectors to audit:**
- `selectMoodColor`
- `selectBreathingConfig`
- `selectSphereConfig`
- `selectVisualEffectsConfig`
- `selectSimulationState`
- `selectUIState`

**Action:** Remove if unused, or document purpose
**Impact:** Cleaner code
**Risk:** Low

---

## Execution Order

| Priority | Phase | Task | Est. Lines Changed | Files |
|----------|-------|------|-------------------|-------|
| 1 | 1.1 | Remove three-nebula | 1 | 1 |
| 2 | 1.2 | Delete dead components | -800 | 6 deleted |
| 3 | 1.5 | Fix CLAUDE.md | 1 | 1 |
| 4 | 1.3 | Remove unused hook exports | -25 | 1 |
| 5 | 1.4 | Remove unused utilities | -50 | 3 + tests |
| 6 | 2.1 | Remove unused config params | -80 | 1 |
| 7 | 3.2 | Centralize EMPTY_MOODS | 10 | 4 |
| 8 | 2.2 | Simplify store setters | -30 | 2 |
| 9 | 3.3 | Move breathing utilities | 5 | 2 |
| 10 | 4.1 | Use requestAnimationFrame | 10 | 1 |
| 11 | 3.1 | Centralize mood definitions | 20 | 3 |

---

## Summary

**Total estimated impact:**
- ~900 lines of dead code removed
- 6 files deleted
- 1 unused dependency removed
- Cleaner, more maintainable codebase

**Run before committing:**
```bash
npm run check  # Type check + build + dry-run deploy
npm run test   # Ensure tests still pass
```
