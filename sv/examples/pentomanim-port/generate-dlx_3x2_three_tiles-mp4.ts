import { resolve } from "node:path";
import { generateDlxMp4 } from "./generate-dlx-shared-mp4";
import {
  DLX_3X2_THREE_TILE_PIECES,
  runDlx3x2ThreeTiles,
} from "./dlx_3x2_three_tiles";

async function main(): Promise<void> {
  const outFile = resolve(
    "/Users/cog/mine/manim.fork/sv/output/dlx_3x2_three_tiles.mp4",
  );
  await generateDlxMp4({
    result: runDlx3x2ThreeTiles(10),
    pieces: DLX_3X2_THREE_TILE_PIECES,
    outFile,
  });
  console.log(outFile);
}

void main();
