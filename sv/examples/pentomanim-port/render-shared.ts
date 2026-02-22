import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type {
  Animation,
  Scene,
  SceneFrame,
} from "../../packages/core-ts/src/index";
import { FfmpegRawRgbExporter } from "../../packages/render-node/src/index";

export type Rgb = readonly [number, number, number];

function parseHex(hex: string): Rgb {
  const raw = hex.startsWith("#") ? hex.slice(1) : hex;
  if (raw.length !== 6) {
    throw new Error(`Expected 6-char hex color, got: ${hex}`);
  }
  return [
    Number.parseInt(raw.slice(0, 2), 16),
    Number.parseInt(raw.slice(2, 4), 16),
    Number.parseInt(raw.slice(4, 6), 16),
  ];
}

export function rgb(hex: string): Rgb {
  return parseHex(hex);
}

export class SampledScene implements Scene {
  construct(): void | Promise<void> {
    return;
  }

  play(..._animations: Animation[]): Promise<void> {
    return Promise.resolve();
  }

  wait(_duration?: number): Promise<void> {
    return Promise.resolve();
  }

  sample(time: number): SceneFrame {
    return { time, mobjects: [] };
  }
}

export function blankFrame(
  width: number,
  height: number,
  background: Rgb,
): Uint8Array {
  const out = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 3;
      out[idx] = background[0];
      out[idx + 1] = background[1];
      out[idx + 2] = background[2];
    }
  }
  return out;
}

export function drawRect(
  buffer: Uint8Array,
  width: number,
  height: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: Rgb,
): void {
  const minX = Math.max(0, Math.floor(Math.min(x0, x1)));
  const maxX = Math.min(width - 1, Math.ceil(Math.max(x0, x1)));
  const minY = Math.max(0, Math.floor(Math.min(y0, y1)));
  const maxY = Math.min(height - 1, Math.ceil(Math.max(y0, y1)));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const idx = (y * width + x) * 3;
      buffer[idx] = color[0];
      buffer[idx + 1] = color[1];
      buffer[idx + 2] = color[2];
    }
  }
}

export function drawLine(
  buffer: Uint8Array,
  width: number,
  height: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: Rgb,
): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t);
    if (x < 0 || x >= width || y < 0 || y >= height) {
      continue;
    }
    const idx = (y * width + x) * 3;
    buffer[idx] = color[0];
    buffer[idx + 1] = color[1];
    buffer[idx + 2] = color[2];
  }
}

export function drawCircle(
  buffer: Uint8Array,
  width: number,
  height: number,
  cx: number,
  cy: number,
  radius: number,
  color: Rgb,
): void {
  const r2 = radius * radius;
  const minX = Math.max(0, Math.floor(cx - radius));
  const maxX = Math.min(width - 1, Math.ceil(cx + radius));
  const minY = Math.max(0, Math.floor(cy - radius));
  const maxY = Math.min(height - 1, Math.ceil(cy + radius));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if ((dx * dx) + (dy * dy) > r2) {
        continue;
      }
      const idx = (y * width + x) * 3;
      buffer[idx] = color[0];
      buffer[idx + 1] = color[1];
      buffer[idx + 2] = color[2];
    }
  }
}

export function boardToPixel(
  rows: number,
  cols: number,
  width: number,
  height: number,
  margin = 40,
): {
  cell: number;
  left: number;
  top: number;
} {
  const cell = Math.min(
    (width - (2 * margin)) / cols,
    (height - (2 * margin)) / rows,
  );
  const boardWidth = cell * cols;
  const boardHeight = cell * rows;
  const left = (width - boardWidth) / 2;
  const top = (height - boardHeight) / 2;
  return { cell, left, top };
}

export async function exportWithRasterizer(opts: {
  outFile: string;
  fps: number;
  width: number;
  height: number;
  duration: number;
  rasterize: (time: number, width: number, height: number) => Uint8Array;
}): Promise<void> {
  mkdirSync(dirname(opts.outFile), { recursive: true });

  const scene = new SampledScene();
  const exporter = new FfmpegRawRgbExporter((frame, width, height) =>
    opts.rasterize(frame.time, width, height),
  );

  await exporter.exportMp4(scene, {
    outFile: opts.outFile,
    fps: opts.fps,
    width: opts.width,
    height: opts.height,
    duration: opts.duration,
  });
}
