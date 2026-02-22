import { resolve } from "node:path";
import { PIECE_COLORS, type Placement } from "./pentomino-shared";
import { findUniqueSolutions } from "./pentomino_6x10_five";
import {
  blankFrame,
  boardToPixel,
  drawLine,
  drawRect,
  exportWithRasterizer,
  rgb,
} from "./render-shared";

function cellsForMoment(
  solutions: readonly (readonly Placement[])[],
  time: number,
  perSolutionSeconds: number,
): Map<string, string> {
  const out = new Map<string, string>();
  if (solutions.length === 0) {
    return out;
  }

  const idx = Math.floor(time / perSolutionSeconds) % solutions.length;
  const local = time % perSolutionSeconds;
  const buildSeconds = perSolutionSeconds * 0.8;
  const showCount = Math.min(
    solutions[idx].length,
    Math.floor((local / buildSeconds) * solutions[idx].length) + 1,
  );

  for (let i = 0; i < showCount; i += 1) {
    const [name, cells] = solutions[idx][i];
    for (const [r, c] of cells) {
      out.set(`${r},${c}`, name);
    }
  }

  return out;
}

function drawBoard(
  board: ReadonlyMap<string, string>,
  width: number,
  height: number,
): Uint8Array {
  const rows = 6;
  const cols = 10;
  const frame = blankFrame(width, height, rgb("#0f1217"));
  const geom = boardToPixel(rows, cols, width, height, 36);

  for (const [key, piece] of board.entries()) {
    const [r, c] = key.split(",").map(Number);
    const x0 = geom.left + (c * geom.cell);
    const y0 = geom.top + (r * geom.cell);
    const x1 = x0 + geom.cell - 1;
    const y1 = y0 + geom.cell - 1;
    drawRect(
      frame,
      width,
      height,
      x0,
      y0,
      x1,
      y1,
      rgb(PIECE_COLORS[piece as keyof typeof PIECE_COLORS]),
    );
  }

  const lineColor = rgb("#303641");
  for (let r = 0; r <= rows; r += 1) {
    const y = geom.top + (r * geom.cell);
    drawLine(
      frame,
      width,
      height,
      geom.left,
      y,
      geom.left + (cols * geom.cell),
      y,
      lineColor,
    );
  }
  for (let c = 0; c <= cols; c += 1) {
    const x = geom.left + (c * geom.cell);
    drawLine(
      frame,
      width,
      height,
      x,
      geom.top,
      x,
      geom.top + (rows * geom.cell),
      lineColor,
    );
  }

  return frame;
}

async function main(): Promise<void> {
  const fps = 30;
  const solutions = findUniqueSolutions(5, 300);
  const perSolutionSeconds = 2.2;
  const duration = Math.max(4, solutions.length * perSolutionSeconds);
  const outFile = resolve(
    "/Users/cog/mine/manim.fork/sv/output/pentomino_6x10_five.mp4",
  );

  await exportWithRasterizer({
    outFile,
    fps,
    width: 960,
    height: 540,
    duration,
    rasterize: (time, width, height) => {
      const board = cellsForMoment(solutions, time, perSolutionSeconds);
      return drawBoard(board, width, height);
    },
  });

  console.log(outFile);
}

void main();
