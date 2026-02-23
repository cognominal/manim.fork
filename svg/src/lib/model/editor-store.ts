import type { Readable, Writable } from "svelte/store";
import { derived, get, writable } from "svelte/store";
import {
  buildTreeRows,
  parseSvgTree,
  type SvgTreeNode,
  type SvgTreeRow
} from "./svg-tree";
import { setNodeHiddenInSvg } from "./visibility";

export type EditorStore = {
  svgMarkup: Writable<string>;
  selectedId: Writable<string | null>;
  treeRoot: Readable<SvgTreeNode | null>;
  treeRows: Readable<SvgTreeRow[]>;
  setHidden: (id: string, hidden: boolean) => void;
  toggleHidden: (id: string) => void;
};

export function createEditorStore(initialSvg: string): EditorStore {
  const svgMarkup = writable(initialSvg);
  const selectedId = writable<string | null>(null);

  const treeRoot = derived(svgMarkup, ($svgMarkup) => {
    try {
      return parseSvgTree($svgMarkup);
    } catch {
      return null;
    }
  });

  const treeRows = derived(treeRoot, ($treeRoot) => {
    if (!$treeRoot) {
      return [];
    }

    return buildTreeRows($treeRoot);
  });

  treeRows.subscribe((rows) => {
    selectedId.update((current) => {
      if (!current) {
        return null;
      }

      const stillValid = rows.some((row) => {
        return row.id === current && row.selectable;
      });

      return stillValid ? current : null;
    });
  });

  function setHidden(id: string, hidden: boolean) {
    svgMarkup.update((current) => {
      return setNodeHiddenInSvg(current, id, hidden);
    });
  }

  function toggleHidden(id: string) {
    const rows = get(treeRows);
    const row = rows.find((candidate) => {
      return candidate.id === id;
    });

    if (!row) {
      return;
    }

    setHidden(id, !row.explicitHidden);
  }

  return {
    svgMarkup,
    selectedId,
    treeRoot,
    treeRows,
    setHidden,
    toggleHidden
  };
}
