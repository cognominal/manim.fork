import { describe, expect, test } from "bun:test";
import {
  DOMParser as XmldomParser,
  XMLSerializer as XmldomSerializer
} from "@xmldom/xmldom";
import { buildTreeRows, parseSvgTree } from "../../src/lib/model/svg-tree";
import {
  isNodeHiddenInSvg,
  setNodeHiddenInSvg
} from "../../src/lib/model/visibility";

(globalThis as typeof globalThis & { DOMParser: typeof XmldomParser })
  .DOMParser = XmldomParser;
(globalThis as typeof globalThis & { XMLSerializer: typeof XmldomSerializer })
  .XMLSerializer = XmldomSerializer;

describe("visibility", () => {
  const sourceSvg = [
    "<svg xmlns=\"http://www.w3.org/2000/svg\">",
    "  <g id=\"scene-root\" data-node-id=\"scene-root\">",
    "    <rect id=\"rect-1\" data-node-id=\"rect-1\" />",
    "    <text id=\"text-1\" data-node-id=\"text-1\">Hi</text>",
    "  </g>",
    "</svg>"
  ].join("\n");

  test("setNodeHiddenInSvg hides and unhides an explicit node", () => {
    const hiddenSvg = setNodeHiddenInSvg(sourceSvg, "rect-1", true);

    expect(isNodeHiddenInSvg(hiddenSvg, "rect-1")).toBe(true);

    const shownSvg = setNodeHiddenInSvg(hiddenSvg, "rect-1", false);

    expect(isNodeHiddenInSvg(shownSvg, "rect-1")).toBe(false);
  });

  test("parent hide keeps child explicit visibility but makes it effective", () => {
    const parentHiddenSvg = setNodeHiddenInSvg(sourceSvg, "scene-root", true);
    const tree = parseSvgTree(parentHiddenSvg);
    const rows = buildTreeRows(tree);

    const parentRow = rows.find((row) => {
      return row.id === "scene-root";
    });
    const childRow = rows.find((row) => {
      return row.id === "rect-1";
    });

    if (!parentRow || !childRow) {
      throw new Error("Expected parent and child rows to exist");
    }

    expect(parentRow.explicitHidden).toBe(true);
    expect(parentRow.effectiveHidden).toBe(true);
    expect(childRow.explicitHidden).toBe(false);
    expect(childRow.effectiveHidden).toBe(true);
  });
});
