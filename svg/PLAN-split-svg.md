# Split + SVG Source Plan

## Goal
Extend the `svg/` MVP editor so users can:
- Switch the right workspace between `scene` and `svg` source views.
- Toggle `split` / `unsplit` display modes.
- In split mode, show read-only SVG source on the left and scene on the right.
- Keep selection synchronized between structure tree and source text.
- Keep hide/unhide context actions working.

## Product Rules
- Unsplit mode:
  - Show tab buttons: `scene`, `svg`.
  - Show split toggle.
  - Render only the selected tab content.
- Split mode:
  - Hide tab buttons.
  - Show split toggle.
  - Render both panes via `@rich_harris/svelte-split-pane`.
  - Left split pane: read-only CodeMirror SVG source.
  - Right split pane: scene preview.
- Tree -> source synchronization:
  - Clicking a tree item selects the SVG node.
  - Source editor scrolls to node text.
  - If folded, target location is unfolded.
- Source -> tree synchronization:
  - Selecting text in source maps to nearest SVG node range.
  - Tree row selection updates accordingly.

## Stage 1: Source Mapping Model
Deliverables:
- Add `src/lib/model/svg-text-map.ts`.
- Build text-range index keyed by `id`/`data-node-id`.
- Functions:
  - `buildNodeRangeIndex(svgText)`
  - `findPrimaryRange(index, id)`
  - `findNodeIdAtPosition(index, pos)`

Acceptance:
- Nested ranges choose the deepest node on caret lookup.
- Mapping works on compact and formatted SVG text.

## Stage 2: CodeMirror Source Pane
Deliverables:
- Add dependencies:
  - `@codemirror/state`, `@codemirror/view`
  - `@codemirror/commands`, `@codemirror/language`
  - `@codemirror/lang-xml`
- Add `src/lib/components/SvgCodePane.svelte`.
- Read-only XML editor with line wrapping.
- Expose test hook to inspect current selection from e2e.

Acceptance:
- Source renders current SVG markup.
- External `selectedId` updates editor selection + scroll.
- Internal text selection emits `onSelect(id | null)`.

## Stage 3: Workspace Controller UI
Deliverables:
- Update `src/App.svelte` with a right-workspace bar.
- Add tab state (`scene` / `svg`) for unsplit mode.
- Add split toggle state.
- In split mode, use `SplitPane`:
  - left = `SvgCodePane`
  - right = `ScenePane`

Acceptance:
- Toggle changes layout instantly without UI jump.
- Unsplit mode keeps tabs visible.
- Split mode hides tabs and shows both panes.

## Stage 4: Selection Synchronization
Deliverables:
- Keep shared selected node ID in store.
- Tree click updates shared selection.
- Source pane listens to shared selection and scrolls/selects text.
- Source selection updates shared selection.
- Tree highlights selected row.

Acceptance:
- Tree -> source selection is deterministic.
- Source -> tree selection is deterministic.
- Escape key still clears selection.

## Stage 5: Visibility + Context Menu Compatibility
Deliverables:
- Ensure hide/unhide continues to mutate SVG markup.
- Rebuild source mapping when SVG markup changes.
- Ensure selection survives hide/unhide when node still exists.

Acceptance:
- Toggle hide from tree updates scene and source text.
- Hidden state badge in tree remains stable width (no layout shift).

## Stage 6: E2E Test Coverage
Deliverables:
- Add Playwright config and `tests/e2e/split-svg.spec.ts`.
- Add scripts:
  - `test:e2e`
- Include at least these tests:
  - Unsplit tabs + tree -> source selection.
  - Split mode layout + source -> tree selection.

Acceptance:
- Tests run against local Vite dev server and pass in Chromium.

## Stage 7: Final Hardening
Deliverables:
- Ensure warning-free `svelte-check` and build.
- Cursor styles follow affordances (`pointer`, `not-allowed`, `grab`,
  `grabbing` where applicable).
- Ensure controls do not reflow unexpectedly on narrow widths.

Acceptance:
- `bun run check` reports 0 warnings.
- `bun run build` succeeds.
- Unit + e2e tests pass.

## Out of Scope
- Live bidirectional structural editing of SVG text (beyond selection sync).
- Full fold-state persistence per node across reload.
- Timeline/animation editing.
- ManimTS runtime export integration (handled in a separate bridge plan).
