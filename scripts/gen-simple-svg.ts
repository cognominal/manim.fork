import { execSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

type FixtureMetaNode = {
  id: string;
  tag: string;
  label: string;
  parentId: string | null;
};

type FixtureMeta = {
  sceneId: string;
  width: number;
  height: number;
  viewBox: string;
  nodeCount: number;
  nodes: FixtureMetaNode[];
};

const REPO_ROOT = execSync("git rev-parse --show-toplevel", {
  encoding: "utf8"
}).trim();
const OUTPUT_DIR = resolve(REPO_ROOT, "svg/src/lib/fixtures");
const SVG_PATH = resolve(OUTPUT_DIR, "simple-scene.svg");
const META_PATH = resolve(OUTPUT_DIR, "simple-scene.meta.json");

const WIDTH = 640;
const HEIGHT = 360;
const VIEW_BOX = `0 0 ${WIDTH} ${HEIGHT}`;

const NODES: FixtureMetaNode[] = [
  {
    id: "scene-root",
    tag: "g",
    label: "g#scene-root",
    parentId: null
  },
  {
    id: "rect-1",
    tag: "rect",
    label: "rect#rect-1",
    parentId: "scene-root"
  },
  {
    id: "text-1",
    tag: "text",
    label: "text#text-1",
    parentId: "scene-root"
  }
];

function buildSvg(): string {
  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"${WIDTH}\"`,
    `  height=\"${HEIGHT}\" viewBox=\"${VIEW_BOX}\" role=\"img\"`,
    "  aria-labelledby=\"title\">",
    "  <title id=\"title\">Simple fixture scene</title>",
    "  <metadata>",
    "    {\"sceneId\":\"simple-scene\",\"origin\":\"gen-simple-svg\"}",
    "  </metadata>",
    "  <g id=\"scene-root\" data-node-id=\"scene-root\"",
    "    data-origin=\"simple-scene\">",
    "    <rect id=\"rect-1\" data-node-id=\"rect-1\" x=\"160\" y=\"110\"",
    "      width=\"320\" height=\"140\" rx=\"14\" fill=\"#f8fafc\"",
    "      stroke=\"#0f172a\" stroke-width=\"3\" />",
    "    <text id=\"text-1\" data-node-id=\"text-1\" x=\"320\" y=\"190\"",
    "      text-anchor=\"middle\" font-size=\"28\"",
    "      font-family=\"Iosevka Aile, IBM Plex Sans, sans-serif\"",
    "      fill=\"#0f172a\">Hello</text>",
    "  </g>",
    "</svg>",
    ""
  ].join("\n");
}

function buildMeta(): FixtureMeta {
  return {
    sceneId: "simple-scene",
    width: WIDTH,
    height: HEIGHT,
    viewBox: VIEW_BOX,
    nodeCount: NODES.length,
    nodes: NODES
  };
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const svg = buildSvg();
  const meta = JSON.stringify(buildMeta(), null, 2) + "\n";

  await writeFile(SVG_PATH, svg, "utf8");
  await writeFile(META_PATH, meta, "utf8");

  const relSvgPath = relative(process.cwd(), SVG_PATH);
  const relMetaPath = relative(process.cwd(), META_PATH);

  console.log(`Wrote ${relSvgPath}`);
  console.log(`Wrote ${relMetaPath}`);
}

void main();
