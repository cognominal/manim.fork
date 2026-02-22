import {
  type Coord,
  type PieceName,
  PIECE_NAMES,
  ORIENTATIONS,
  PENTOMINOES,
  coordKey,
  shiftCells,
} from "./pentomino-shared";

export type Problem = {
  rows: number;
  cols: number;
  maskCells: readonly Coord[];
  selectedPieces: readonly PieceName[];
};

export type NodeData = {
  nodeId: number;
  parentId?: number;
  depth: number;
  board: Record<string, PieceName>;
  pruned: boolean;
  counterfactual: boolean;
  rightmostChain: boolean;
  stepAtEnter: number;
  elapsedMsAtEnter: number;
  children: number[];
  elapsedMs?: number;
  exploredSubnodes: number;
};

export type TraceEvent = {
  kind: "enter" | "exit";
  nodeId: number;
};

export type TraceResult = {
  nodes: Record<number, NodeData>;
  events: TraceEvent[];
  totalSteps: number;
  totalElapsedMs: number;
  stepElapsedMs: number[];
};

export type BuildTraceOptions = {
  maxDisplayDepth?: number;
  maxDisplayChildren?: number;
  maxNodes?: number;
  rightmostBranchDepth?: number;
  continueSiblingsAfterSolution?: boolean;
};

const DEFAULT_DISPLAY_DEPTH = 3;
const DEFAULT_DISPLAY_CHILDREN = 3;
const DEFAULT_MAX_NODES = 1_500_000;

function nowMs(): number {
  return performance.now();
}

function boardSignature(board: Record<string, PieceName>): string {
  return Object.entries(board)
    .sort(([a], [b]) => {
      const [ar, ac] = a.split(",").map(Number);
      const [br, bc] = b.split(",").map(Number);
      return (ar - br) || (ac - bc);
    })
    .map(([k, piece]) => `${k}:${piece}`)
    .join("|");
}

export function addPrunedDescendantsFromUnpruned(
  prunedTrace: TraceResult,
  unprunedTrace: TraceResult,
  maxDisplayDepth: number,
  maxDisplayChildren: number,
): TraceResult {
  const nodes: Record<number, NodeData> = {};
  for (const [idStr, node] of Object.entries(prunedTrace.nodes)) {
    const nodeId = Number(idStr);
    nodes[nodeId] = {
      ...node,
      board: { ...node.board },
      children: [...node.children],
    };
  }

  const events: TraceEvent[] = [];
  let nextId = Math.max(-1, ...Object.keys(nodes).map(Number)) + 1;

  const unprunedBySig = new Map<string, number>();
  for (const event of unprunedTrace.events) {
    if (event.kind !== "enter") {
      continue;
    }
    const signature = boardSignature(unprunedTrace.nodes[event.nodeId].board);
    if (!unprunedBySig.has(signature)) {
      unprunedBySig.set(signature, event.nodeId);
    }
  }

  const cloneSubtree = (unprunedId: number, parentId: number): void => {
    const parent = nodes[parentId];
    if (parent.depth >= maxDisplayDepth) {
      return;
    }
    const unNode = unprunedTrace.nodes[unprunedId];
    for (const childId of unNode.children.slice(0, maxDisplayChildren)) {
      if (parent.children.length >= maxDisplayChildren) {
        break;
      }
      const unChild = unprunedTrace.nodes[childId];
      const newId = nextId;
      nextId += 1;
      nodes[newId] = {
        nodeId: newId,
        parentId,
        depth: parent.depth + 1,
        board: { ...unChild.board },
        pruned: false,
        counterfactual: true,
        rightmostChain: unChild.rightmostChain,
        stepAtEnter: unChild.stepAtEnter,
        elapsedMsAtEnter: unChild.elapsedMsAtEnter,
        children: [],
        exploredSubnodes: 0,
      };
      parent.children.push(newId);
      events.push({ kind: "enter", nodeId: newId });
      cloneSubtree(childId, newId);
      events.push({ kind: "exit", nodeId: newId });
    }
  };

  for (const event of prunedTrace.events) {
    events.push(event);
    if (event.kind !== "enter") {
      continue;
    }
    const node = nodes[event.nodeId];
    if (!node.pruned) {
      continue;
    }
    const signature = boardSignature(node.board);
    const matchId = unprunedBySig.get(signature);
    if (matchId !== undefined) {
      cloneSubtree(matchId, event.nodeId);
    }
  }

  return {
    nodes,
    events,
    totalSteps: prunedTrace.totalSteps,
    totalElapsedMs: prunedTrace.totalElapsedMs,
    stepElapsedMs: [...prunedTrace.stepElapsedMs],
  };
}

export function triplicatePieceCells(piece: PieceName): {
  rows: number;
  cols: number;
  cells: Coord[];
} {
  const base = PENTOMINOES[piece];
  const rows = Math.max(...base.map(([r]) => r)) + 1;
  const cols = Math.max(...base.map(([, c]) => c)) + 1;
  const cells: Coord[] = [];
  for (const [r, c] of base) {
    for (let dr = 0; dr < 3; dr += 1) {
      for (let dc = 0; dc < 3; dc += 1) {
        cells.push([r * 3 + dr, c * 3 + dc]);
      }
    }
  }
  return { rows: rows * 3, cols: cols * 3, cells };
}

function hasOnlyFiveMultipleVoidRegions(
  rows: number,
  cols: number,
  allowedKeys: ReadonlySet<string>,
  sortedMask: readonly Coord[],
  filledKeys: ReadonlySet<string>,
): boolean {
  const visited = new Set<string>();
  const deltas: readonly Coord[] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (const [r, c] of sortedMask) {
    const start = coordKey([r, c]);
    if (filledKeys.has(start) || visited.has(start)) {
      continue;
    }

    let size = 0;
    const stack: Coord[] = [[r, c]];
    visited.add(start);

    while (stack.length > 0) {
      const [cr, cc] = stack.pop() as Coord;
      size += 1;
      for (const [dr, dc] of deltas) {
        const nr = cr + dr;
        const nc = cc + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
          continue;
        }
        const key = coordKey([nr, nc]);
        if (!allowedKeys.has(key)) {
          continue;
        }
        if (filledKeys.has(key) || visited.has(key)) {
          continue;
        }
        visited.add(key);
        stack.push([nr, nc]);
      }
    }

    if ((size % 5) !== 0) {
      return false;
    }
  }

  return true;
}

export function buildTrace(
  problem: Problem,
  enablePruning: boolean,
  options: BuildTraceOptions = {},
): TraceResult {
  const maxDisplayDepth =
    options.maxDisplayDepth ?? DEFAULT_DISPLAY_DEPTH;
  const maxDisplayChildren =
    options.maxDisplayChildren ?? DEFAULT_DISPLAY_CHILDREN;
  const maxNodes = options.maxNodes ?? DEFAULT_MAX_NODES;
  const rightmostBranchDepth =
    options.rightmostBranchDepth ?? maxDisplayDepth;
  const continueSiblingsAfterSolution =
    options.continueSiblingsAfterSolution ?? false;

  const sortedMask = [...problem.maskCells].sort(
    ([ar, ac], [br, bc]) => (ar - br) || (ac - bc),
  );
  const allowedKeys = new Set(sortedMask.map(coordKey));

  const used = new Set<PieceName>();
  const filledKeys = new Set<string>();
  const board: Record<string, PieceName> = {};

  const nodes: Record<number, NodeData> = {};
  const events: TraceEvent[] = [];
  let nextNodeId = 0;
  let nodeCounter = 0;
  const start = nowMs();
  const stepElapsedMs: number[] = [0];

  const createNode = (
    parentId: number | undefined,
    depth: number,
    pruned = false,
    rightmostChain = false,
  ): number => {
    const nodeId = nextNodeId;
    nextNodeId += 1;
    nodes[nodeId] = {
      nodeId,
      parentId,
      depth,
      board: { ...board },
      pruned,
      counterfactual: false,
      rightmostChain,
      stepAtEnter: nodeCounter,
      elapsedMsAtEnter: nowMs() - start,
      children: [],
      exploredSubnodes: 0,
    };
    events.push({ kind: "enter", nodeId });
    if (parentId !== undefined) {
      nodes[parentId].children.push(nodeId);
    }
    return nodeId;
  };

  const firstEmpty = (): Coord | undefined => {
    for (const rc of sortedMask) {
      if (!filledKeys.has(coordKey(rc))) {
        return rc;
      }
    }
    return undefined;
  };

  const canPlace = (cells: readonly Coord[]): boolean => {
    for (const rc of cells) {
      const key = coordKey(rc);
      if (!allowedKeys.has(key) || filledKeys.has(key)) {
        return false;
      }
    }
    return true;
  };

  const apply = (name: PieceName, cells: readonly Coord[]): void => {
    used.add(name);
    for (const rc of cells) {
      const key = coordKey(rc);
      filledKeys.add(key);
      board[key] = name;
    }
  };

  const unapply = (name: PieceName, cells: readonly Coord[]): void => {
    used.delete(name);
    for (const rc of cells) {
      const key = coordKey(rc);
      filledKeys.delete(key);
      delete board[key];
    }
  };

  const solutionNextMove = (): [PieceName, readonly Coord[]] | undefined => {
    const solveFirst = (
      firstMove?: [PieceName, readonly Coord[]],
    ): [PieceName, readonly Coord[]] | undefined => {
      const spot = firstEmpty();
      if (!spot) {
        return firstMove;
      }

      const [anchorR, anchorC] = spot;
      for (const name of problem.selectedPieces) {
        if (used.has(name)) {
          continue;
        }
        for (const orient of ORIENTATIONS[name]) {
          for (const [cellR, cellC] of orient) {
            const shifted = shiftCells(
              orient,
              anchorR - cellR,
              anchorC - cellC,
            );
            if (!canPlace(shifted)) {
              continue;
            }
            apply(name, shifted);
            let ok = true;
            if (enablePruning) {
              ok = hasOnlyFiveMultipleVoidRegions(
                problem.rows,
                problem.cols,
                allowedKeys,
                sortedMask,
                filledKeys,
              );
            }
            if (ok) {
              const nextFirst = firstMove ?? [name, shifted];
              const got = solveFirst(nextFirst);
              if (got) {
                unapply(name, shifted);
                return got;
              }
            }
            unapply(name, shifted);
          }
        }
      }

      return undefined;
    };

    return solveFirst();
  };

  const dfs = (
    depth: number,
    displayNodeId: number | undefined,
  ): [solved: boolean, subtreeNodes: number, aborted: boolean] => {
    nodeCounter += 1;
    stepElapsedMs.push(nowMs() - start);
    if (nodeCounter > maxNodes) {
      return [false, 1, true];
    }

    const stepStart = nowMs();
    let subtreeNodes = 1;

    const anchor = firstEmpty();
    if (!anchor) {
      if (displayNodeId !== undefined) {
        nodes[displayNodeId].elapsedMs = nowMs() - stepStart;
        nodes[displayNodeId].exploredSubnodes = 0;
        events.push({ kind: "exit", nodeId: displayNodeId });
      }
      return [true, subtreeNodes, false];
    }

    const [anchorR, anchorC] = anchor;
    const attempts: Array<{
      kind: "valid" | "pruned";
      name: PieceName;
      shifted: readonly Coord[];
    }> = [];

    for (const name of problem.selectedPieces) {
      if (used.has(name)) {
        continue;
      }
      for (const orient of ORIENTATIONS[name]) {
        for (const [cellR, cellC] of orient) {
          const shifted = shiftCells(orient, anchorR - cellR, anchorC - cellC);
          if (!canPlace(shifted)) {
            continue;
          }

          apply(name, shifted);
          let passes = true;
          if (enablePruning) {
            passes = hasOnlyFiveMultipleVoidRegions(
              problem.rows,
              problem.cols,
              allowedKeys,
              sortedMask,
              filledKeys,
            );
          }
          unapply(name, shifted);
          attempts.push({
            kind: passes ? "valid" : "pruned",
            name,
            shifted,
          });
        }
      }
    }

    let rightmostIdx = -1;
    const displayIndices = new Set<number>();

    if (displayNodeId !== undefined && attempts.length > 0) {
      const parent = nodes[displayNodeId];
      const localDepthCap = parent.rightmostChain
        ? rightmostBranchDepth
        : maxDisplayDepth;
      const canDisplayChildren = depth < localDepthCap;

      if (canDisplayChildren) {
        const validIndices = attempts
          .map((attempt, idx) => ({ attempt, idx }))
          .filter(({ attempt }) => attempt.kind === "valid")
          .map(({ idx }) => idx);

        const nextMove = solutionNextMove();
        if (nextMove) {
          rightmostIdx = attempts.findIndex(
            ({ kind, name, shifted }) =>
              kind === "valid"
              && name === nextMove[0]
              && shifted.length === nextMove[1].length
              && shifted.every(
                ([r, c], i) =>
                  r === nextMove[1][i][0] && c === nextMove[1][i][1],
              ),
          );
        }

        if (rightmostIdx < 0) {
          rightmostIdx = validIndices.at(-1) ?? (attempts.length - 1);
        }

        if (parent.rightmostChain) {
          displayIndices.add(rightmostIdx);
        } else if (attempts.length <= maxDisplayChildren) {
          for (let i = 0; i < attempts.length; i += 1) {
            displayIndices.add(i);
          }
        } else {
          displayIndices.add(0);
          displayIndices.add(1);
          displayIndices.add(rightmostIdx);
        }
      }
    }

    let foundSolution = false;

    for (let idx = 0; idx < attempts.length; idx += 1) {
      const { kind, name, shifted } = attempts[idx];
      const parent =
        displayNodeId !== undefined ? nodes[displayNodeId] : undefined;
      const parentIsChain = parent?.rightmostChain ?? false;
      const chainRootOk = depth === 0 || parentIsChain;
      const childOnChain = chainRootOk && (idx === rightmostIdx);

      if (!displayIndices.has(idx)) {
        continue;
      }

      if (kind === "pruned") {
        if (displayNodeId !== undefined) {
          apply(name, shifted);
          const prunedId = createNode(
            displayNodeId,
            depth + 1,
            true,
            childOnChain,
          );
          events.push({ kind: "exit", nodeId: prunedId });
          unapply(name, shifted);
        }
        continue;
      }

      apply(name, shifted);
      let childDisplayId: number | undefined;
      if (displayNodeId !== undefined) {
        childDisplayId = createNode(
          displayNodeId,
          depth + 1,
          false,
          childOnChain,
        );
      }

      const [solved, childCount, aborted] = dfs(depth + 1, childDisplayId);
      subtreeNodes += childCount;
      unapply(name, shifted);

      if (aborted) {
        if (displayNodeId !== undefined) {
          nodes[displayNodeId].elapsedMs = nowMs() - stepStart;
          nodes[displayNodeId].exploredSubnodes = Math.max(0, subtreeNodes - 1);
          events.push({ kind: "exit", nodeId: displayNodeId });
        }
        return [false, subtreeNodes, true];
      }

      if (solved) {
        if (parentIsChain || !continueSiblingsAfterSolution) {
          if (displayNodeId !== undefined) {
            nodes[displayNodeId].elapsedMs = nowMs() - stepStart;
            nodes[displayNodeId].exploredSubnodes =
              Math.max(0, subtreeNodes - 1);
            events.push({ kind: "exit", nodeId: displayNodeId });
          }
          return [true, subtreeNodes, false];
        }
        foundSolution = true;
      }
    }

    if (displayNodeId !== undefined) {
      nodes[displayNodeId].elapsedMs = nowMs() - stepStart;
      nodes[displayNodeId].exploredSubnodes = Math.max(0, subtreeNodes - 1);
      events.push({ kind: "exit", nodeId: displayNodeId });
    }

    if (foundSolution) {
      return [true, subtreeNodes, false];
    }
    return [false, subtreeNodes, false];
  };

  const rootId = createNode(undefined, 0);
  void dfs(0, rootId);

  return {
    nodes,
    events,
    totalSteps: nodeCounter,
    totalElapsedMs: nowMs() - start,
    stepElapsedMs,
  };
}

export function computeLayout(
  nodes: Record<number, NodeData>,
  totalWidth = 12,
  topY = 3,
  normalStep = 1.8,
  chainDepth = 9,
  chainDepthSpan = 3,
): Record<number, readonly [number, number, number]> {
  const rootId = 0;
  const xPos: Record<number, number> = {};
  let leafCursor = 0;

  const assignX = (nodeId: number): number => {
    const kids = nodes[nodeId].children;
    if (kids.length === 0) {
      const x = leafCursor;
      leafCursor += 1;
      xPos[nodeId] = x;
      return x;
    }
    const x =
      kids.map(assignX).reduce((sum, v) => sum + v, 0) / kids.length;
    xPos[nodeId] = x;
    return x;
  };

  assignX(rootId);

  const yMetric: Record<number, number> = { [rootId]: 0 };
  const chainStep = (normalStep * chainDepthSpan) / chainDepth;

  const assignY = (nodeId: number): void => {
    const base = yMetric[nodeId];
    for (const childId of nodes[nodeId].children) {
      const step = nodes[childId].rightmostChain ? chainStep : normalStep;
      yMetric[childId] = base + step;
      assignY(childId);
    }
  };

  assignY(rootId);

  const xs = Object.values(xPos);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const span = Math.max(1, maxX - minX);

  const out: Record<number, readonly [number, number, number]> = {};
  for (const [idStr, node] of Object.entries(nodes)) {
    const nodeId = Number(idStr);
    const xn = (((xPos[nodeId] - minX) / span) - 0.5) * totalWidth;
    const yn = topY - (yMetric[nodeId] ?? (node.depth * normalStep));
    out[nodeId] = [xn, yn, 0];
  }
  return out;
}

export function orientSolutionChainToRight(
  trace: TraceResult,
  positions: Record<number, readonly [number, number, number]>,
): Record<number, readonly [number, number, number]> {
  const root = trace.nodes[0];
  if (!root) {
    return positions;
  }

  const chainChild = root.children.find(
    (childId) => trace.nodes[childId]?.rightmostChain,
  );
  if (chainChild === undefined) {
    return positions;
  }

  if (positions[chainChild][0] >= 0) {
    return positions;
  }

  return Object.fromEntries(
    Object.entries(positions).map(([id, [x, y, z]]) => [id, [-x, y, z]]),
  );
}

export function pickOrderWithRightSolutionBranch(
  rows: number,
  cols: number,
  maskCells: readonly Coord[],
  basePieces: readonly PieceName[],
  attempts = 80,
): PieceName[] {
  class SeededRandom {
    private state = 1;

    next(): number {
      this.state = (1664525 * this.state + 1013904223) >>> 0;
      return this.state / 0x1_0000_0000;
    }

    shuffle<T>(arr: T[]): T[] {
      for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(this.next() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
  }

  const score = (order: PieceName[]): number => {
    const trace = buildTrace(
      {
        rows,
        cols,
        maskCells,
        selectedPieces: order,
      },
      true,
      {
        maxDisplayDepth: 3,
        maxDisplayChildren: 3,
        maxNodes: 1_500_000,
        rightmostBranchDepth: 9,
      },
    );

    const layout = computeLayout(trace.nodes);
    const root = trace.nodes[0];
    if (!root) {
      return -1e9;
    }

    const chainChild = root.children.find(
      (childId) => trace.nodes[childId]?.rightmostChain,
    );
    if (chainChild === undefined) {
      return -1e9;
    }
    return layout[chainChild][0];
  };

  const rng = new SeededRandom();
  let best = [...basePieces];
  let bestScore = score(best);
  const pool = [...basePieces];

  for (let i = 0; i < attempts; i += 1) {
    const candidate = rng.shuffle([...pool]);
    const value = score(candidate);
    if (value > bestScore) {
      best = candidate;
      bestScore = value;
    }
    if (value > 0) {
      return candidate;
    }
  }

  return best;
}

export { PIECE_NAMES };
