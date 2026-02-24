import {
  solveExactCover,
  type DlxResult,
  type PieceDef,
} from "./dlx-3x2-shared";

export const DLX_3X2_THREE_TILE_PIECES: Record<string, PieceDef> = {
  M: {
    name: "M",
    cells: [[0, 0]],
    colorHex: "#3B82F6",
  },
  D: {
    name: "D",
    cells: [[0, 0], [0, 1]],
    colorHex: "#F97316",
  },
  L: {
    name: "L",
    cells: [[0, 0], [1, 0], [1, 1]],
    colorHex: "#22C55E",
  },
};

export function runDlx3x2ThreeTiles(solutionLimit = 10): DlxResult {
  return solveExactCover({
    boardRows: 3,
    boardCols: 2,
    pieces: DLX_3X2_THREE_TILE_PIECES,
    solutionLimit,
  });
}

function main(): void {
  const result = runDlx3x2ThreeTiles(10);
  console.log(JSON.stringify(result));
}

if (import.meta.main) {
  main();
}
