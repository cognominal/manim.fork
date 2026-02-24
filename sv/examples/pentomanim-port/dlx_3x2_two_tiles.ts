import {
  solveExactCover,
  type DlxResult,
  type PieceDef,
} from "./dlx-3x2-shared";

export const DLX_3X2_TWO_TILE_PIECES: Record<string, PieceDef> = {
  D: {
    name: "D",
    cells: [[0, 0], [0, 1]],
    colorHex: "#3B82F6",
  },
  Q: {
    name: "Q",
    cells: [[0, 0], [0, 1], [1, 0], [1, 1]],
    colorHex: "#F97316",
  },
};

export function runDlx3x2TwoTiles(solutionLimit = 10): DlxResult {
  return solveExactCover({
    boardRows: 3,
    boardCols: 2,
    pieces: DLX_3X2_TWO_TILE_PIECES,
    solutionLimit,
  });
}

function main(): void {
  const result = runDlx3x2TwoTiles(10);
  console.log(JSON.stringify(result));
}

if (import.meta.main) {
  main();
}
