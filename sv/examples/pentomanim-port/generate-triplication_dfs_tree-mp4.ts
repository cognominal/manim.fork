import { resolve } from "node:path";
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
import {
  blankFrame,
  drawCircle,
  drawLine,
  exportWithRasterizer,
  rgb,
} from "./render-shared";

type Pos3 = readonly [number, number, number];

function worldToPixel(
  [x, y]: Pos3,
  width: number,
  height: number,
  spanX = 6.5,
  spanY = 4.5,
): readonly [number, number] {
  const px = ((x + spanX) / (2 * spanX)) * width;
  const py = ((spanY - y) / (2 * spanY)) * height;
  return [px, py];
}

function drawTree(
  positions: Record<number, Pos3>,
  nodes: ReturnType<typeof buildTrace>["nodes"],
  width: number,
  height: number,
): Uint8Array {
  const frame = blankFrame(width, height, rgb("#0e1115"));

  for (const [idStr, node] of Object.entries(nodes)) {
    const nodeId = Number(idStr);
    const [x0, y0] = worldToPixel(positions[nodeId], width, height);
    for (const childId of node.children) {
      const [x1, y1] = worldToPixel(positions[childId], width, height);
      drawLine(frame, width, height, x0, y0, x1, y1, rgb("#384150"));
    }
  }

  for (const [idStr, node] of Object.entries(nodes)) {
    const nodeId = Number(idStr);
    const [x, y] = worldToPixel(positions[nodeId], width, height);
    const color = node.pruned
      ? rgb("#7a1f2c")
      : node.counterfactual
        ? rgb("#7c86a0")
        : node.rightmostChain
          ? rgb("#d4b26d")
          : rgb("#a8b5c7");
    drawCircle(frame, width, height, x, y, 4, color);
  }

  return frame;
}

async function main(): Promise<void> {
  const maxNodes = Number.parseInt(
    process.argv
      .find((arg) => arg.startsWith("--max-nodes="))
      ?.slice("--max-nodes=".length) ?? "30000",
    10,
  );
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

  const trace = addPrunedDescendantsFromUnpruned(pruned, unpruned, 3, 3);
  const pos = computeLayout(trace.nodes, 12, 3, 1.8, 9, 3);
  const positions = orientSolutionChainToRight(trace, pos);

  const outFile = resolve(
    "/Users/cog/mine/manim.fork/sv/output/triplication_dfs_tree.mp4",
  );

  await exportWithRasterizer({
    outFile,
    fps: 30,
    width: 1280,
    height: 720,
    duration: 4,
    rasterize: (_time, width, height) =>
      drawTree(positions, trace.nodes, width, height),
  });

  console.log(outFile);
}

void main();
