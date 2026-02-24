import type { Scene } from "../packages/core-ts/src/index";

export type SvgShapeHint =
  | {
      kind: "rect";
      width: number;
      height: number;
      rx?: number;
    }
  | {
      kind: "text";
      text: string;
      fontSize?: number;
      textAnchor?: "start" | "middle" | "end";
    };

export type SvgExportSpec = {
  sceneId: string;
  width: number;
  height: number;
  title?: string;
  sampleTime?: number;
  rootId?: string;
  hints: Record<string, SvgShapeHint>;
};

export type SvgSceneFactory = {
  createScene: () => Scene | Promise<Scene>;
  svgExport: SvgExportSpec;
};
