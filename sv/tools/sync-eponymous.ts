#!/usr/bin/env bun
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { globSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

type Quality = "low" | "medium" | "high" | "production";

const SYNC_START = "<!-- AUTO-SYNC:START -->";
const SYNC_END = "<!-- AUTO-SYNC:END -->";
const SCENE_BASES = ["Scene", "MovingCameraScene"] as const;
const QUALITY_FLAGS: Record<Quality, string> = {
  low: "-ql",
  medium: "-qm",
  high: "-qh",
  production: "-qp",
};

type CliArgs = {
  dir: string;
  quality: Quality;
  files: string[];
  skipNonScene: boolean;
  skipRender: boolean;
  dryRun: boolean;
};

function nowUtc(): string {
  const iso = new Date().toISOString();
  return iso.replace(/\.\d{3}Z$/, "Z");
}

function sha256File(path: string): string {
  const hash = createHash("sha256");
  hash.update(readFileSync(path));
  return hash.digest("hex");
}

function firstSceneName(pyPath: string): string | undefined {
  const text = readFileSync(pyPath, "utf8");
  const classRegex = /^class\s+(\w+)\(([^)]*)\):/gm;
  for (const match of text.matchAll(classRegex)) {
    const className = match[1];
    const bases = match[2].split(",").map((part) => part.trim());
    if (
      bases.some((base) =>
        SCENE_BASES.some(
          (sceneBase) => base === sceneBase || base.endsWith(`.${sceneBase}`),
        ),
      )
    ) {
      return className;
    }
  }
  return undefined;
}

function readMdSourceHash(mdText: string): string | undefined {
  if (!mdText.includes(SYNC_START) || !mdText.includes(SYNC_END)) {
    return undefined;
  }
  const match = mdText.match(/^source_sha256:\s*([a-f0-9]{64})$/m);
  return match?.[1];
}

function buildSyncBlock(
  pyPath: string,
  sceneName: string | undefined,
  quality: Quality,
): string {
  let cmd = `manim ${QUALITY_FLAGS[quality]} ${basename(pyPath)}`;
  if (sceneName) {
    cmd += ` ${sceneName}`;
  }
  const mtimeUtc = new Date(statSync(pyPath).mtimeMs)
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z");

  return [
    SYNC_START,
    `source_file: ${basename(pyPath)}`,
    `source_sha256: ${sha256File(pyPath)}`,
    `source_mtime_utc: ${mtimeUtc}`,
    `synced_at_utc: ${nowUtc()}`,
    `scene: ${sceneName ?? "N/A"}`,
    `render_cmd: ${cmd}`,
    SYNC_END,
    "",
  ].join("\n");
}

function syncMarkdown(
  mdPath: string,
  pyPath: string,
  sceneName: string | undefined,
  quality: Quality,
  dryRun: boolean,
): boolean {
  const newBlock = buildSyncBlock(pyPath, sceneName, quality);
  if (existsSync(mdPath)) {
    const current = readFileSync(mdPath, "utf8");
    let updated = current;
    if (current.includes(SYNC_START) && current.includes(SYNC_END)) {
      const escapedStart = SYNC_START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const escapedEnd = SYNC_END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const blockRegex = new RegExp(
        `${escapedStart}[\\s\\S]*?${escapedEnd}\\n?`,
        "m",
      );
      updated = current.replace(blockRegex, newBlock);
    } else {
      const sep = current.endsWith("\n") ? "" : "\n";
      updated = `${current}${sep}\n${newBlock}`;
    }

    const changed = updated !== current;
    if (changed && !dryRun) {
      writeFileSync(mdPath, updated, "utf8");
    }
    return changed;
  }

  const title = `# Spec: \`${basename(pyPath)}\``;
  const sceneLine = sceneName ? `- \`${sceneName}\`` : "- `TBD`";
  const body = [
    title,
    "",
    "## Purpose",
    "",
    "Describe this scene's intent.",
    "",
    "## Main Scene",
    "",
    sceneLine,
    "",
  ].join("\n");

  if (!dryRun) {
    writeFileSync(mdPath, `${body}${newBlock}`, "utf8");
  }
  return true;
}

function shouldRender(pyPath: string, mp4Path: string, mdPath: string): boolean {
  if (!existsSync(mp4Path) || !existsSync(mdPath)) {
    return true;
  }
  const pyMtime = statSync(pyPath).mtimeMs;
  return statSync(mp4Path).mtimeMs < pyMtime || statSync(mdPath).mtimeMs < pyMtime;
}

function runManim(
  pyPath: string,
  sceneName: string,
  quality: Quality,
  dryRun: boolean,
): void {
  if (dryRun) {
    return;
  }
  const result = spawnSync(
    "manim",
    [QUALITY_FLAGS[quality], pyPath, sceneName, "-o", basename(pyPath, ".py")],
    {
      cwd: dirname(pyPath),
      stdio: "inherit",
    },
  );
  if (result.status !== 0) {
    throw new Error(`manim render failed for ${basename(pyPath)}`);
  }
}

function copyNewestRender(stem: string, mediaDirs: string[], target: string): void {
  const candidates: string[] = [];
  for (const mediaDir of mediaDirs) {
    if (!existsSync(mediaDir)) {
      continue;
    }
    const pattern = resolve(mediaDir, `videos/**/${stem}.mp4`);
    candidates.push(...globSync(pattern));
  }

  if (candidates.length === 0) {
    throw new Error(`No rendered mp4 found for stem '${stem}'`);
  }

  candidates.sort((a, b) => statSync(a).mtimeMs - statSync(b).mtimeMs);
  copyFileSync(candidates[candidates.length - 1], target);
}

function processFile(path: string, args: CliArgs): {
  mdChanged: boolean;
  rendered: boolean;
  skipped: boolean;
} {
  const stem = basename(path, ".py");
  const mdPath = resolve(dirname(path), `${stem}.md`);
  const mp4Path = resolve(dirname(path), `${stem}.mp4`);
  const sceneName = firstSceneName(path);

  if (!sceneName && args.skipNonScene) {
    return { mdChanged: false, rendered: false, skipped: true };
  }

  const pyHash = sha256File(path);
  let mdChanged = false;
  if (!existsSync(mdPath)) {
    mdChanged = syncMarkdown(mdPath, path, sceneName, args.quality, args.dryRun);
  } else {
    const mdText = readFileSync(mdPath, "utf8");
    const mdHash = readMdSourceHash(mdText);
    if (mdHash !== pyHash) {
      mdChanged = syncMarkdown(
        mdPath,
        path,
        sceneName,
        args.quality,
        args.dryRun,
      );
    }
  }

  let rendered = false;
  if (!args.skipRender && shouldRender(path, mp4Path, mdPath)) {
    if (!sceneName) {
      throw new Error(`No Scene subclass found in ${basename(path)}`);
    }
    runManim(path, sceneName, args.quality, args.dryRun);
    if (!args.dryRun) {
      copyNewestRender(stem, [resolve(dirname(path), "media")], mp4Path);
    }
    rendered = true;
  }

  return { mdChanged, rendered, skipped: false };
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    dir: dirname(import.meta.path),
    quality: "high",
    files: [],
    skipNonScene: true,
    skipRender: false,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--dir") {
      args.dir = resolve(argv[++i]);
    } else if (token === "--quality") {
      const quality = argv[++i] as Quality;
      if (!(quality in QUALITY_FLAGS)) {
        throw new Error(`Unsupported quality: ${quality}`);
      }
      args.quality = quality;
    } else if (token === "--file") {
      args.files.push(argv[++i]);
    } else if (token === "--skip-non-scene") {
      args.skipNonScene = true;
    } else if (token === "--no-skip-non-scene") {
      args.skipNonScene = false;
    } else if (token === "--skip-render") {
      args.skipRender = true;
    } else if (token === "--dry-run") {
      args.dryRun = true;
    } else {
      throw new Error(`Unknown arg: ${token}`);
    }
  }

  return args;
}

function main(argv: string[]): number {
  const args = parseArgs(argv);
  const files = args.files.length > 0
    ? args.files.map((name) => resolve(args.dir, name))
    : globSync(resolve(args.dir, "*.py"));

  const scriptName = basename(import.meta.path);
  const filtered = files
    .filter((path) => path.endsWith(".py"))
    .filter((path) => basename(path) !== scriptName);

  if (filtered.length === 0) {
    console.log("No python files to process.");
    return 0;
  }

  let mdUpdates = 0;
  let mp4Updates = 0;
  let skippedNonScene = 0;

  for (const file of filtered) {
    const { mdChanged, rendered, skipped } = processFile(file, args);
    skippedNonScene += Number(skipped);
    mdUpdates += Number(mdChanged);
    mp4Updates += Number(rendered);

    const status: string[] = [];
    if (skipped) {
      status.push("skipped(non-scene)");
    }
    if (mdChanged) {
      status.push("md-updated");
    }
    if (rendered) {
      status.push("mp4-updated");
    }
    if (status.length === 0) {
      status.push("up-to-date");
    }
    console.log(`${basename(file)}: ${status.join(", ")}`);
  }

  console.log(
    `Done. markdown=${mdUpdates}, mp4=${mp4Updates}, `
      + `skipped_non_scene=${skippedNonScene}`,
  );
  return 0;
}

if (import.meta.main) {
  process.exit(main(process.argv.slice(2)));
}
