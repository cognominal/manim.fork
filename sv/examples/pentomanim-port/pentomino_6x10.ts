import {
  type Coord,
  type PieceName,
  PIECE_NAMES,
  ORIENTATIONS,
  coordKey,
  shiftCells,
} from "./pentomino-shared";

export type SearchEvent = {
  op: "place" | "remove";
  piece: PieceName;
  cells: readonly Coord[];
};

class SearchState {
  private readonly rows: number;
  private readonly cols: number;
  private readonly maxSteps: number;
  private readonly board = new Set<string>();
  private readonly used = new Set<PieceName>();
  readonly events: SearchEvent[] = [];

  constructor(rows = 6, cols = 10, maxSteps = 100) {
    this.rows = rows;
    this.cols = cols;
    this.maxSteps = maxSteps;
  }

  private record(event: SearchEvent): boolean {
    if (this.events.length >= this.maxSteps) {
      return true;
    }
    this.events.push(event);
    return this.events.length >= this.maxSteps;
  }

  private firstEmpty(): Coord | undefined {
    for (let r = 0; r < this.rows; r += 1) {
      for (let c = 0; c < this.cols; c += 1) {
        const rc: Coord = [r, c];
        if (!this.board.has(coordKey(rc))) {
          return rc;
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

  private applyPlace(name: PieceName, cells: readonly Coord[]): void {
    for (const cell of cells) {
      this.board.add(coordKey(cell));
    }
    this.used.add(name);
  }

  private applyRemove(name: PieceName, cells: readonly Coord[]): void {
    for (const cell of cells) {
      this.board.delete(coordKey(cell));
    }
    this.used.delete(name);
  }

  search(): boolean {
    if (this.events.length >= this.maxSteps) {
      return true;
    }

    const spot = this.firstEmpty();
    if (!spot) {
      return true;
    }

    const [anchorR, anchorC] = spot;

    for (const name of PIECE_NAMES) {
      if (this.used.has(name)) {
        continue;
      }

      for (const orient of ORIENTATIONS[name]) {
        for (const [cellR, cellC] of orient) {
          const dr = anchorR - cellR;
          const dc = anchorC - cellC;
          const shifted = shiftCells(orient, dr, dc);
          if (!this.canPlace(shifted)) {
            continue;
          }

          this.applyPlace(name, shifted);
          if (this.record({ op: "place", piece: name, cells: shifted })) {
            return true;
          }

          if (this.search()) {
            return true;
          }

          this.applyRemove(name, shifted);
          if (this.record({ op: "remove", piece: name, cells: shifted })) {
            return true;
          }
        }
      }
    }

    return false;
  }
}

export function runPentomino6x10(maxSteps = 100): SearchEvent[] {
  const state = new SearchState(6, 10, maxSteps);
  state.search();
  return state.events;
}

function main(): void {
  const events = runPentomino6x10(100);
  console.log(JSON.stringify({ maxSteps: 100, eventCount: events.length, events }));
}

if (import.meta.main) {
  main();
}
