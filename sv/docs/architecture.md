# ManimTS Architecture (v1)

## Goal
Build a TypeScript-first Manim-style system that supports:
- Programmatic scene authoring and `.mp4` rendering.
- An interactive SvelteKit editor (`studio app`).
- Generated interactive SvelteKit viewers (`demo apps`).

## System Model

### Core Runtime Boundary
`core-ts` is the canonical execution engine and must be UI-agnostic.
- It owns scene graph state, timeline semantics, animation interpolation, and frame sampling.
- It does not depend on SvelteKit.
- Both CLI rendering and Studio preview run through the same `sample(t)` semantics.

### Rendering Boundary
- Runtime produces `SceneFrame`.
- Renderers consume `SceneFrame` and draw to a target (Canvas2D first, WebGL optional later).
- Video export is an adapter layer over renderer output (frame stream -> `ffmpeg` -> `.mp4`).

### Authoring Boundary
- Studio app edits a normalized scene/timeline model and serializes JSON.
- Studio playback delegates to `core-ts` runtime to avoid semantic drift.
- Demo app generation packages scene JSON + runtime + UI controls.

## Progressive Plan

### Phase 0: Architecture Extraction (Python Manim -> TS model)
- Document core concepts to preserve: `Scene`, `Mobject`, `VMobject`, animation/timeline, renderer contract.
- Define simplifications for v1 (skip non-essential features until core pipeline is stable).
- Produce executable invariants:
  - deterministic sampling
  - parent-child transform composition
  - stable timeline ordering

### Phase 1: Core TypeScript Runtime (no SvelteKit yet)
- Implement `core-ts` primitives:
  - scene graph (`Mobject`, `Group`, `VGroup`, `VMobject`)
  - animation system (`Animation`, `Transform`, `Fade*`)
  - timeline scheduler (`play`, `wait`, parallel/sequential composition)
- Add deterministic `sample(t)` for preview/render parity.
- Implement Canvas2D renderer backend first.

### Phase 2: Video Export Pipeline
- Add Node-side frame rendering.
- Pipe frames to `ffmpeg` for `.mp4`.
- Add CLI commands (`render`, `preview`).

### Phase 3: Studio App (SvelteKit)
- Build interactive timeline editor using `core-ts`.
- Add per-`Mobject` tracks with grouping/ungrouping mapped to `Group`/`VGroup` semantics.
- Support keyframes for transform/style/path state.
- Add undo/redo command stack and deterministic playback.

### Phase 4: Demo App Generator (SvelteKit)
- Export studio-authored scene graph + timeline JSON.
- Generate SvelteKit app that can play/scrub/interact with scene.
- Provide controls (speed, layer toggles, parameters).

### Phase 5: Refinement
- Improve rendering quality/performance.
- Add advanced path operations and richer text/math support.
- Optionally add a WebGL backend.

## Proposed Layout (`sv/`)
```text
sv/
  docs/
    architecture.md
    interfaces.md
  packages/
    core-ts/
      src/
        scene/
        mobject/
        animation/
        timeline/
        renderer/
        math/
      tests/
    render-node/
      src/
        ffmpeg/
      tests/
    cli/
      src/
    demo-runtime/
      src/
    demo-generator/
      src/
  apps/
    studio/
      src/
        lib/
          stores/
          timeline/
          inspector/
          preview/
    demo-template/
      src/
```

## Next Implementation Slice
1. Create `packages/core-ts` with no-op adapters and strict API boundaries.
2. Add a minimal scene with one `VMobject` and one transform animation.
3. Make CLI render this scene to `.mp4` via `render-node`.
