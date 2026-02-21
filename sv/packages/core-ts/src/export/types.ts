import type { Seconds } from "../math/types";
import type { Scene } from "../scene/types";

export interface ExportMp4Options {
  outFile: string;
  fps: number;
  width: number;
  height: number;
  duration: Seconds;
}

export interface VideoExporter {
  exportMp4(scene: Scene, opts: ExportMp4Options): Promise<void>;
}
