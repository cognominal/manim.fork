# ManimTS Spec Index

This directory now splits planning into focused docs:

- Architecture and phased roadmap:
  - `sv/docs/architecture.md`
- TypeScript API contracts:
  - `sv/docs/interfaces.md`

Next implementation milestone:
1. Create `sv/packages/core-ts` with no-op adapters and strict API boundaries.
2. Add a minimal scene with one `VMobject` and one transform animation.
3. Render that scene to `.mp4` via `sv/packages/render-node`.
