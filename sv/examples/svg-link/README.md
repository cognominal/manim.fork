# `sv/examples/svg-link`

This folder contains a minimal scene fixture used to validate the SVG link
between scene construction and SVG export metadata.

## File Purpose

### `simple-scene.ts`

Defines a small, deterministic scene with two mobjects:

- `rect-1`: a rounded rectangle-like shape (via export hint metadata)
- `text-1`: centered text content (`"Hello"`)

The scene is authored through `BasicScene`/`BaseMobject` and includes
`svgExport` metadata (`sceneId`, dimensions, sample time, and per-object
hints) used by SVG tooling.

## Exported Symbols

### `sceneFactory` (named export)

Type: `SvgSceneFactory`

Purpose:

- Exposes `createScene()` for runtime scene construction.
- Exposes `svgExport` metadata for deterministic SVG conversion.

Key members:

- `createScene: () => BasicScene`
- `svgExport.sceneId: "simple-scene"`
- `svgExport.width: 640`
- `svgExport.height: 360`
- `svgExport.sampleTime: 0`
- `svgExport.rootId: "scene-root"`
- `svgExport.hints`: maps object IDs (`rect-1`, `text-1`) to SVG primitive
  guidance (`rect`/`text`).

### `default` (default export)

Alias of `sceneFactory`.

Purpose:

- Supports consumers that import this fixture as a default module export.
