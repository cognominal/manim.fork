import {
  addPrunedDescendantsFromUnpruned,
  buildTrace,
  computeLayout,
  orientSolutionChainToRight,
  pickOrderWithRightSolutionBranch,
  triplicatePieceCells,
  type Problem,
} from "./dfs-shared";
import type { PieceName } from "./pentomino-shared";

export type TriplicationResult = {
  problem: Problem;
  selectedPieces: PieceName[];
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

export function runTriplication(maxNodes = 1_500_000): TriplicationResult {
  const triplicated = triplicatePieceCells("Z");
  const basePieces: PieceName[] = [
    "T",
    "I",
    "P",
    "X",
    "W",
    "U",
    "Y",
    "N",
    "V",
  ];

  const selectedPieces = pickOrderWithRightSolutionBranch(
    triplicated.rows,
    triplicated.cols,
    triplicated.cells,
    basePieces,
    80,
  );

  const problem: Problem = {
    rows: triplicated.rows,
    cols: triplicated.cols,
    maskCells: triplicated.cells,
    selectedPieces,
  };

  const pruned = buildTrace(problem, true, {
    maxDisplayDepth: 3,
    maxDisplayChildren: 3,
    maxNodes,
    rightmostBranchDepth: 9,
    continueSiblingsAfterSolution: false,
  });

  const unpruned = buildTrace(problem, false, {
    maxDisplayDepth: 3,
    maxDisplayChildren: 3,
    maxNodes,
    rightmostBranchDepth: 9,
    continueSiblingsAfterSolution: false,
  });

  const enriched = addPrunedDescendantsFromUnpruned(pruned, unpruned, 3, 3);
  const layout = orientSolutionChainToRight(
    enriched,
    computeLayout(enriched.nodes, 12, 3, 1.8, 9, 3),
  );

  return {
    problem,
    selectedPieces,
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
  const result = runTriplication(parseMaxNodes(argv));
  console.log(JSON.stringify(result));
}

if (import.meta.main) {
  main(process.argv.slice(2));
}
