# Pentomanim Port Scope

## Request Clarification

1. Port/adapt Manim scripts from
   `/Users/cog/mine/pentomanim/manim/` to TypeScript under
   `/Users/cog/mine/manim.fork/sv/examples/`.
2. Port/adapt the script(s) that drive `.mp4` generation so video renders run
   through the `sv/` TypeScript toolchain.
3. Update project README documentation to describe setup and execution for the
   migrated examples and MP4 generation.
4. Keep changes aligned with repository conventions and maintain warning-free
   output for the touched build/run paths.

## Delivery Notes

- Prefer direct TypeScript scene ports where practical.
- Reuse shared helpers for layout, drawing, and rendering to reduce
  duplication.
- Document output locations for generated media files.
