# SVG Studio MVP Plan

## Scope
Build a new `svg/` TypeScript app that reuses logic from `sv/` as the
starting point and provides:
- A split layout with a tree editor pane and a scene pane.
- A tree view over SVG structure.
- Context menu actions on tree items.
- First context action: toggle hide/unhide (`display: none` switch).
- A starter scene: text inside a rectangle.

This MVP is intentionally non-realtime. Determinism and editability matter
more than rendering speed.

## UX Target
- Left pane: SVG structure tree (groups and drawable nodes).
- Right pane: scene view rendering the current SVG.
- Divider: resizable separator widget (the Rich Harris split-pane style).
- Selection sync:
  - Click tree node => select corresponding SVG element.
  - Click SVG element => select corresponding tree node.
- Context menu on tree row:
  - `Hide` when visible.
  - `Unhide` when hidden.

## Clarification Needed
The separator widget name needs confirmation.
Likely options:
- A Rich Harris split-pane pattern/component.
- A third-party Svelte split pane package.

For MVP, we can wrap the implementation behind `SplitLayout.svelte` so the
choice can be swapped without API churn.

## Architecture

### Runtime and Data Flow
1. Scene generator creates `scene.svg` and optional sidecar metadata.
2. `svg/` app loads SVG document text.
3. Parser builds an in-memory tree model keyed by stable `nodeId`.
4. UI renders:
   - Tree from the model.
   - Scene pane from parsed SVG markup.
5. User actions (select/hide/unhide) update both:
   - Tree state.
   - Actual SVG DOM attributes/styles.

### Reuse from `sv/`
Use `sv/` core TypeScript code as source material for scene concepts and
naming, but keep `svg/` app focused on SVG inspection/editing, not timeline.

Initial reuse strategy:
- Reuse scene naming and deterministic IDs conventions.
- Reuse utility types where directly compatible.
- Do not pull in render-node or ffmpeg dependencies.

## Proposed Directory Layout
```text
svg/
  package.json
  tsconfig.json
  vite.config.ts
  src/
    App.svelte
    app.css
    lib/
      components/
        SplitLayout.svelte
        TreePane.svelte
        ScenePane.svelte
        ContextMenu.svelte
      model/
        svg-tree.ts
        selection.ts
        visibility.ts
      io/
        load-svg.ts
      fixtures/
        simple-scene.svg
        simple-scene.meta.json
  tests/
    unit/
      svg-tree.test.ts
      visibility.test.ts
    e2e/
      tree-visibility.spec.ts
scripts/
  gen-simple-svg.ts
```

## Scene Fixture (MVP Test Scene)
Define one simple scene with:
- Root `<svg>`.
- One `<g id="scene-root">`.
- One `<rect id="rect-1">`.
- One `<text id="text-1">Hello</text>` centered in the rectangle.

Recommended metadata:
- `data-node-id` for stable tree linkage.
- `data-origin="simple-scene"`.

Acceptance for fixture:
- Scene loads in browser.
- Tree displays nodes in source order.
- Selecting `rect-1` and `text-1` highlights each correctly.

## Tree Model Contract
`SvgTreeNode` minimal contract:
- `id: string` (stable, from `id` or generated deterministic fallback)
- `tag: string`
- `label: string` (human-friendly, eg `rect#rect-1`)
- `children: SvgTreeNode[]`
- `hidden: boolean`
- `selectable: boolean`

Rules:
- Ignore unsupported nodes for MVP (comments, processing instructions).
- Keep text nodes optional in tree; start with element nodes only.

## Interaction Spec

### Selection
- Single selection only in MVP.
- Selected row has persistent highlight in tree.
- Selected SVG element gets outline overlay class.

### Hide/Unhide
- Action location: tree row context menu.
- Behavior:
  - Hide sets inline `display: none` on the target element.
  - Unhide removes forced display override.
- Tree row reflects hidden state immediately.
- Hiding a parent hides visible descendants in scene pane.
- Menu labels are state-driven (`Hide` vs `Unhide`).

### Layout Stability
No UI dance:
- Reserve context menu portal/container region.
- Keep row action affordance width stable even when menu is closed.
- Avoid mount/unmount shifts for per-row controls; prefer visibility toggle.

## Implementation Milestones

1. Bootstrap `svg/` app
- Create Vite + Svelte 5 app scaffold.
- Add strict TypeScript config.
- Add lint/check scripts.

2. Add fixture scene pipeline
- Create `scripts/gen-simple-svg.ts` to generate deterministic fixture SVG.
- Output to `svg/src/lib/fixtures/simple-scene.svg`.
- Add optional metadata sidecar JSON.

3. Build tree parser/model
- Parse fixture SVG into `SvgTreeNode[]`.
- Implement deterministic fallback ID generation.
- Add unit tests for parser shape and ID stability.

4. Build split UI shell
- Implement `SplitLayout.svelte` with draggable divider.
- Left tree pane and right scene pane wired with shared store.

5. Implement selection sync
- Tree click selects scene element.
- Scene click selects tree row.
- Add keyboard escape to clear selection.

6. Implement context menu and hide/unhide
- Right-click row opens context menu.
- Toggle hide/unhide updates model and DOM.
- Add unit tests for visibility reducer logic.
- Add e2e test covering right-click -> hide -> unhide.

7. Hardening and docs
- Ensure cursor semantics (`pointer`, `default`, `grab`, `grabbing`).
- Verify no layout shift on small screens.
- Add `svg/README.md` with run/test instructions.

## Test Plan

### Unit
- `svg-tree.test.ts`
  - Parses nested groups correctly.
  - Produces stable IDs across parses.
- `visibility.test.ts`
  - Hide sets hidden state.
  - Unhide clears hidden state.
  - Parent hide preserves child explicit states but effective render hides.

### E2E
- `tree-visibility.spec.ts`
  - Load fixture.
  - Select `rect-1` from tree and verify scene highlight.
  - Open context menu on `rect-1`, click `Hide`, assert not visible.
  - Reopen menu, click `Unhide`, assert visible.

### Manual Smoke
- Resize divider repeatedly; panes remain functional.
- Narrow viewport check for no jumping controls.
- Confirm context menu remains anchored to row.

## Definition of Done (MVP)
- `svg/` app exists and runs locally.
- Split layout with resizable separator is functional.
- Tree and scene selection are synchronized.
- Tree context menu supports hide/unhide.
- Simple rectangle+text scene is the default loaded fixture.
- Tests pass and build/check emit zero warnings.

## Risks and Mitigations
- Split-pane dependency mismatch:
  - Mitigation: abstract as `SplitLayout.svelte` wrapper.
- SVG editor round-trip may strip attributes:
  - Mitigation: prefer `id` as primary key and `data-node-id` as secondary.
- Event targeting on text vs group wrappers:
  - Mitigation: normalize to nearest selectable ancestor.

## Immediate First Slice
Implement in this order:
1. `svg/` scaffold and fixture load.
2. Tree parse + render.
3. Selection sync.
4. Context menu hide/unhide.
5. Tests for parser and visibility toggle.
