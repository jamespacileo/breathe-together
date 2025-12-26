# Theatre.js + Studio Refactor Plan

This plan outlines the transition from a code-heavy, manual animation system to a cinematic, orchestrated system using Theatre.js.

## Phase 1: Infrastructure & Setup
- [ ] **Install Dependencies**:
  - `npm install @theatre/core @theatre/studio`
- [ ] **Initialize Theatre Project**:
  - Create `src/react-app/lib/theatre.ts` to export the project and main sheet.
  - Setup conditional Studio initialization (dev only).
- [ ] **Global Uniforms Integration**:
  - Connect Theatre object values to the `GlobalUniforms` pattern discussed in the review.

## Phase 2: Component Refactoring
- [ ] **Breathing Sphere**:
  - Replace `useFrame` math with a Theatre object `sphere`.
  - Properties: `scale`, `glowIntensity`, `innerColor`, `outerColor`.
  - Use `sheet.sequence.position` to map `breathState.progress` to the timeline.
- [ ] **Post-Processing**:
  - Create a `postProcessing` Theatre object.
  - Properties: `bloomIntensity`, `vignetteDarkness`, `noiseOpacity`.
- [ ] **Atmospheric Layers**:
  - Create objects for `nebula` and `stars`.
  - Properties: `rotationSpeed`, `opacity`, `colorTint`.

## Phase 3: Cinematic Orchestration
- [ ] **The "Breathing Loop" Sequence**:
  - Design a 10-second master sequence in Studio that defines the "perfect" breath curve.
  - Use Theatre's keyframe editor to add subtle "overshoots" and "settling" visually.
- [ ] **Mood States**:
  - Create separate Sheets for each mood (e.g., `AnxiousSheet`, `GratefulSheet`).
  - Implement a `MoodManager` that transitions between these sheets when `user.mood` changes.

## Phase 4: Studio UI & Polish
- [ ] **Parameter Exposure**:
  - Ensure all "magic numbers" in shaders are exposed as Theatre props.
- [ ] **Visual Tuning**:
  - Use Studio UI to live-edit the scene while breathing.
  - Export the state to `state.json` for production distribution.

## Drastic Improvements Expected:
1. **Visual Fidelity**: Non-linear, hand-keyed animations that feel "alive" rather than mathematical.
2. **Designer Workflow**: Ability to tweak the "feel" of the breath without touching GLSL or React code.
3. **Mood Immersion**: Transitions between moods will feel like a camera lens shifting or a lighting change in a movie.
4. **Performance**: Theatre.js is highly optimized for property updates, reducing React re-render overhead.
