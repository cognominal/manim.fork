import {
  BaseMobject,
  BasicAnimation,
  BasicScene,
  type MobjectSnapshot,
  type SceneFrame,
} from "../packages/core-ts/src/index";

// Build a minimal snapshot with a configurable x-position.
function snapshotAtX(id: string, x: number): MobjectSnapshot {
  return {
    id,
    name: id,
    zIndex: 0,
    transform: {
      position: { x, y: 0 },
      rotation: 0,
      scale: { x: 1, y: 1 },
    },
    style: {
      strokeColor: "#ffffff",
      strokeWidth: 2,
      fillColor: "#000000",
      fillOpacity: 0,
      opacity: 1,
    },
    visible: true,
  };
}

// Keep console output compact and stable for quick sample inspection.
function summarize(frame: SceneFrame): string {
  const pos = frame.mobjects[0]?.transform.position;
  return `t=${frame.time.toFixed(2)} x=${(pos?.x ?? 0).toFixed(2)}`;
}

async function main(): Promise<void> {
  // Seed the scene with one dot located at x = 0.
  const dot = new BaseMobject(snapshotAtX("dot", 0));
  const scene = new BasicScene([dot]);

  // Animate the dot from x = 0 to x = 10 over 2 seconds.
  const moveRight = new BasicAnimation({
    id: "move-right",
    duration: 2,
    applyFn: (target, alpha) => {
      const current = target.getSnapshot();
      target.setSnapshot({
        ...current,
        transform: {
          ...current.transform,
          position: {
            ...current.transform.position,
            x: 10 * alpha,
          },
        },
      });
    },
  });

  // Run the animation, then hold the final state for 1 second.
  await scene.play(moveRight);
  await scene.wait(1);

  // Sample frames before, during, and after the motion.
  const samples = [0, 0.5, 1, 2, 3];
  for (const t of samples) {
    const frame = scene.sample(t);
    console.log(summarize(frame));
  }
}

// Execute the example without awaiting at the top level.
void main();
