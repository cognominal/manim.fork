# Time-Wrap Implementation Plan

## Reformulation

We need a new Svelte route named `time-wrap` that demonstrates one animation
engine with two modes:

- Normal mode: real-time playback updates animation state and slider position.
- Time-wrap mode: slider input seeks instantly to target time `t`, and the
  animation state is computed for that exact time without waiting in real time.

The key requirement is shared animation logic. We should not maintain separate
render logic for play vs seek.

## Current Context

- `iManim-studio` is a Vite + Svelte 5 app mounted from `src/App.svelte`.
- There is currently no route system in this app.
- Svelte 5 runes and event attributes are already in use.

## Goals

- Add a `time-wrap` route that is directly reachable.
- Provide a visual animation demo plus:
  - a slider for time selection
  - a toggle for `normal` vs `time-wrap` behavior
- Ensure both modes use one deterministic timeline core.
- Keep UI stable (no layout shifts when controls/status change).

## Non-Goals

- Full app-wide router migration.
- Remote function integration.
- Advanced timeline authoring UI.

## Proposed Design

### 1. Routing Strategy

Implement a minimal in-app router in `iManim-studio/src/App.svelte`:

- Read `window.location.pathname`.
- Render:
  - existing editor UI on `/`
  - new time-wrap demo on `/time-wrap`
- Keep this intentionally small to avoid broad app churn.

If local dev cannot serve deep links without fallback config, use a safe
fallback:

- support `/#/time-wrap` in addition to `/time-wrap`

Final choice will be based on quickest reliable behavior in Vite dev + build.

### 2. Time-Wrap Demo Component

Create a dedicated component, for example:

- `iManim-studio/src/lib/components/TimeWrapDemo.svelte`

This component will own:

- timeline state (`currentTime`, `duration`, `isPlaying`, `mode`)
- RAF loop for normal playback
- slider-driven seek behavior
- animated object rendering

### 3. Shared Timeline Core

Use one deterministic evaluator:

- `evaluateAt(t)` returns derived animation values for time `t`
- visual state is always computed from `t`

Implementation sketch:

- Normalize `t` to `[0, duration]`.
- Derive values like x/y/scale/opacity from easing/interpolation formulas.
- Bind rendered styles/attributes to derived values.

This gives:

- normal mode: advance `currentTime += dt`, then evaluate
- time-wrap mode: set `currentTime = sliderT`, then evaluate

No sleep/timer-based incremental mutation is needed for seek.

### 4. Interaction Rules

- Toggle `normal`:
  - playback runs on RAF
  - slider reflects `currentTime` continuously
  - user dragging slider updates current time and playback continues or pauses
    per defined policy
- Toggle `time-wrap`:
  - playback loop is paused
  - slider changes instantly set target time and state

Policy to implement (explicit):

- Entering `time-wrap` pauses playback.
- Returning to `normal` keeps current time and resumes playback.

### 5. UI/UX Constraints

- Reserve fixed layout slots for labels/value text.
- Keep toggle and slider always mounted to prevent UI dance.
- Use standard cursor affordances:
  - interactive controls: `pointer`
  - draggable slider thumb uses browser default range behavior

### 6. Svelte 5 Compliance

- Use `$state`, `$derived`, `$effect`.
- Use `onclick`, `oninput`, etc.
- Avoid Svelte 4 legacy patterns.

## Implementation Steps

1. Add route switch in `App.svelte`.
2. Extract existing editor view into a local snippet/component if needed to
   keep `App.svelte` readable.
3. Add `TimeWrapDemo.svelte` with:
   - timeline state
   - RAF loop
   - slider + toggle controls
   - animated scene
4. Add helper utilities (if needed) under `src/lib/model/` for easing and time
   clamping.
5. Ensure styling avoids layout shifts and works on small screens.
6. Run checks (`bun run --cwd iManim-studio check` and optionally tests).
7. Adjust based on check output until warning-free.

## Validation Plan

Manual checks:

- Open route and confirm demo renders.
- In normal mode:
  - object moves smoothly
  - slider advances automatically
- In time-wrap mode:
  - moving slider instantly updates animation state
  - no perceived playback while mode is active
- Toggle modes repeatedly:
  - no state corruption
  - no jump other than expected mode behavior
- Verify small viewport:
  - controls remain visible and stable
  - no layout shift when values update

Code quality checks:

- `bun run --cwd iManim-studio check`
- `bun run --cwd iManim-studio build` (optional but recommended)

## Risks and Mitigations

- Risk: route support mismatch in dev/prod path handling.
  - Mitigation: include hash fallback support if needed.
- Risk: drift between slider time and RAF time.
  - Mitigation: single `currentTime` source of truth and derived state.
- Risk: mode switch race with RAF callback.
  - Mitigation: guard RAF loop using `isPlaying` and cancel on mode changes.

## Deliverables

- New route behavior for `time-wrap`.
- New `TimeWrapDemo.svelte` component.
- Updated app wiring in `App.svelte`.
- Passing Svelte type checks with no new warnings.
