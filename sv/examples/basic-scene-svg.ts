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

const SVG_SQUARE = [
  "<svg width=\"40\" height=\"40\" viewBox=\"0 0 40 40\">",
  "  <rect x=\"0\" y=\"0\" width=\"40\" height=\"40\" fill=\"#22c55e\" />",
  "</svg>",
].join("\n");

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
      strokeColor: "#0b3d2e",
      strokeWidth: 2,
      fillColor: "#22c55e",
      fillOpacity: 1,
      opacity: 1,
    },
    visible: true,
  };
}

function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  const alpha = (value - inMin) / (inMax - inMin);
  return outMin + alpha * (outMax - outMin);
}

function rasterize(
  frame: SceneFrame,
  width: number,
  height: number,
): Uint8Array {
  const rgb = new Uint8Array(width * height * 3);
  const first = frame.mobjects[0];
  const xWorld = first?.transform.position.x ?? 0;
  const yWorld = first?.transform.position.y ?? 0;

  const cx = Math.round(mapRange(xWorld, 0, 10, 40, width - 40));
  const cy = Math.round(mapRange(yWorld, -5, 5, height - 40, 40));
  const half = 20;
  const x0 = Math.max(0, cx - half);
  const x1 = Math.min(width - 1, cx + half);
  const y0 = Math.max(0, cy - half);
  const y1 = Math.min(height - 1, cy + half);

  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const idx = (y * width + x) * 3;
      rgb[idx] = 34;
      rgb[idx + 1] = 197;
      rgb[idx + 2] = 94;
    }
  }

  return rgb;
}

async function main(): Promise<void> {
  const square = new BaseMobject(snapshotAtX("square-svg", 0));
  const scene = new BasicScene([square]);

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

  const outFile = resolve(
    "/Users/cog/mine/manim.fork/sv/examples/basic-scene-svg.mp4",
  );
  mkdirSync(resolve(outFile, ".."), { recursive: true });

  const exporter = new FfmpegRawRgbExporter(rasterize);
  await exporter.exportMp4(scene, {
    outFile,
    fps: 30,
    width: 640,
    height: 360,
    duration: 3,
  });

  console.log("svg-source-bytes", SVG_SQUARE.length);
  console.log(outFile);
}

void main();
