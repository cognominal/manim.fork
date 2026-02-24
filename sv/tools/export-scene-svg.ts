import { existsSync } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { MobjectSnapshot, Scene } from "../packages/core-ts/src/index";
import type { SvgExportSpec, SvgSceneFactory, SvgShapeHint } from "./svg-export-contract";

type SceneModule = {
  sceneFactory?: SvgSceneFactory;
  default?: SvgSceneFactory;
};

type CliOptions = {
  scenePath?: string;
  outDir?: string;
};

type FixtureMetaNode = {
  id: string;
  tag: string;
  label: string;
  parentId: string | null;
  manimClass: string;
  manimSource: string;
};

type FixtureMeta = {
  sceneId: string;
  width: number;
  height: number;
  viewBox: string;
  sourceScenePath: string;
  exportTimeUtc: string;
  nodeCount: number;
  nodes: FixtureMetaNode[];
};

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const DEFAULT_SCENE = path.resolve(
  REPO_ROOT,
  "sv/examples/svg-link/simple-scene.ts",
);
const DEFAULT_OUT_DIR = path.resolve(REPO_ROOT, "svg/src/lib/fixtures");

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === "--scene") {
      const next = argv[i + 1];
      if (next) {
        options.scenePath = next;
        i += 1;
      }
    } else if (token === "--out-dir") {
      const next = argv[i + 1];
      if (next) {
        options.outDir = next;
        i += 1;
      }
    }
  }

  return options;
}

function resolveUserPath(inputPath: string): string {
  if (path.isAbsolute(inputPath)) {
    return inputPath;
  }

  const fromCwd = path.resolve(process.cwd(), inputPath);
  if (existsSync(fromCwd)) {
    return fromCwd;
  }

  return path.resolve(REPO_ROOT, inputPath);
}

async function listSceneFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listSceneFiles(fullPath)));
    } else if (entry.isFile() && fullPath.endsWith(".ts")) {
      files.push(fullPath);
    }
  }

  files.sort((a, b) => a.localeCompare(b));
  return files;
}

async function pickSceneFile(defaultPath: string): Promise<string> {
  const scenesDir = path.resolve(REPO_ROOT, "sv/examples");
  const files = await listSceneFiles(scenesDir);
  const defaultIndex = Math.max(0, files.findIndex((f) => f === defaultPath));
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("Select scene .ts file (press Enter for default):");
  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const marker = i === defaultIndex ? " (default)" : "";
    const rel = path.relative(REPO_ROOT, file);
    console.log(`${i + 1}. ${rel}${marker}`);
  }

  const answer = await rl.question("Scene number or path: ");
  rl.close();

  const trimmed = answer.trim();
  if (!trimmed) {
    return defaultPath;
  }

  const asIndex = Number(trimmed);
  if (Number.isInteger(asIndex) && asIndex >= 1 && asIndex <= files.length) {
    const picked = files[asIndex - 1];
    if (!picked) {
      throw new Error("Could not resolve selected scene index");
    }
    return picked;
  }

  const customPath = path.isAbsolute(trimmed)
    ? trimmed
    : path.resolve(REPO_ROOT, trimmed);

  return customPath;
}

async function loadFactory(scenePath: string): Promise<SvgSceneFactory> {
  const href = pathToFileURL(scenePath).href;
  const mod = (await import(href)) as SceneModule;
  const factory = mod.sceneFactory ?? mod.default;

  if (!factory) {
    throw new Error(
      "Scene module must export `sceneFactory` or default factory",
    );
  }

  return factory;
}

function renderElement(
  snapshot: MobjectSnapshot,
  hint: SvgShapeHint,
  sourceScenePath: string,
): { svg: string; meta: FixtureMetaNode } {
  const x = snapshot.transform.position.x;
  const y = snapshot.transform.position.y;
  const id = snapshot.id;
  const stroke = snapshot.style.strokeColor ?? "none";
  const strokeWidth = snapshot.style.strokeWidth ?? 0;
  const fill = snapshot.style.fillColor ?? "none";
  const fillOpacity = snapshot.style.fillOpacity ?? 1;
  const opacity = snapshot.style.opacity ?? 1;
  const sourceRel = path.relative(REPO_ROOT, sourceScenePath);

  if (hint.kind === "rect") {
    const left = x - hint.width / 2;
    const top = y - hint.height / 2;

    return {
      svg: [
        `    <rect id=\"${id}\" data-node-id=\"${id}\"`,
        "      data-manim-class=\"Mobject\"",
        `      data-manim-source=\"${sourceRel}:${id}\"`,
        `      x=\"${left}\" y=\"${top}\"`,
        `      width=\"${hint.width}\" height=\"${hint.height}\"`,
        `      rx=\"${hint.rx ?? 0}\" fill=\"${fill}\"`,
        `      fill-opacity=\"${fillOpacity}\"`,
        `      stroke=\"${stroke}\" stroke-width=\"${strokeWidth}\"`,
        `      opacity=\"${opacity}\" />`,
      ].join("\n"),
      meta: {
        id,
        tag: "rect",
        label: `rect#${id}`,
        parentId: snapshot.parentId ?? null,
        manimClass: "Mobject",
        manimSource: `${sourceRel}:${id}`,
      },
    };
  }

  const fontSize = hint.fontSize ?? 24;
  const textAnchor = hint.textAnchor ?? "start";

  return {
    svg: [
      `    <text id=\"${id}\" data-node-id=\"${id}\"`,
      "      data-manim-class=\"Mobject\"",
      `      data-manim-source=\"${sourceRel}:${id}\" x=\"${x}\" y=\"${y}\"`,
      `      text-anchor=\"${textAnchor}\" font-size=\"${fontSize}\"`,
      "      font-family=\"Iosevka Aile, IBM Plex Sans, sans-serif\"",
      `      fill=\"${fill}\" fill-opacity=\"${fillOpacity}\"`,
      `      opacity=\"${opacity}\">${hint.text}</text>`,
    ].join("\n"),
    meta: {
      id,
      tag: "text",
      label: `text#${id}`,
      parentId: snapshot.parentId ?? null,
      manimClass: "Mobject",
      manimSource: `${sourceRel}:${id}`,
    },
  };
}

function renderSvg(
  scenePath: string,
  scene: Scene,
  spec: SvgExportSpec,
): { svg: string; meta: FixtureMeta } {
  const frame = scene.sample(spec.sampleTime ?? 0);
  const viewBox = `0 0 ${spec.width} ${spec.height}`;
  const nodes: FixtureMetaNode[] = [];
  const body: string[] = [];

  for (const snapshot of frame.mobjects) {
    const hint = spec.hints[snapshot.id];

    if (!hint || !snapshot.visible) {
      continue;
    }

    const rendered = renderElement(snapshot, hint, scenePath);
    body.push(rendered.svg);
    nodes.push(rendered.meta);
  }

  const rootId = spec.rootId ?? "scene-root";

  const svg = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"${spec.width}\"`,
    `  height=\"${spec.height}\" viewBox=\"${viewBox}\" role=\"img\"`,
    "  aria-labelledby=\"title\">",
    `  <title id=\"title\">${spec.title ?? spec.sceneId}</title>`,
    "  <metadata>",
    `    {\"sceneId\":\"${spec.sceneId}\",\"origin\":\"sv-export\"}`,
    "  </metadata>",
    `  <g id=\"${rootId}\" data-node-id=\"${rootId}\"`,
    `    data-origin=\"${spec.sceneId}\">`,
    ...body,
    "  </g>",
    "</svg>",
    "",
  ].join("\n");

  const meta: FixtureMeta = {
    sceneId: spec.sceneId,
    width: spec.width,
    height: spec.height,
    viewBox,
    sourceScenePath: path.relative(REPO_ROOT, scenePath),
    exportTimeUtc: new Date().toISOString(),
    nodeCount: nodes.length,
    nodes,
  };

  return { svg, meta };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const scenePath = args.scenePath
    ? resolveUserPath(args.scenePath)
    : await pickSceneFile(DEFAULT_SCENE);
  const outDir = args.outDir
    ? resolveUserPath(args.outDir)
    : DEFAULT_OUT_DIR;

  const factory = await loadFactory(scenePath);
  const scene = await factory.createScene();
  const { svg, meta } = renderSvg(scenePath, scene, factory.svgExport);
  await mkdir(outDir, { recursive: true });
  const svgPath = path.join(outDir, `${factory.svgExport.sceneId}.svg`);
  const metaPath = path.join(outDir, `${factory.svgExport.sceneId}.meta.json`);

  await writeFile(svgPath, svg, "utf8");
  await writeFile(metaPath, JSON.stringify(meta, null, 2) + "\n", "utf8");

  console.log(`Scene: ${path.relative(REPO_ROOT, scenePath)}`);
  console.log(`Wrote ${path.relative(REPO_ROOT, svgPath)}`);
  console.log(`Wrote ${path.relative(REPO_ROOT, metaPath)}`);
}

void main();
