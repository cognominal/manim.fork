import { runDemo } from "./dancing_links";

export type DlxAnimFrame = {
  time: number;
  label: string;
  ring: readonly string[];
};

export function buildDlxAnimFrames(stepSeconds = 1.0): DlxAnimFrame[] {
  const events = runDemo();
  return events.map((event, idx) => {
    const label = event.op === "start"
      ? "start"
      : `${event.op}(${event.target})`;
    return {
      time: idx * stepSeconds,
      label,
      ring: event.ring,
    };
  });
}

function main(): void {
  console.log(JSON.stringify({ frames: buildDlxAnimFrames() }));
}

if (import.meta.main) {
  main();
}
