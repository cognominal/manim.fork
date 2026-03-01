export type Coord = readonly [number, number];

// Defines a puzzle piece shape and rendering metadata.
export type PieceDef = {
  name: string;
  cells: readonly Coord[];
  colorHex: string;
};

// Represents one exact-cover row for a concrete piece placement.
export type RowDef = {
  name: string;
  piece: string;
  cells: readonly string[];
  orientCells: readonly Coord[];
};

// Captures one trace step of the DLX-style search process.
export type DlxStep = {
  kind: "choose-column" | "choose-row" | "solution" | "backtrack";
  activeCols: readonly string[];
  activeRows: readonly string[];
  chosenRows: readonly string[];
  focusCol?: string;
  focusRow?: string;
  note: string;
};

// Collects matrix metadata, generated rows, trace, and solutions.
export type DlxResult = {
  rows: number;
  cols: number;
  columns: readonly string[];
  rowDefs: readonly RowDef[];
  steps: readonly DlxStep[];
  solutions: readonly (readonly string[])[];
};

// Describes solver inputs for an exact-cover board instance.
export type SolveExactCoverOpts = {
  boardRows: number;
  boardCols: number;
  pieces: Readonly<Record<string, PieceDef>>;
  solutionLimit?: number;
};

// Builds an unambiguous column id for one board cell.
function cellId(r: number, c: number): string {
  return `c${r}_${c}`;
}

// Translates and sorts cells so the shape starts at origin deterministically.
function normalizeCells(cells: readonly Coord[]): Coord[] {
  let minR = Number.POSITIVE_INFINITY;
  let minC = Number.POSITIVE_INFINITY;
  for (const [r, c] of cells) {
    minR = Math.min(minR, r);
    minC = Math.min(minC, c);
  }
  return cells
    .map(([r, c]) => [r - minR, c - minC] as const)
    .sort(([ar, ac], [br, bc]) => (ar - br) || (ac - bc));
}

// Rotates a shape 90 degrees around the origin.
function rotate90(cells: readonly Coord[]): Coord[] {
  return cells.map(([r, c]) => [c, -r] as const);
}

// Reflects a shape horizontally around the origin axis.
function reflectH(cells: readonly Coord[]): Coord[] {
  return cells.map(([r, c]) => [r, -c] as const);
}

// Serializes normalized coordinates for deduplication keys.
function keyCells(cells: readonly Coord[]): string {
  return cells.map(([r, c]) => `${r},${c}`).join(";");
}

// Enumerates all unique rotations/reflections of a piece.
function uniqueOrientations(cells: readonly Coord[]): Coord[][] {
  const out: Coord[][] = [];
  const seen = new Set<string>();
  let cur = [...cells];

  for (let i = 0; i < 4; i += 1) {
    const reflected = reflectH(cur);
    for (const candidate of [cur, reflected]) {
      const norm = normalizeCells(candidate);
      const key = keyCells(norm);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(norm);
      }
    }
    cur = rotate90(cur);
  }

  return out;
}

// Returns the max row and column occupied by an orientation.
function orientationBounds(orient: readonly Coord[]): Coord {
  let maxR = Number.NEGATIVE_INFINITY;
  let maxC = Number.NEGATIVE_INFINITY;
  for (const [r, c] of orient) {
    if (r > maxR) maxR = r;
    if (c > maxC) maxC = c;
  }
  return [maxR, maxC] as const;
}

// Builds exact-cover rows for every legal piece placement on the board.
export function buildRows(
  boardRows: number,
  boardCols: number,
  pieces: Readonly<Record<string, PieceDef>>,
): RowDef[] {
  const out: RowDef[] = [];

  for (const piece of Object.values(pieces)) {
    const orients = uniqueOrientations(piece.cells);
    let idx = 0;

    for (const orient of orients) {
      const [maxR, maxC] = orientationBounds(orient);
      const maxDr = boardRows - maxR - 1;
      const maxDc = boardCols - maxC - 1;

      for (let dr = 0; dr <= maxDr; dr += 1) {
        for (let dc = 0; dc <= maxDc; dc += 1) {
          const placed = orient.map(([r, c]) => [r + dr, c + dc] as const);
          const cells = placed.map(([r, c]) => cellId(r, c));
          out.push({
            name: `${piece.name}_${idx}`,
            piece: piece.name,
            cells,
            orientCells: placed,
          });
          idx += 1;
        }
      }
    }
  }

  return out;
}

// Produces the column membership set for one exact-cover row.
function rowMembership(row: RowDef): Set<string> {
  return new Set([row.piece, ...row.cells]);
}

// Chooses the active column with the fewest active covering rows.
function chooseColumn(
  activeCols: ReadonlySet<string>,
  activeRows: ReadonlySet<string>,
  membership: ReadonlyMap<string, ReadonlySet<string>>,
): string | undefined {
  let bestCol: string | undefined;
  let bestSize = Number.POSITIVE_INFINITY;

  for (const col of activeCols) {
    let size = 0;
    for (const rowName of activeRows) {
      if ((membership.get(rowName) as ReadonlySet<string>).has(col)) {
        size += 1;
      }
    }

    if (size < bestSize) {
      bestSize = size;
      bestCol = col;
      if (size === 0) {
        break;
      }
    }
  }

  return bestCol;
}

// Converts a set into a lexicographically sorted array snapshot.
function sorted(values: ReadonlySet<string>): string[] {
  return [...values].sort();
}

// Appends a trace step using stable sorted snapshots of active sets.
function appendStep(
  steps: DlxStep[],
  step: Omit<DlxStep, "activeCols" | "activeRows"> & {
    activeCols: ReadonlySet<string>;
    activeRows: ReadonlySet<string>;
  },
): void {
  steps.push({
    ...step,
    activeCols: sorted(step.activeCols),
    activeRows: sorted(step.activeRows),
  });
}

// Solves the exact-cover matrix with backtracking and optional tracing.
export function solveExactCover(opts: SolveExactCoverOpts): DlxResult {
  const cellCols: string[] = [];
  for (let r = 0; r < opts.boardRows; r += 1) {
    for (let c = 0; c < opts.boardCols; c += 1) {
      cellCols.push(cellId(r, c));
    }
  }

  const columns = [...Object.keys(opts.pieces), ...cellCols];
  const rowDefs = buildRows(opts.boardRows, opts.boardCols, opts.pieces);
  const byName = new Map(rowDefs.map((row) => [row.name, row] as const));
  const membership = new Map(
    rowDefs.map((row) => [row.name, rowMembership(row)] as const),
  );

  const activeCols = new Set(columns);
  const activeRows = new Set(rowDefs.map((row) => row.name));
  const chosenRows: string[] = [];
  const steps: DlxStep[] = [];
  const solutions: string[][] = [];
  const solutionLimit = opts.solutionLimit ?? Number.POSITIVE_INFINITY;

  const search = (): boolean => {
    if (activeCols.size === 0) {
      solutions.push([...chosenRows]);
      appendStep(steps, {
        kind: "solution",
        activeCols,
        activeRows,
        chosenRows: [...chosenRows],
        note: `Solution ${solutions.length}`,
      });
      return solutions.length >= solutionLimit;
    }

    const col = chooseColumn(activeCols, activeRows, membership);
    if (!col) {
      return false;
    }

    appendStep(steps, {
      kind: "choose-column",
      activeCols,
      activeRows,
      chosenRows: [...chosenRows],
      focusCol: col,
      note: `Choose column ${col}`,
    });

    const candidates: RowDef[] = [];
    for (const name of activeRows) {
      const rowSet = membership.get(name) as ReadonlySet<string>;
      if (rowSet.has(col)) {
        candidates.push(byName.get(name) as RowDef);
      }
    }

    for (const row of candidates) {
      const rowSet = membership.get(row.name) as ReadonlySet<string>;

      appendStep(steps, {
        kind: "choose-row",
        activeCols,
        activeRows,
        chosenRows: [...chosenRows],
        focusCol: col,
        focusRow: row.name,
        note: `Pick row ${row.name}`,
      });

      const removedCols: string[] = [];
      const removedRows: string[] = [];

      for (const column of rowSet) {
        if (activeCols.delete(column)) {
          removedCols.push(column);
        }
      }

      for (const name of [...activeRows]) {
        const set = membership.get(name) as ReadonlySet<string>;
        for (const column of rowSet) {
          if (set.has(column)) {
            activeRows.delete(name);
            removedRows.push(name);
            break;
          }
        }
      }

      chosenRows.push(row.name);
      const stop = search();
      chosenRows.pop();

      for (const name of removedRows) {
        activeRows.add(name);
      }
      for (const column of removedCols) {
        activeCols.add(column);
      }

      appendStep(steps, {
        kind: "backtrack",
        activeCols,
        activeRows,
        chosenRows: [...chosenRows],
        focusRow: row.name,
        note: `Backtrack from ${row.name}`,
      });

      if (stop) {
        return true;
      }
    }

    return false;
  };

  search();

  return {
    rows: opts.boardRows,
    cols: opts.boardCols,
    columns,
    rowDefs,
    steps,
    solutions,
  };
}

// Indexes row definitions by row name for quick lookup.
export function rowsByName(rows: readonly RowDef[]): Map<string, RowDef> {
  return new Map(rows.map((row) => [row.name, row] as const));
}
