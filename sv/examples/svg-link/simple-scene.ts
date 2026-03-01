import {
  BaseMobject,
  BasicScene,
  type MobjectSnapshot,
} from "../../packages/core-ts/src/index";
import type { SvgSceneFactory } from "../../tools/svg-export-contract";

/**
 * Build a shared snapshot payload for fixture objects in this scene.
 *
 * Why this helper exists:
 * - Keeps geometry/style defaults centralized so fixture setup is concise.
 * - Ensures all fixture nodes are rooted under `scene-root`, which the
 *   SVG export contract expects as the graph root.
 * - Produces deterministic snapshots for test fixtures and sample output.
 */
function baseSnapshot(
  id: string,
  x: number,
  y: number,
  zIndex: number,
): MobjectSnapshot {
  return {
    // `id` is both the stable object key and the hint lookup key.
    id,
    // Reuse id as display name to avoid extra fixture bookkeeping.
    name: id,
    // Explicit root keeps hierarchy stable for export traversals.
    parentId: "scene-root",
    // z-index controls paint order (larger values render above lower ones).
    zIndex,
    transform: {
      // Position is in scene coordinate space (not SVG pixel space directly).
      position: { x, y },
      // No rotation/scaling in this fixture, but include complete transform.
      rotation: 0,
      scale: { x: 1, y: 1 },
    },
    style: {
      // Dark stroke + light fill yields a clearly visible shape in fixtures.
      strokeColor: "#0f172a",
      strokeWidth: 3,
      fillColor: "#f8fafc",
      // Opaque fill and full object opacity for deterministic rendering.
      fillOpacity: 1,
      opacity: 1,
    },
    // Fixture objects are always visible at sampleTime = 0.
    visible: true,
  };
}

export const sceneFactory: SvgSceneFactory = {
  createScene: () => {
    // Background shape layer (z=0): a rounded rectangle centered in frame.
    const rect = new BaseMobject(baseSnapshot("rect-1", 320, 180, 0));

    // Foreground text layer (z=1): positioned slightly lower for optical centering.
    const text = new BaseMobject({
      ...baseSnapshot("text-1", 320, 190, 1),
      style: {
        // Text glyphs should not have path stroke in this fixture.
        strokeWidth: 0,
        // Fill color drives text color in exported SVG.
        fillColor: "#0f172a",
        fillOpacity: 1,
        opacity: 1,
      },
    });

    // Scene graph consists of two independent root-level nodes.
    return new BasicScene([rect, text]);
  },
  svgExport: {
    // Stable ID used by tooling to label output artifacts.
    sceneId: "simple-scene",
    // Export viewport in pixels. Object coordinates are authored for this size.
    width: 640,
    height: 360,
    title: "Simple fixture scene",
    // Sample at t=0 because this fixture has no temporal animation.
    sampleTime: 0,
    // Contract root for parent/child relationships.
    rootId: "scene-root",
    hints: {
      // Geometry hint maps `rect-1` snapshot to a rounded rectangle primitive.
      "rect-1": {
        kind: "rect",
        width: 320,
        height: 140,
        rx: 14,
      },
      // Text hint maps `text-1` snapshot to a text primitive with center anchor.
      "text-1": {
        kind: "text",
        text: "Hello",
        fontSize: 28,
        textAnchor: "middle",
      },
    },
  },
};

export default sceneFactory;
