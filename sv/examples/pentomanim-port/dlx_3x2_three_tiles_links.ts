import { rowsByName } from "./dlx-3x2-shared";
import { runDlx3x2ThreeTiles } from "./dlx_3x2_three_tiles";

export type LinkEdge = {
  kind: "col-row" | "row-col";
  from: string;
  to: string;
};

export type LinksFrame = {
  stepIndex: number;
  note: string;
  edges: readonly LinkEdge[];
};

export type DlxLinksResult = {
  base: ReturnType<typeof runDlx3x2ThreeTiles>;
  linkFrames: readonly LinksFrame[];
};

function buildLinksFrame(
  rowLookup: ReadonlyMap<string, { piece: string; cells: readonly string[] }>,
  activeCols: ReadonlySet<string>,
  activeRows: readonly string[],
): LinkEdge[] {
  const out: LinkEdge[] = [];
  for (const rowName of activeRows) {
    const row = rowLookup.get(rowName);
    if (!row) {
      continue;
    }
    const members = [row.piece, ...row.cells].filter((col) => activeCols.has(col));
    for (const col of members) {
      out.push({ kind: "col-row", from: col, to: rowName });
      out.push({ kind: "row-col", from: rowName, to: col });
    }
  }
  return out;
}

export function runDlx3x2ThreeTilesLinks(limit = 10): DlxLinksResult {
  const base = runDlx3x2ThreeTiles(limit);
  const rowLookup = rowsByName(base.rowDefs);
  const linkFrames = base.steps.map((step, idx) => ({
    stepIndex: idx,
    note: step.note,
    edges: buildLinksFrame(
      rowLookup,
      new Set(step.activeCols),
      step.activeRows,
    ),
  }));
  return { base, linkFrames };
}

function main(): void {
  console.log(JSON.stringify(runDlx3x2ThreeTilesLinks(10)));
}

if (import.meta.main) {
  main();
}
