# iManim : interactive Manim

TBD : rename this repo into iManim.

This is the boostrapping of an experiment. The idea : If in addition to being
script based, it could be studio based as a svelte 5 app with an studio editor
kind of like inkscape. It meant the language would have to be typescript. So I
ported manim (or whatever subset, I don't know yet anything about manim) to ts
in minutes using codex.

<https://github.com/cognominal/pentomanim/blob/master/dancing_links.py#L16>

## Manim and SVG

<https://gemini.google.com/share/e2d02b0b7377>

### Manim according to gemini

If SVG is the "blueprint," Manim (Mathematical Animation Engine)
is the high-powered cinematic camera
and construction crew that brings those blueprints to life.

The relationship is one of Input and Interpretation.
Manim, originally created by Grant Sanderson for the YouTube channel 3Blue1Brown,
uses SVG as its primary bridge between static design and programmatic motion.

1. How Manim Sees SVG
In Manim, an SVG is not just an image; it is a collection of VMobjects (Vectorized Mobjects).

When you import an SVG into Manim, the engine parses the XML code
and converts every path, circle, and polygon
into a mathematical Python object.

### iManim

Imanim will be ts based and svelte based. Maybe leste  based.
There is the svelte studio to edit iManim code and svelte apps
genererated from iManim scripts. Will iManim scripts be special
svelte comp

the UI widget I am designing to depose pieces in

## iManim, the layout in the repo

iManim would be data driven. A scene will be stored ???

The original [README](./README.orig.md).
We left the original project in place but added two folders.
The choice of name is bad but they are short so for now we stick with that.

* `sv/` : the manim port to ts. It was done in minutes using codex.
* svg/ : See [svg/PLAN.md](/svg/PLAN.md). Instructions to build will be there

## `sv/` quick links

- Workspace README:
  [sv/README.md](/Users/cog/mine/manim.fork/sv/README.md)
- Port scope note:
  [sv/examples/PENTOMANIM_PORT_SCOPE.md](/Users/cog/mine/manim.fork/sv/examples/PENTOMANIM_PORT_SCOPE.md)
