export type Coord = readonly [number, number];

export type PieceDef = {
  name: string;
  cells: readonly Coord[];
  colorHex: string;
};

export type RowDef = {
  name: string;
  piece: string;
  cells: readonly string[];
  orientCells: readonly Coord[];
};

export type DlxStep = {
  kind: "choose-column" | "choose-row" | "solution" | "backtrack";
  activeCols: readonly string[];
  activeRows: readonly string[];
  chosenRows: readonly string[];
  focusCol?: string;
  focusRow?: string;
  note: string;
};

export type DlxResult = {
  rows: number;
  cols: number;
  columns: readonly string[];
  rowDefs: readonly RowDef[];
  steps: readonly DlxStep[];
  solutions: readonly (readonly string[])[];
};

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

function rotate90(cells: readonly Coord[]): Coord[] {
  return cells.map(([r, c]) => [c, -r] as const);
}

function reflectH(cells: readonly Coord[]): Coord[] {
  return cells.map(([r, c]) => [r, -c] as const);
}

function keyCells(cells: readonly Coord[]): string {
  return cells.map(([r, c]) => `${r},${c}`).join(";");
}

function uniqueOrientations(cells: readonly Coord[]): Coord[][] {
  const out: Coord[][] = [];
  const seen = new Set<string>();
  let cur = [...cells];
  for (let i = 0; i < 4; i += 1) {
    for (const candidate of [cur, reflectH(cur)]) {
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
      const maxR = Math.max(...orient.map(([r]) => r));
      const maxC = Math.max(...orient.map(([, c]) => c));
      for (let dr = 0; dr <= boardRows - maxR - 1; dr += 1) {
        for (let dc = 0; dc <= boardCols - maxC - 1; dc += 1) {
          const placed = orient.map(([r, c]) => [r + dr, c + dc] as const);
          const cells = placed.map(([r, c]) => `c${r}${c}`);
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

function rowMembership(row: RowDef): Set<string> {
  return new Set([row.piece, ...row.cells]);
}

function chooseColumn(
  activeCols: ReadonlySet<string>,
  activeRows: readonly RowDef[],
): string | undefined {
  let bestCol: string | undefined;
  let bestSize = Number.POSITIVE_INFINITY;
  for (const col of activeCols) {
    let size = 0;
    for (const row of activeRows) {
      if (rowMembership(row).has(col)) {
        size += 1;
      }
    }
    if (size < bestSize) {
      bestSize = size;
      bestCol = col;
    }
  }
  return bestCol;
}

function sorted(values: ReadonlySet<string>): string[] {
  return [...values].sort();
}

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

export function solveExactCover(opts: {
  boardRows: number;
  boardCols: number;
  pieces: Readonly<Record<string, PieceDef>>;
  solutionLimit?: number;
}): DlxResult {
  const cellCols: string[] = [];
  for (let r = 0; r < opts.boardRows; r += 1) {
    for (let c = 0; c < opts.boardCols; c += 1) {
      cellCols.push(`c${r}${c}`);
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

    const col = chooseColumn(
      activeCols,
      [...activeRows].map((name) => byName.get(name) as RowDef),
    );
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

    const candidates = [...activeRows]
      .map((name) => byName.get(name) as RowDef)
      .filter((row) => (membership.get(row.name) as Set<string>).has(col));

    for (const row of candidates) {
      const rowSet = membership.get(row.name) as Set<string>;
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
        const set = membership.get(name) as Set<string>;
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

export function rowsByName(rows: readonly RowDef[]): Map<string, RowDef> {
  return new Map(rows.map((row) => [row.name, row] as const));
}
