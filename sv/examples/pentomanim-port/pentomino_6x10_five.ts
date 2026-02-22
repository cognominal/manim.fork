import {
  type Coord,
  type PieceName,
  type Placement,
  PIECE_NAMES,
  ORIENTATIONS,
  coordKey,
  shiftCells,
  placementSignature,
} from "./pentomino-shared";

class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

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

class DfsSolver {
  private readonly rows: number;
  private readonly cols: number;
  private readonly board = new Set<string>();
  private readonly used = new Set<PieceName>();
  private readonly rng: SeededRandom;

  constructor(rows = 6, cols = 10, seed = 1) {
    this.rows = rows;
    this.cols = cols;
    this.rng = new SeededRandom(seed);
  }

  private firstEmpty(): Coord | undefined {
    for (let r = 0; r < this.rows; r += 1) {
      for (let c = 0; c < this.cols; c += 1) {
        const key = coordKey([r, c]);
        if (!this.board.has(key)) {
          return [r, c];
        }
      }
    }
    return undefined;
  }

  private canPlace(cells: readonly Coord[]): boolean {
    for (const [r, c] of cells) {
      if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) {
        return false;
      }
      if (this.board.has(coordKey([r, c]))) {
        return false;
      }
    }
    return true;
  }

  private apply(name: PieceName, cells: readonly Coord[]): void {
    this.used.add(name);
    for (const cell of cells) {
      this.board.add(coordKey(cell));
    }
  }

  private unapply(name: PieceName, cells: readonly Coord[]): void {
    this.used.delete(name);
    for (const cell of cells) {
      this.board.delete(coordKey(cell));
    }
  }

  solve(): Placement[] | undefined {
    const empty = this.firstEmpty();
    if (!empty) {
      return [];
    }

    const [anchorR, anchorC] = empty;
    const names = this.rng.shuffle(
      PIECE_NAMES.filter((name) => !this.used.has(name)).slice(),
    );

    for (const name of names) {
      const orientations = this.rng.shuffle(ORIENTATIONS[name].slice());
      for (const orient of orientations) {
        const anchors = this.rng.shuffle(orient.slice());
        for (const [cellR, cellC] of anchors) {
          const shifted = shiftCells(orient, anchorR - cellR, anchorC - cellC);
          if (!this.canPlace(shifted)) {
            continue;
          }

          this.apply(name, shifted);
          const rest = this.solve();
          if (rest) {
            return [[name, shifted], ...rest];
          }
          this.unapply(name, shifted);
        }
      }
    }

    return undefined;
  }
}

function solutionSignature(solution: readonly Placement[]): string {
  return solution
    .map((placement) => placementSignature(placement))
    .sort()
    .join("||");
}

export function findUniqueSolutions(
  count: number,
  maxAttempts: number,
): Placement[][] {
  const unique = new Map<string, Placement[]>();

  for (let i = 0; i < maxAttempts; i += 1) {
    const solver = new DfsSolver(6, 10, i + 1);
    const solution = solver.solve();
    if (!solution) {
      continue;
    }
    const signature = solutionSignature(solution);
    if (!unique.has(signature)) {
      unique.set(signature, solution);
    }
    if (unique.size >= count) {
      break;
    }
  }

  return [...unique.values()];
}

function main(): void {
  const solveCount = 5;
  const solutions = findUniqueSolutions(solveCount, 300);
  console.log(
    JSON.stringify({
      requested: solveCount,
      found: solutions.length,
      solutions,
    }),
  );
}

if (import.meta.main) {
  main();
}
