# `sv/` TypeScript port workspace

This workspace hosts TypeScript ports/adaptations of selected Manim scripts,
plus Node/Bun rendering drivers that produce `.mp4` output with `ffmpeg`.

## Setup

```bash
cd /Users/cog/mine/manim.fork/sv
bun install
```

Requirements:

- `bun`
- `ffmpeg` available on `PATH`

## Ported pentomanim examples

Source reference directory:
`/Users/cog/mine/pentomanim/manim/`

Ports live in:
`/Users/cog/mine/manim.fork/sv/examples/pentomanim-port/`

Key script mappings:

- `pentomino_6x10.py` -> `pentomino_6x10.ts`
- `pentomino_6x10_five.py` -> `pentomino_6x10_five.ts`
- `rect_6x10_dfs_tree.py` -> `rect_6x10_dfs_tree.ts`
- `triplication_dfs_tree.py` -> `triplication_dfs_tree.ts`
- `dancing_links.py` -> `dancing_links.ts`
- `dancing-links-anim.py` -> `dancing-links-anim.ts`
- `dlx_3x2_two_tiles.py` -> `dlx_3x2_two_tiles.ts`
- `dlx_3x2_three_tiles.py` -> `dlx_3x2_three_tiles.ts`
- `dlx_3x2_three_tiles_links.py` -> `dlx_3x2_three_tiles_links.ts`
- `sync_eponymous.py` -> `sv/tools/sync-eponymous.ts`

## Run ports

From `/Users/cog/mine/manim.fork/sv`:

```bash
bun run port:dancing_links
bun run port:dlx_3x2_three_tiles
bun run port:triplication_dfs_tree
```

## Generate MP4 output

From `/Users/cog/mine/manim.fork/sv`:

```bash
bun run gen:basic-mp4
bun run gen:dancing-links-anim-mp4
bun run gen:dlx_3x2_three_tiles-mp4
bun run gen:pentomino_6x10-mp4
```

Output files are written to:
`/Users/cog/mine/manim.fork/sv/output/`

## Eponymous sync for TS scenes

The sync driver updates scene-side markdown metadata and optionally renders
stale mp4 files using matching `generate-<scene>-mp4.ts` scripts.

```bash
cd /Users/cog/mine/manim.fork
bun run sv/tools/sync-eponymous.ts --dry-run
bun run sv/tools/sync-eponymous.ts
```

Useful flags:

- `--dir /path/to/scenes`
- `--file dancing-links-anim.ts`
- `--skip-render`
- `--no-skip-non-scene`
- `--dry-run`
