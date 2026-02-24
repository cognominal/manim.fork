import { resolve } from "node:path";
import { buildDlxAnimFrames } from "./dancing-links-anim";
import {
  blankFrame,
  drawCircle,
  drawLine,
  drawRect,
  exportWithRasterizer,
  rgb,
} from "./render-shared";

const BG = rgb("#0F1115");
const NODE = rgb("#2A2F39");
const NODE_HL = rgb("#3B82F6");
const EDGE = rgb("#4B5563");
const EDGE_HL = rgb("#F59E0B");

function drawRing(
  frame: Uint8Array,
  width: number,
  height: number,
  labels: readonly string[],
  highlight?: string,
): void {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.32;
  const pts: Array<readonly [number, number, string]> = [];

  for (let i = 0; i < labels.length; i += 1) {
    const t = ((Math.PI * 2) * i) / labels.length - (Math.PI / 2);
    const x = cx + (Math.cos(t) * radius);
    const y = cy + (Math.sin(t) * radius);
    pts.push([x, y, labels[i]]);
  }

  for (let i = 0; i < pts.length; i += 1) {
    const [x0, y0, l0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    drawLine(
      frame,
      width,
      height,
      x0,
      y0,
      x1,
      y1,
      l0 === highlight ? EDGE_HL : EDGE,
    );
  }

  for (const [x, y, label] of pts) {
    const color = label === highlight ? NODE_HL : NODE;
    drawCircle(frame, width, height, x, y, 24, color);
  }
}

function render(time: number, width: number, height: number): Uint8Array {
  const frame = blankFrame(width, height, BG);
  const frames = buildDlxAnimFrames(1.0);
  const idx = Math.max(0, Math.min(frames.length - 1, Math.floor(time)));
  const current = frames[idx];

  let highlight: string | undefined;
  const match = current.label.match(/\(([^)]+)\)$/);
  if (match) {
    highlight = match[1];
  }

  drawRing(frame, width, height, current.ring, highlight);

  const barY0 = height - 46;
  drawRect(frame, width, height, 20, barY0, width - 20, height - 20, rgb("#171A21"));
  const progress = (idx + 1) / frames.length;
  drawRect(
    frame,
    width,
    height,
    24,
    barY0 + 4,
    24 + ((width - 48) * progress),
    height - 24,
    rgb("#2563EB"),
  );

  return frame;
}

async function main(): Promise<void> {
  const outFile = resolve(
    "/Users/cog/mine/manim.fork/sv/output/dancing-links-anim.mp4",
  );

  await exportWithRasterizer({
    outFile,
    fps: 30,
    width: 960,
    height: 540,
    duration: 5.2,
    rasterize: render,
  });

  console.log(outFile);
}

void main();
