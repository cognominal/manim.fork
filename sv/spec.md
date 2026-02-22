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

Current ported examples from `pentomanim/manim`:
- `sv/examples/pentomanim-port/pentomino_6x10.ts`
- `sv/examples/pentomanim-port/pentomino_6x10_five.ts`
- `sv/examples/pentomanim-port/rect_6x10_dfs_tree.ts`
- `sv/examples/pentomanim-port/triplication_dfs_tree.ts`
- `sv/tools/sync-eponymous.ts`
- `sv/examples/pentomanim-port/generate-pentomino_6x10-mp4.ts`
- `sv/examples/pentomanim-port/generate-pentomino_6x10_five-mp4.ts`
- `sv/examples/pentomanim-port/generate-rect_6x10_dfs_tree-mp4.ts`
- `sv/examples/pentomanim-port/generate-triplication_dfs_tree-mp4.ts`
