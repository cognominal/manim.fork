#!/usr/bin/env bun
import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { globSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

type CliArgs = {
  dir: string;
  files: string[];
  skipNonScene: boolean;
  skipRender: boolean;
  dryRun: boolean;
};

const SYNC_START = "<!-- AUTO-SYNC:START -->";
const SYNC_END = "<!-- AUTO-SYNC:END -->";
const TOOLS_DIR = dirname(import.meta.path);
const SV_ROOT = resolve(TOOLS_DIR, "..");
const DEFAULT_SCENE_DIR = resolve(SV_ROOT, "examples/pentomanim-port");

function nowUtc(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function sha256File(path: string): string {
  const hash = createHash("sha256");
  hash.update(readFileSync(path));
  return hash.digest("hex");
}

function isSceneTsFile(path: string): boolean {
  const name = basename(path);
  if (!name.endsWith(".ts")) {
    return false;
  }
  if (name.startsWith("generate-")) {
    return false;
  }
  if (name.includes("shared")) {
    return false;
  }
  return true;
}

function generatorPath(scenePath: string): string {
  const dir = dirname(scenePath);
  const stem = basename(scenePath, ".ts");
  return resolve(dir, `generate-${stem}-mp4.ts`);
}

function sceneNameFromTs(path: string): string {
  return basename(path, ".ts");
}

function readMdSourceHash(mdText: string): string | undefined {
  if (!mdText.includes(SYNC_START) || !mdText.includes(SYNC_END)) {
    return undefined;
  }
  const match = mdText.match(/^source_sha256:\s*([a-f0-9]{64})$/m);
  return match?.[1];
}

function buildSyncBlock(scenePath: string, renderCmd: string): string {
  const mtimeUtc = new Date(statSync(scenePath).mtimeMs)
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z");

  return [
    SYNC_START,
    `source_file: ${basename(scenePath)}`,
    `source_sha256: ${sha256File(scenePath)}`,
    `source_mtime_utc: ${mtimeUtc}`,
    `synced_at_utc: ${nowUtc()}`,
    `scene: ${sceneNameFromTs(scenePath)}`,
    `render_cmd: ${renderCmd}`,
    SYNC_END,
    "",
  ].join("\n");
}

function syncMarkdown(
  mdPath: string,
  scenePath: string,
  renderCmd: string,
  dryRun: boolean,
): boolean {
  const newBlock = buildSyncBlock(scenePath, renderCmd);

  if (existsSync(mdPath)) {
    const current = readFileSync(mdPath, "utf8");
    let updated = current;

    if (current.includes(SYNC_START) && current.includes(SYNC_END)) {
      const escStart = SYNC_START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const escEnd = SYNC_END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`${escStart}[\\s\\S]*?${escEnd}\\n?`, "m");
      updated = current.replace(pattern, newBlock);
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

  const body = [
    `# Spec: \`${basename(scenePath)}\``,
    "",
    "## Purpose",
    "",
    "Describe this scene's intent.",
    "",
    "## Main Scene",
    "",
    `- \`${sceneNameFromTs(scenePath)}\``,
    "",
  ].join("\n");

  if (!dryRun) {
    writeFileSync(mdPath, `${body}${newBlock}`, "utf8");
  }
  return true;
}

function shouldRender(
  scenePath: string,
  mp4Path: string,
  mdPath: string,
): boolean {
  if (!existsSync(mp4Path) || !existsSync(mdPath)) {
    return true;
  }
  const srcMtime = statSync(scenePath).mtimeMs;
  return statSync(mp4Path).mtimeMs < srcMtime
    || statSync(mdPath).mtimeMs < srcMtime;
}

function runGenerator(
  svRoot: string,
  generator: string,
  dryRun: boolean,
): void {
  if (dryRun) {
    return;
  }
  const rel = generator.startsWith(`${svRoot}/`)
    ? generator.slice(svRoot.length + 1)
    : generator;
  const result = spawnSync("bun", ["run", rel], {
    cwd: svRoot,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`Generator failed: ${basename(generator)}`);
  }
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    dir: DEFAULT_SCENE_DIR,
    files: [],
    skipNonScene: true,
    skipRender: false,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--dir") {
      args.dir = resolve(argv[++i]);
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
  const sceneFiles = args.files.length > 0
    ? args.files.map((name) => resolve(args.dir, name))
    : globSync(resolve(args.dir, "*.ts")).filter(isSceneTsFile);

  if (sceneFiles.length === 0) {
    console.log("No TypeScript scene files to process.");
    return 0;
  }

  const svRoot = SV_ROOT;
  let mdUpdates = 0;
  let mp4Updates = 0;
  let skippedNonScene = 0;

  for (const scenePath of sceneFiles) {
    if (!isSceneTsFile(scenePath)) {
      continue;
    }

    const stem = basename(scenePath, ".ts");
    const mdPath = resolve(dirname(scenePath), `${stem}.md`);
    const mp4Path = resolve(svRoot, "output", `${stem}.mp4`);
    const generator = generatorPath(scenePath);
    const hasGenerator = existsSync(generator);

    if (!hasGenerator && args.skipNonScene) {
      skippedNonScene += 1;
      console.log(`${basename(scenePath)}: skipped(no-generator)`);
      continue;
    }

    const renderCmd = hasGenerator
      ? `bun run ${generator.replace(`${svRoot}/`, "")}`
      : "N/A";

    const sceneHash = sha256File(scenePath);
    let mdChanged = false;
    if (!existsSync(mdPath)) {
      mdChanged = syncMarkdown(
        mdPath,
        scenePath,
        renderCmd,
        args.dryRun,
      );
    } else {
      const mdText = readFileSync(mdPath, "utf8");
      const mdHash = readMdSourceHash(mdText);
      if (mdHash !== sceneHash) {
        mdChanged = syncMarkdown(
          mdPath,
          scenePath,
          renderCmd,
          args.dryRun,
        );
      }
    }

    let rendered = false;
    if (
      hasGenerator
      && !args.skipRender
      && shouldRender(scenePath, mp4Path, mdPath)
    ) {
      runGenerator(svRoot, generator, args.dryRun);
      rendered = true;
    }

    mdUpdates += Number(mdChanged);
    mp4Updates += Number(rendered);

    const status: string[] = [];
    if (mdChanged) {
      status.push("md-updated");
    }
    if (rendered) {
      status.push(args.dryRun ? "mp4-stale" : "mp4-updated");
    }
    if (status.length === 0) {
      status.push("up-to-date");
    }
    console.log(`${basename(scenePath)}: ${status.join(", ")}`);
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
