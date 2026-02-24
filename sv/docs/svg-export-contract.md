# SVG Export Contract (v1)

This contract defines the runtime bridge from `sv/` scene modules to the
`svg/` editor fixtures.

## Scene Module Contract
A bridge-capable scene module must export either:
- `sceneFactory`, or
- a default export

Factory shape:
- `createScene(): Scene | Promise<Scene>`
- `svgExport: SvgExportSpec`

## `SvgExportSpec`
Required:
- `sceneId: string`
- `width: number`
- `height: number`
- `hints: Record<string, SvgShapeHint>`

Optional:
- `title: string`
- `sampleTime: number` (default `0`)
- `rootId: string` (default `scene-root`)

## `SvgShapeHint` (v1)
- `rect`:
  - `width`, `height`, optional `rx`
- `text`:
  - `text`, optional `fontSize`, optional `textAnchor`

## Output Files
Exporter writes:
- `<sceneId>.svg`
- `<sceneId>.meta.json`

Default target for bridge workflow:
- `svg/src/lib/fixtures/`

## SVG Node Requirements
Each rendered node must include:
- `id`
- `data-node-id`
- `data-manim-class`
- `data-manim-source`

## Metadata Sidecar Requirements
`<sceneId>.meta.json` includes:
- `sceneId`
- `width`, `height`, `viewBox`
- `sourceScenePath`
- `exportTimeUtc`
- `nodeCount`
- `nodes[]` with `id`, `tag`, `label`, `parentId`, provenance fields

## Determinism Rules
Given the same scene module and arguments:
- Node IDs must remain stable.
- Output ordering must be stable.
- Shape geometry must be reproducible.
