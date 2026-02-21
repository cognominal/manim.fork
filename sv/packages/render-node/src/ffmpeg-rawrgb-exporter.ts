import { spawn } from "node:child_process";
import type { ExportMp4Options, Scene, SceneFrame, VideoExporter } from "../../core-ts/src/index";

export type RasterizeFrame = (frame: SceneFrame, width: number, height: number) => Uint8Array;

async function writeToStdin(
  stream: NodeJS.WritableStream,
  chunk: Uint8Array,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const ok = stream.write(chunk, (err?: Error | null) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
    if (!ok) {
      stream.once("drain", resolve);
    }
  });
}

export class FfmpegRawRgbExporter implements VideoExporter {
  private readonly rasterize: RasterizeFrame;

  public constructor(rasterize: RasterizeFrame) {
    this.rasterize = rasterize;
  }

  public async exportMp4(scene: Scene, opts: ExportMp4Options): Promise<void> {
    const fps = Math.max(1, Math.floor(opts.fps));
    const width = Math.max(1, Math.floor(opts.width));
    const height = Math.max(1, Math.floor(opts.height));
    const totalFrames = Math.max(1, Math.ceil(opts.duration * fps));

    const ffmpeg = spawn("ffmpeg", [
      "-y",
      "-f",
      "rawvideo",
      "-pix_fmt",
      "rgb24",
      "-s",
      `${width}x${height}`,
      "-r",
      String(fps),
      "-i",
      "-",
      "-an",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      opts.outFile,
    ]);

    let ffmpegStderr = "";
    ffmpeg.stderr.on("data", (chunk) => {
      ffmpegStderr += String(chunk);
    });

    for (let i = 0; i < totalFrames; i += 1) {
      const t = i / fps;
      const frame = scene.sample(t);
      const rgb = this.rasterize(frame, width, height);
      if (rgb.byteLength !== width * height * 3) {
        throw new Error(
          `Rasterizer returned ${rgb.byteLength} bytes, expected ${width * height * 3}`,
        );
      }
      await writeToStdin(ffmpeg.stdin, rgb);
    }

    ffmpeg.stdin.end();

    await new Promise<void>((resolve, reject) => {
      ffmpeg.on("exit", (code) => {
        if (code === 0) {
          resolve();
          return;
        }
        reject(new Error(`ffmpeg failed with code ${code}\n${ffmpegStderr}`));
      });
      ffmpeg.on("error", reject);
    });
  }
}
