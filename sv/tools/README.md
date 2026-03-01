# `sv/tools`

Utility scripts and shared contracts for scene export and scene/asset sync
workflows in `sv/`.

## File Purposes

### `svg-export-contract.ts`

Defines TypeScript contracts used by SVG-exportable scene modules.

- `SvgShapeHint`:
  discriminated union for supported exportable primitives (`rect`, `text`).
- `SvgExportSpec`:
  metadata needed to render a sampled scene into SVG output
  (`sceneId`, dimensions, `hints`, optional title/time/root).
- `SvgSceneFactory`:
  interface for a module that can create a `Scene` and provide
  `svgExport` metadata.

Use this file as the canonical typing surface between scene fixtures and
`export-scene-svg.ts`.

### `export-scene-svg.ts`

CLI tool that loads a scene factory module, samples the scene, and writes:

- one `.svg` fixture file
- one `.meta.json` sidecar with node metadata

Core responsibilities:

- parse CLI args (`--scene`, `--out-dir`) with defaults
- discover/select scene files interactively when `--scene` is omitted
- import scene modules and resolve `sceneFactory` or default export
- map sampled mobjects to SVG elements using `svgExport.hints`
- emit deterministic fixture metadata (source path, node list, export time)

Default input scene:
`sv/examples/svg-link/simple-scene.ts`

Default output directory:
`svg/src/lib/fixtures`

### `sync-eponymous.ts`

Bun CLI utility that keeps scene-adjacent docs and render outputs in sync.

Core responsibilities:

- scan scene `.ts` files in a target directory (or explicit `--file` list)
- skip non-scene files by naming rules and optional generator presence
- maintain an auto-generated sync block in eponymous `.md` files
- compare stored source hash vs current source hash to decide markdown updates
- optionally run scene MP4 generators (`generate-<scene>-mp4.ts`)
- report per-scene status and totals for markdown/mp4 updates

Useful flags:

- `--dir <path>`: target scene directory
- `--file <name>`: process specific scene file(s)
- `--skip-render`: do not run MP4 generators
- `--dry-run`: compute and report changes without writing
- `--no-skip-non-scene`: include files without generators
