
## Project Conventions

- Compile/build output must be warning-free.
- Cursor icons must follow standard platform usage (for example:
  `pointer`, `grab`, `grabbing`, `not-allowed`, `progress`) and match
  the current interaction affordance.
- In source files and markdown files, keep lines under 80 characters when
  practical.
- Exception: exceed 80 characters when wrapping would make code awkward or
  less readable.
- Avoid UI layout shifts ("UI dance") on all devices when dynamic messages
  or actions appear/disappear.
- This issue is often most visible on small screens, but the rule applies
  universally.
- Reserve stable space or use visibility toggles instead of
  mounting/unmounting controls in flow.
- Prefer modern Svelte 5 patterns, including async and remote functions
  support.
- Remote functions support is optional and only needed when it helps the
  feature at hand.
- Treat Svelte 4 syntax as legacy tech debt and migrate it on sight.
- Svelte 5 specifics:
  - Use runes (`$state`, `$derived`, `$effect`) instead of `$:` reactive
    labels.
  - Example: replace `$: ghostPlacement = ...` with
    `const ghostPlacement = $derived(...)` (or `$derived.by(...)` for
    multi-step logic).
  - Use `$props()` instead of `export let`.
  - Prefer callback props over `createEventDispatcher`.
  - Use event attributes like `onclick={...}` instead of `on:click={...}`.
  - Do not introduce new `$$props` or `$$restProps` usage.
- Keep app code on Svelte 5 (`svelte@^5`) and compatible Vite plugin
  versions.
- Before shipping, verify there are no Svelte 4-style patterns left in
  `*.svelte` files.

## GitHub Comment Formatting

- When posting comments with `gh issue comment`, preserve real newlines.
- Do not include literal `\n` escape sequences in posted Markdown.
- Prefer `--body-file` with a heredoc for multi-line comments.
- Keep comments short and actionable.
- Reference commits as short SHAs (for example: `837c44f`).
- Reference files with repo-relative paths (for example:
  `webgl/tests/drag-move-piece.spec.ts`), not absolute local paths.

## Spec Directives

- `spec` means: restate the current spec, or a sub-spec (part of the spec).
- `incspec` means: incremental spec.
- In practice, `incspec` means restating the current spec or sub-spec, then
  applying the requested incremental changes.
- `specmd` means: create or update a `.md` file that contains the current
  requested spec (or sub-spec).
- An `incspec` response must include a section named
  `Imprecisions / Inconsistencies`.
- That section must explicitly list unclear, conflicting, or underspecified
  points that still require decisions.

## `sv/` Setup

- `sv/` has its own TypeScript toolchain setup.
- Install dependencies with:
  - `cd sv && bun install`
- Current required dev dependencies include:
  - `typescript`
  - `@types/node`
- `.mp4` generation requires `ffmpeg` on PATH.
- Quick video smoke test:
  - `cd sv && bun run gen:basic-mp4`
  - Output file:
    `/Users/cog/mine/manim.fork/sv/output/basic-scene.mp4`
