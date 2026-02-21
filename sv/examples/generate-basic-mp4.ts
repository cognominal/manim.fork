import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  BaseMobject,
  BasicAnimation,
  BasicScene,
  type MobjectSnapshot,
  type SceneFrame,
} from "../packages/core-ts/src/index";
import { FfmpegRawRgbExporter } from "../packages/render-node/src/index";

function snapshotAtX(id: string, x: number): MobjectSnapshot {
  return {
    id,
    name: id,
    zIndex: 0,
    transform: {
      position: { x, y: 0 },
      rotation: 0,
      scale: { x: 1, y: 1 },
    },
    style: {
      strokeColor: "#ffffff",
      strokeWidth: 2,
      fillColor: "#ffffff",
      fillOpacity: 1,
      opacity: 1,
    },
    visible: true,
  };
}

function mapRange(v: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  const alpha = (v - inMin) / (inMax - inMin);
  return outMin + alpha * (outMax - outMin);
}

function rasterize(frame: SceneFrame, width: number, height: number): Uint8Array {
  const rgb = new Uint8Array(width * height * 3);
  const first = frame.mobjects[0];
  const xWorld = first?.transform.position.x ?? 0;
  const yWorld = first?.transform.position.y ?? 0;

  const cx = Math.round(mapRange(xWorld, 0, 10, 30, width - 30));
  const cy = Math.round(mapRange(yWorld, -5, 5, height - 30, 30));
  const half = 14;

  const x0 = Math.max(0, cx - half);
  const x1 = Math.min(width - 1, cx + half);
  const y0 = Math.max(0, cy - half);
  const y1 = Math.min(height - 1, cy + half);

  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const idx = (y * width + x) * 3;
      rgb[idx] = 255;
      rgb[idx + 1] = 255;
      rgb[idx + 2] = 255;
    }
  }

  return rgb;
}

async function main(): Promise<void> {
  const dot = new BaseMobject(snapshotAtX("dot", 0));
  const scene = new BasicScene([dot]);

  const moveRight = new BasicAnimation({
    id: "move-right",
    duration: 2,
    applyFn: (target, alpha) => {
      const current = target.getSnapshot();
      target.setSnapshot({
        ...current,
        transform: {
          ...current.transform,
          position: {
            ...current.transform.position,
            x: 10 * alpha,
          },
        },
      });
    },
  });

  await scene.play(moveRight);
  await scene.wait(1);

  const outDir = resolve("/Users/cog/mine/manim.fork/sv/output");
  mkdirSync(outDir, { recursive: true });
  const outFile = resolve(outDir, "basic-scene.mp4");

  const exporter = new FfmpegRawRgbExporter(rasterize);
  await exporter.exportMp4(scene, {
    outFile,
    fps: 30,
    width: 640,
    height: 360,
    duration: 3,
  });

  console.log(outFile);
}

void main();
