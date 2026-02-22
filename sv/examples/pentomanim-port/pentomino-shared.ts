export type Coord = readonly [number, number];
export type PieceName =
  | "F"
  | "I"
  | "L"
  | "P"
  | "N"
  | "T"
  | "U"
  | "V"
  | "W"
  | "X"
  | "Y"
  | "Z";

export type Placement = readonly [PieceName, readonly Coord[]];

export const PENTOMINOES: Record<PieceName, readonly Coord[]> = {
  F: [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 0],
  ],
  I: [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
  ],
  L: [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [3, 1],
  ],
  P: [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
    [2, 0],
  ],
  N: [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
    [3, 1],
  ],
  T: [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 1],
    [2, 1],
  ],
  U: [
    [0, 0],
    [0, 2],
    [1, 0],
    [1, 1],
    [1, 2],
  ],
  V: [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
    [2, 2],
  ],
  W: [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
    [2, 2],
  ],
  X: [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 1],
  ],
  Y: [
    [0, 1],
    [1, 1],
    [2, 0],
    [2, 1],
    [3, 1],
  ],
  Z: [
    [0, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [2, 2],
  ],
};

export const PIECE_COLORS: Record<PieceName, string> = {
  F: "#c98592",
  I: "#c6a07a",
  L: "#ccb57f",
  P: "#78b39f",
  N: "#6ea8b0",
  T: "#638faa",
  U: "#7f88b7",
  V: "#8574af",
  W: "#9b7eb9",
  X: "#c07690",
  Y: "#c89a70",
  Z: "#7ab1a8",
};

export const PIECE_NAMES: readonly PieceName[] = [
  "F",
  "I",
  "L",
  "P",
  "N",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

export function coordKey([r, c]: Coord): string {
  return `${r},${c}`;
}

export function normalize(cells: readonly Coord[]): readonly Coord[] {
  const minR = Math.min(...cells.map(([r]) => r));
  const minC = Math.min(...cells.map(([, c]) => c));
  return cells
    .map(([r, c]) => [r - minR, c - minC] as const)
    .sort(([ar, ac], [br, bc]) => (ar - br) || (ac - bc));
}

export function transform(
  cells: readonly Coord[],
  turns: number,
  reflect: boolean,
): readonly Coord[] {
  const out: Coord[] = [];
  for (const [r, c] of cells) {
    let x = r;
    let y = c;
    if (reflect) {
      y = -y;
    }
    for (let i = 0; i < (turns % 4); i += 1) {
      const nx = y;
      y = -x;
      x = nx;
    }
    out.push([x, y]);
  }
  return normalize(out);
}

export function uniqueOrientations(
  cells: readonly Coord[],
): readonly (readonly Coord[])[] {
  const seen = new Set<string>();
  const variants: (readonly Coord[])[] = [];
  for (const reflect of [false, true] as const) {
    for (let turns = 0; turns < 4; turns += 1) {
      const variant = transform(cells, turns, reflect);
      const key = variant.map(coordKey).join("|");
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      variants.push(variant);
    }
  }
  return variants;
}

export const ORIENTATIONS: Record<PieceName, readonly (readonly Coord[])[]> =
  Object.fromEntries(
    PIECE_NAMES.map((name) => [name, uniqueOrientations(PENTOMINOES[name])]),
  ) as Record<PieceName, readonly (readonly Coord[])[]>;

export function shiftCells(
  cells: readonly Coord[],
  dr: number,
  dc: number,
): readonly Coord[] {
  return cells.map(([r, c]) => [r + dr, c + dc] as const);
}

export function placementSignature(placement: Placement): string {
  const [name, cells] = placement;
  const sorted = [...cells].sort(
    ([ar, ac], [br, bc]) => (ar - br) || (ac - bc),
  );
  return `${name}:${sorted.map(coordKey).join("|")}`;
}
