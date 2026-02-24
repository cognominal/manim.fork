import type { DlxResult, PieceDef, RowDef } from "./dlx-3x2-shared";
import {
  blankFrame,
  drawLine,
  drawRect,
  exportWithRasterizer,
  rgb,
  type Rgb,
} from "./render-shared";

const BG = rgb("#0F1115");
const BOARD_BG = rgb("#131821");
const GRID = rgb("#2F3A4A");
const PROGRESS_BG = rgb("#1A202C");
const PROGRESS_FG = rgb("#2563EB");

function defaultColor(name: string): string {
  if (name === "M") {
    return "#3B82F6";
  }
  if (name === "D") {
    return "#F97316";
  }
  if (name === "Q") {
    return "#A855F7";
  }
  if (name === "L") {
    return "#22C55E";
  }
  return "#94A3B8";
}

function colorForPiece(pieces: Readonly<Record<string, PieceDef>>, name: string): Rgb {
  const raw = pieces[name]?.colorHex ?? defaultColor(name);
  return rgb(raw);
}

function boardGeom(width: number, height: number, rows: number, cols: number): {
  left: number;
  top: number;
  cell: number;
} {
  const cell = Math.min((width * 0.5) / cols, (height * 0.62) / rows);
  const boardW = cell * cols;
  const boardH = cell * rows;
  const left = (width - boardW) / 2;
  const top = (height - boardH) / 2 - 30;
  return { left, top, cell };
}

function rowLookup(rows: readonly RowDef[]): Map<string, RowDef> {
  return new Map(rows.map((row) => [row.name, row] as const));
}

function drawBoard(
  frame: Uint8Array,
  width: number,
  height: number,
  rows: number,
  cols: number,
): void {
  const g = boardGeom(width, height, rows, cols);
  drawRect(
    frame,
    width,
    height,
    g.left,
    g.top,
    g.left + (g.cell * cols),
    g.top + (g.cell * rows),
    BOARD_BG,
  );
  for (let r = 0; r <= rows; r += 1) {
    const y = g.top + (r * g.cell);
    drawLine(
      frame,
      width,
      height,
      g.left,
      y,
      g.left + (cols * g.cell),
      y,
      GRID,
    );
  }
  for (let c = 0; c <= cols; c += 1) {
    const x = g.left + (c * g.cell);
    drawLine(
      frame,
      width,
      height,
      x,
      g.top,
      x,
      g.top + (rows * g.cell),
      GRID,
    );
  }
}

function paintChosenRows(
  frame: Uint8Array,
  width: number,
  height: number,
  result: DlxResult,
  pieces: Readonly<Record<string, PieceDef>>,
  chosenRows: readonly string[],
): void {
  const g = boardGeom(width, height, result.rows, result.cols);
  const lookup = rowLookup(result.rowDefs);
  for (const name of chosenRows) {
    const row = lookup.get(name);
    if (!row) {
      continue;
    }
    for (const [r, c] of row.orientCells) {
      const x0 = g.left + (c * g.cell) + 2;
      const y0 = g.top + (r * g.cell) + 2;
      const x1 = x0 + g.cell - 4;
      const y1 = y0 + g.cell - 4;
      drawRect(
        frame,
        width,
        height,
        x0,
        y0,
        x1,
        y1,
        colorForPiece(pieces, row.piece),
      );
    }
  }
}

function drawProgress(
  frame: Uint8Array,
  width: number,
  height: number,
  step: number,
  total: number,
): void {
  const y0 = height - 40;
  const x0 = 24;
  const x1 = width - 24;
  drawRect(frame, width, height, x0, y0, x1, y0 + 16, PROGRESS_BG);
  const p = total < 1 ? 1 : (step + 1) / total;
  drawRect(frame, width, height, x0 + 1, y0 + 1, x0 + (p * (x1 - x0)), y0 + 15, PROGRESS_FG);
}

export async function generateDlxMp4(opts: {
  result: DlxResult;
  pieces: Readonly<Record<string, PieceDef>>;
  outFile: string;
  fps?: number;
  stepSeconds?: number;
  width?: number;
  height?: number;
}): Promise<void> {
  const fps = opts.fps ?? 30;
  const stepSeconds = opts.stepSeconds ?? 0.45;
  const width = opts.width ?? 960;
  const height = opts.height ?? 540;
  const duration = Math.max(2, (opts.result.steps.length * stepSeconds) + 0.6);

  await exportWithRasterizer({
    outFile: opts.outFile,
    fps,
    width,
    height,
    duration,
    rasterize: (time, w, h) => {
      const step = Math.max(
        0,
        Math.min(
          opts.result.steps.length - 1,
          Math.floor(time / stepSeconds),
        ),
      );
      const frame = blankFrame(w, h, BG);
      drawBoard(frame, w, h, opts.result.rows, opts.result.cols);
      const info = opts.result.steps[step];
      paintChosenRows(frame, w, h, opts.result, opts.pieces, info.chosenRows);
      drawProgress(frame, w, h, step, opts.result.steps.length);
      return frame;
    },
  });
}
