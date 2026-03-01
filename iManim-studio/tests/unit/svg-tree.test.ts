import { describe, expect, test } from "bun:test";
import { DOMParser as XmldomParser } from "@xmldom/xmldom";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { flattenNodeIds, parseSvgTree } from "../../src/lib/model/svg-tree";

(globalThis as typeof globalThis & { DOMParser: typeof XmldomParser })
  .DOMParser = XmldomParser;

describe("parseSvgTree", () => {
  test("parses nested groups and keeps source order", () => {
    const fixturePath = resolve(
      process.cwd(),
      "src/lib/fixtures/simple-scene.svg"
    );
    const svgText = readFileSync(fixturePath, "utf8");
    const root = parseSvgTree(svgText);

    expect(root.tag).toBe("svg");
    expect(root.id).toBe("auto-svg-root");
    expect(root.children).toHaveLength(3);

    const [titleNode, metadataNode, sceneRootNode] = root.children;

    if (!titleNode || !metadataNode || !sceneRootNode) {
      throw new Error("Expected title, metadata, and scene root nodes");
    }

    expect(titleNode.tag).toBe("title");
    expect(metadataNode.tag).toBe("metadata");

    expect(sceneRootNode.tag).toBe("g");
    expect(sceneRootNode.id).toBe("scene-root");
    expect(sceneRootNode.children).toHaveLength(2);
    expect(sceneRootNode.children[0].id).toBe("rect-1");
    expect(sceneRootNode.children[1].id).toBe("text-1");
  });

  test("creates deterministic fallback IDs for elements without id", () => {
    const svgText = [
      "<svg xmlns=\"http://www.w3.org/2000/svg\">",
      "  <g>",
      "    <rect />",
      "    <text>Hello</text>",
      "  </g>",
      "</svg>"
    ].join("\n");

    const first = parseSvgTree(svgText);
    const second = parseSvgTree(svgText);

    const firstIds = flattenNodeIds(first);
    const secondIds = flattenNodeIds(second);

    expect(firstIds).toEqual(secondIds);
    expect(firstIds).toEqual([
      "auto-svg-root",
      "auto-g-0",
      "auto-rect-0-0",
      "auto-text-0-1"
    ]);
  });
});
