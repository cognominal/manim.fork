import {
  PIECE_NAMES,
  addPrunedDescendantsFromUnpruned,
  buildTrace,
  computeLayout,
  type Problem,
} from "./dfs-shared";
import type { Coord } from "./pentomino-shared";

export type Rect6x10Result = {
  problem: Problem;
  pruned: {
    totalSteps: number;
    totalElapsedMs: number;
    nodeCount: number;
    eventCount: number;
  };
  unpruned: {
    totalSteps: number;
    totalElapsedMs: number;
    nodeCount: number;
    eventCount: number;
  };
  layout: Record<number, readonly [number, number, number]>;
};

export function runRect6x10(maxNodes = 1_500_000): Rect6x10Result {
  const rows = 6;
  const cols = 10;
  const maskCells: Coord[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      maskCells.push([r, c]);
    }
  }

  const problem: Problem = {
    rows,
    cols,
    maskCells,
    selectedPieces: PIECE_NAMES,
  };

  const pruned = buildTrace(problem, true, {
    maxDisplayDepth: 3,
    maxDisplayChildren: 3,
    maxNodes,
    rightmostBranchDepth: 12,
    continueSiblingsAfterSolution: true,
  });

  const unpruned = buildTrace(problem, false, {
    maxDisplayDepth: 3,
    maxDisplayChildren: 3,
    maxNodes,
    rightmostBranchDepth: 12,
    continueSiblingsAfterSolution: true,
  });

  const enriched = addPrunedDescendantsFromUnpruned(pruned, unpruned, 3, 3);
  const layout = computeLayout(
    enriched.nodes,
    12,
    3,
    1.8,
    12,
    3,
  );

  return {
    problem,
    pruned: {
      totalSteps: pruned.totalSteps,
      totalElapsedMs: pruned.totalElapsedMs,
      nodeCount: Object.keys(pruned.nodes).length,
      eventCount: pruned.events.length,
    },
    unpruned: {
      totalSteps: unpruned.totalSteps,
      totalElapsedMs: unpruned.totalElapsedMs,
      nodeCount: Object.keys(unpruned.nodes).length,
      eventCount: unpruned.events.length,
    },
    layout,
  };
}

function parseMaxNodes(argv: readonly string[]): number {
  for (const arg of argv) {
    if (arg.startsWith("--max-nodes=")) {
      const value = Number(arg.slice("--max-nodes=".length));
      if (Number.isFinite(value) && value > 0) {
        return Math.floor(value);
      }
    }
  }
  return 1_500_000;
}

function main(argv: readonly string[]): void {
  const result = runRect6x10(parseMaxNodes(argv));
  console.log(JSON.stringify(result));
}

if (import.meta.main) {
  main(process.argv.slice(2));
}
