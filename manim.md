# Manim Glossary

This glossary explains core Manim concepts used in code, docs, and CLI
workflows.

## A

- **Ambient camera rotation**: Automatic camera motion around a 3D scene,
  usually enabled in `ThreeDScene` for continuous orbiting views.
- **Animation**: A time-based transformation applied to one or more mobjects.
  Examples: `FadeIn`, `Create`, `Transform`.
- **Animation group**: A composition (`AnimationGroup`, `Succession`,
  `LaggedStart`) that coordinates multiple animations.
- **Arc**: A curved geometric mobject representing part of a circle.
- **Arrange**: A layout method (`arrange`, `arrange_in_grid`) for placing
  mobjects with consistent spacing.
- **Axes**: A coordinate-system mobject with x/y (and optionally z) axes,
  ticks, and labels.

## B

- **Background color**: Scene clear color, set via config or camera.
- **Bezier curve**: The spline representation used internally for vectorized
  paths (`VMobject`).
- **Brace**: A decorative SVG-like mobject that attaches to another object,
  often used with labels.
- **Buffer (`buff`)**: Standard spacing argument between mobjects, edges,
  or labels.

## C

- **Cairo renderer**: CPU raster renderer used by Manim Community for frame
  generation in the classic pipeline.
- **Camera**: The object controlling view framing, projection, and rendered
  output for a scene.
- **Center**: Geometric center point of a mobject, used for positioning and
  transforms.
- **Classical scene lifecycle**: `construct()` runs once; `play`, `wait`, and
  mobject mutations build the final animation timeline.
- **CLI**: Command-line interface (`manim ...`) used to render scenes,
  configure quality, select output, and control previews.
- **CoM / centroid**: The center of mass estimate of a shape or point set,
  often used as transform anchors.
- **Color constants**: Built-in color names (`BLUE`, `YELLOW`, etc.) and
  conversion helpers.
- **Config**: Runtime settings loaded from defaults, `manim.cfg`, and CLI
  flags (frame rate, resolution, media directory, renderer, etc.).
- **Coordinate system**: Shared abstraction for `Axes`, `NumberPlane`, and
  related graphing mobjects.
- **Copy**: `mobject.copy()` clones style/geometry state for reuse in
  transforms.

## D

- **Depth / z-order**: Visual ordering in 2D and 3D; in 2D usually managed by
  draw order or `z_index`.
- **Dot**: A point-like circular marker mobject.
- **Draw order**: The sequence objects are rendered; later objects can appear
  on top.

## E

- **Easing / rate function**: Function mapping normalized time to animation
  progress (`linear`, `smooth`, `there_and_back`, etc.).
- **Edge alignment**: Positioning relative to screen boundaries with helpers
  like `to_edge` and `to_corner`.

## F

- **Family**: A mobject and its recursive submobjects.
- **Fade**: A family of opacity-based animations (`FadeIn`, `FadeOut`,
  `FadeTransform`).
- **Final frame**: Last rendered frame of a scene, used in image outputs and
  some checks.
- **Fixed-in-frame mobject**: A 3D-scene label or HUD element that stays in
  screen space while the camera moves.

## G

- **Graph mobject**: A node/edge structure rendered as mobjects, useful for
  discrete math and algorithms.
- **Group / VGroup**: Container mobject for collective transforms or styling;
  `VGroup` specializes for vectorized children.

## H

- **Hashing / cache key**: Mechanism Manim uses to detect reusable renders for
  unchanged animation segments.

## I

- **ImageMobject**: Raster image object inserted into scenes.
- **Interpolator**: Internal logic that computes in-between values during
  animations.

## K

- **Keyframe mindset**: In Manim, key states are expressed by mobject state
  changes before/after `play`; interpolation fills in motion.

## L

- **Lag ratio**: Stagger amount between child animations in group animations.
- **LaTeX mobject**: Text rendered through TeX (`Tex`, `MathTex`) and imported
  as vector paths.
- **Line**: Basic straight-segment geometry mobject.

## M

- **MarkupText**: Rich text mobject with Pango markup support.
- **Media directory**: Output root for generated videos, images, and caches.
- **Mobject**: Fundamental visual object type in Manim.
- **MoveToTarget**: Animation workflow where `generate_target()` creates a
  future state and animation moves toward it.

## N

- **Number line**: 1D coordinate helper with ticks and labels.
- **NumberPlane**: 2D grid coordinate helper often used for plotting.

## O

- **OpenGL renderer**: GPU-oriented renderer path with OpenGL mobject classes
  and renderer-specific behavior.
- **Opacity**: Alpha channel control for fill/stroke visibility.

## P

- **Path**: Ordered points/curves defining shape outlines in vectorized
  mobjects.
- **Point cloud mobject**: Mobject represented by many points rather than
  closed vector paths.
- **Positioning helpers**: Methods like `next_to`, `align_to`, `shift`,
  `move_to`, and `match_x/y/z`.
- **Preview**: Local quick playback window or media output used during
  iteration.

## Q

- **Quality preset**: CLI shortcuts (`-ql`, `-qm`, `-qh`, `-qk`) mapping to
  resolution and frame rate combinations.

## R

- **Rate function**: See easing; controls temporal pacing of animation.
- **Renderer**: Backend responsible for converting scene state into frames
  (Cairo or OpenGL).
- **Replacement transform**: A transform where one mobject transitions into
  another and source/target ownership is managed automatically.
- **Run time (`run_time`)**: Duration in seconds for an animation passed to
  `play`.

## S

- **Scene**: Top-level unit of animation authoring. A scene class defines
  `construct()` and yields one renderable output.
- **Scene file writer**: Component that writes frames, videos, gifs, and
  section outputs.
- **Section**: Named segmentation of a scene for presentation workflows and
  partial outputs.
- **Shift**: Relative translation of a mobject by a vector.
- **Submobject**: Child of a mobject in the scene graph hierarchy.
- **SVG mobject**: Mobject created from SVG paths (`SVGMobject`).

## T

- **Tex template**: TeX preamble/template used to compile `Tex`/`MathTex`
  content.
- **ThreeDScene**: Scene subclass with 3D camera controls and helpers.
- **Transform**: Animation morphing one mobject state into another.
- **Updater**: Callback run every frame to keep a mobject synchronized with
  evolving state.

## V

- **ValueTracker**: Mutable scalar container commonly used with updaters and
  animation interpolation.
- **Vectorized mobject (`VMobject`)**: Path-based mobject type with stroke and
  fill style controls.

## W

- **Wait**: Timeline pause (`self.wait(...)`) that advances time with no
  explicit transformation.

## Z

- **`z_index`**: Explicit layering value for stable draw ordering in 2D.
- **Zoomed scene**: Scene variant that includes a magnified inset camera for
  focus regions.

## Common Command Patterns

- Render one scene:
  `manim path/to/file.py SceneName`
- Quick low-quality preview:
  `manim -ql path/to/file.py SceneName -p`
- High quality:
  `manim -qh path/to/file.py SceneName`
- Save only final frame image:
  `manim -s path/to/file.py SceneName`
- Select OpenGL renderer:
  `manim --renderer=opengl path/to/file.py SceneName`

## Mental Model Summary

- A **scene** is a timeline.
- A **mobject** is a visual node in a hierarchy.
- An **animation** transitions mobject state over time.
- A **renderer** turns timeline states into pixel frames.
- **Config + CLI flags** control output quality, backend, and destinations.
