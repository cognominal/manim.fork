import { resolve } from "node:path";
import { type Coord, PIECE_COLORS, type PieceName } from "./pentomino-shared";
import { runPentomino6x10, type SearchEvent } from "./pentomino_6x10";
import {
  blankFrame,
  boardToPixel,
  drawLine,
  drawRect,
  exportWithRasterizer,
  rgb,
} from "./render-shared";

function snapshotAt(
  events: readonly SearchEvent[],
  step: number,
): Map<string, PieceName> {
  const out = new Map<string, PieceName>();
  const lim = Math.max(0, Math.min(step, events.length - 1));
  for (let i = 0; i <= lim; i += 1) {
    const event = events[i];
    for (const [r, c] of event.cells) {
      const key = `${r},${c}`;
      if (event.op === "place") {
        out.set(key, event.piece);
      } else {
        out.delete(key);
      }
    }
  }
  return out;
}

function drawBoard(
  board: ReadonlyMap<string, PieceName>,
  width: number,
  height: number,
): Uint8Array {
  const rows = 6;
  const cols = 10;
  const frame = blankFrame(width, height, rgb("#121417"));
  const geom = boardToPixel(rows, cols, width, height, 36);

  for (const [key, piece] of board.entries()) {
    const [r, c] = key.split(",").map(Number);
    const x0 = geom.left + (c * geom.cell);
    const y0 = geom.top + (r * geom.cell);
    const x1 = x0 + geom.cell - 1;
    const y1 = y0 + geom.cell - 1;
    drawRect(frame, width, height, x0, y0, x1, y1, rgb(PIECE_COLORS[piece]));
  }

  const lineColor = rgb("#323841");
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
  const stepSeconds = 0.22;
  const events = runPentomino6x10(100);
  const duration = Math.max(2, (events.length * stepSeconds) + 0.5);
  const outFile = resolve(
    "/Users/cog/mine/manim.fork/sv/output/pentomino_6x10.mp4",
  );

  await exportWithRasterizer({
    outFile,
    fps,
    width: 960,
    height: 540,
    duration,
    rasterize: (time, width, height) => {
      const step = Math.floor(time / stepSeconds);
      const board = snapshotAt(events, step);
      return drawBoard(board, width, height);
    },
  });

  console.log(outFile);
}

void main();
