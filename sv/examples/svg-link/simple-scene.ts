import {
  BaseMobject,
  BasicScene,
  type MobjectSnapshot,
} from "../../packages/core-ts/src/index";
import type { SvgSceneFactory } from "../../tools/svg-export-contract";

function baseSnapshot(
  id: string,
  x: number,
  y: number,
  zIndex: number,
): MobjectSnapshot {
  return {
    id,
    name: id,
    parentId: "scene-root",
    zIndex,
    transform: {
      position: { x, y },
      rotation: 0,
      scale: { x: 1, y: 1 },
    },
    style: {
      strokeColor: "#0f172a",
      strokeWidth: 3,
      fillColor: "#f8fafc",
      fillOpacity: 1,
      opacity: 1,
    },
    visible: true,
  };
}

export const sceneFactory: SvgSceneFactory = {
  createScene: () => {
    const rect = new BaseMobject(baseSnapshot("rect-1", 320, 180, 0));

    const text = new BaseMobject({
      ...baseSnapshot("text-1", 320, 190, 1),
      style: {
        strokeWidth: 0,
        fillColor: "#0f172a",
        fillOpacity: 1,
        opacity: 1,
      },
    });

    return new BasicScene([rect, text]);
  },
  svgExport: {
    sceneId: "simple-scene",
    width: 640,
    height: 360,
    title: "Simple fixture scene",
    sampleTime: 0,
    rootId: "scene-root",
    hints: {
      "rect-1": {
        kind: "rect",
        width: 320,
        height: 140,
        rx: 14,
      },
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
