# Runtime Link Plan: ManimTS Scene -> SVG Editor

## Goal
Create a runtime bridge from a simple Manim scene written in TypeScript to
`svg/`, with a scene file picker that defaults to a predefined simple scene
file.

## Scope
- Source runtime: `sv/` TypeScript Manim runtime.
- Target consumer: `svg/` app.
- First bridge format: static SVG + metadata sidecar.
- First selectable source scene: one predefined simple `.ts` scene file.

## Default Scene Requirement
- Add a default scene file path in `sv/examples/`.
- File picker opens with this default selected.
- User can switch to another local `.ts` scene file.

Suggested initial default:
- `sv/examples/basic-scene-sample.ts`

## Architecture

### Bridge Boundary
- `sv` owns scene execution and SVG export.
- `svg` owns inspection/editing UI.
- Data contract between them:
  - `simple-scene.svg`
  - `simple-scene.meta.json`
  - optional `simple-scene.args.json`

### Metadata Contract
For each exported SVG node:
- `id`
- `data-node-id`
- `data-manim-class`
- `data-manim-source` (scene file + symbol)

Sidecar metadata includes:
- export timestamp
- scene file path
- serialized scene arguments
- exporter version

## Stage 1: Define Export Contract in `sv/`
Deliverables:
- Add `sv/docs/svg-export-contract.md`.
- Define minimal node coverage (group, rect, text).
- Define deterministic node ID policy.

Acceptance:
- Contract reviewed and stable enough for first exporter.

## Stage 2: Add Simple SVG Exporter in `sv/`
Deliverables:
- Add exporter module in `sv/packages/core-ts` or
  `sv/packages/render-node` (whichever fits existing boundaries).
- Export a static frame from the simple scene.
- Emit SVG and metadata sidecar.

Acceptance:
- Running exporter on default scene writes valid SVG and metadata.

## Stage 3: Add Scene Picker CLI Entry
Deliverables:
- Add CLI script in `sv/`:
  - prompts or accepts a scene file path
  - defaults to predefined simple `.ts` scene
- Non-interactive mode supported via args.

Example:
- `cd sv && bun run export:svg --scene examples/basic-scene-sample.ts`

Acceptance:
- Command works with and without explicit `--scene`.
- Default scene selected when flag is omitted.

## Stage 4: Output Target Integration for `svg/`
Deliverables:
- Export target path points at:
  - `svg/src/lib/fixtures/simple-scene.svg`
  - `svg/src/lib/fixtures/simple-scene.meta.json`
- Optional `--out-dir` for alternate locations.

Acceptance:
- Running exporter updates files consumed by `svg` app directly.

## Stage 5: Hook `svg/` Reload Workflow
Deliverables:
- Add `svg` script to regenerate fixture from `sv` exporter.
- Optionally add a dev helper button/command to refresh source.

Acceptance:
- One command refreshes scene data and UI can display new export.

## Stage 6: Selection Provenance Verification
Deliverables:
- Verify tree and source-pane selections still work with exported nodes.
- Ensure `id` and `data-node-id` remain stable across exports from same
  scene args.

Acceptance:
- Selection sync tests pass on `sv`-generated outputs.

## Stage 7: E2E and Regression Tests
Deliverables:
- Add `sv` tests for exporter deterministic IDs.
- Add `svg` e2e smoke that uses exporter-generated fixture.

Acceptance:
- Bridge test suite passes.

## Out of Scope
- Full animation timeline to SVG frames.
- Reverse sync from edited SVG back into scene code.
- Arbitrary TS project loading outside repo.
