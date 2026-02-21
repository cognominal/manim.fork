import type { Scene, VideoExporter } from "../../core-ts/src/index";
import type { ExportMp4Options } from "../../core-ts/src/index";

export interface RenderFrameSink {
  onFrame(frameIndex: number, timeSeconds: number): Promise<void> | void;
  onDone?(): Promise<void> | void;
}

export class StubVideoExporter implements VideoExporter {
  private readonly sink?: RenderFrameSink;

  public constructor(opts?: { sink?: RenderFrameSink }) {
    this.sink = opts?.sink;
  }

  public async exportMp4(scene: Scene, opts: ExportMp4Options): Promise<void> {
    const fps = Math.max(1, Math.floor(opts.fps));
    const totalFrames = Math.max(1, Math.ceil(opts.duration * fps));

    // Stub flow: sample frames deterministically so the call path can be tested.
    for (let i = 0; i < totalFrames; i += 1) {
      const timeSeconds = i / fps;
      scene.sample(timeSeconds);
      await this.sink?.onFrame(i, timeSeconds);
    }
    await this.sink?.onDone?.();
  }
}
