import type { Animation } from "../animation/types";
import type { Seconds } from "../math/types";
import type { Mobject, MobjectSnapshot } from "../mobject/types";
import type { Scene, SceneFrame } from "../scene/types";
import { BasicTimeline } from "./basic-timeline";

function cloneSnapshot(snapshot: MobjectSnapshot): MobjectSnapshot {
  const cloned: MobjectSnapshot & { pathPoints?: { x: number; y: number }[] } = {
    ...snapshot,
    transform: {
      ...snapshot.transform,
      position: { ...snapshot.transform.position },
      scale: { ...snapshot.transform.scale },
    },
    style: { ...snapshot.style },
  };
  if ("pathPoints" in snapshot && Array.isArray((snapshot as { pathPoints?: unknown }).pathPoints)) {
    const withPath = snapshot as MobjectSnapshot & { pathPoints: { x: number; y: number }[] };
    cloned.pathPoints = withPath.pathPoints.map((point) => ({ ...point }));
  }
  return cloned;
}

export class BasicScene implements Scene {
  private readonly roots: Mobject[];
  private readonly byId: Map<string, Mobject>;
  private readonly baselineById: Map<string, MobjectSnapshot>;
  private readonly timeline: BasicTimeline;
  private cursor: Seconds;

  public constructor(roots: Mobject[] = []) {
    this.roots = [];
    this.byId = new Map();
    this.baselineById = new Map();
    this.cursor = 0;
    this.timeline = new BasicTimeline({
      resolveTargets: (targetIds) => this.resolveTargets(targetIds),
      collectFrame: (time) => this.collectFrame(time),
    });

    for (const root of roots) {
      this.addRoot(root);
    }
  }

  public construct(): void | Promise<void> {
    return undefined;
  }

  public async play(...animations: Animation[]): Promise<void> {
    const targetIds = this.getAllMobjectIds();
    let maxDuration = 0;
    for (const animation of animations) {
      this.timeline.add({
        start: this.cursor,
        animation,
        targets: targetIds,
      });
      maxDuration = Math.max(maxDuration, animation.duration);
    }
    this.cursor += maxDuration;
  }

  public async wait(duration: Seconds = 1): Promise<void> {
    this.cursor += Math.max(0, duration);
  }

  public sample(time: Seconds): SceneFrame {
    this.resetToBaseline();
    return this.timeline.sample(time);
  }

  public addRoot(root: Mobject): void {
    this.roots.push(root);
    this.registerSubtree(root);
  }

  private registerSubtree(node: Mobject): void {
    if (this.byId.has(node.id)) {
      throw new Error(`Duplicate mobject id '${node.id}'`);
    }
    this.byId.set(node.id, node);
    this.baselineById.set(node.id, cloneSnapshot(node.getSnapshot()));
    for (const child of node.children) {
      this.registerSubtree(child);
    }
  }

  private resolveTargets(targetIds: string[]): Mobject[] {
    const targets: Mobject[] = [];
    for (const id of targetIds) {
      const target = this.byId.get(id);
      if (target) {
        targets.push(target);
      }
    }
    return targets;
  }

  private resetToBaseline(): void {
    for (const [id, mobject] of this.byId.entries()) {
      const snapshot = this.baselineById.get(id);
      if (!snapshot) {
        continue;
      }
      mobject.setSnapshot(cloneSnapshot(snapshot));
    }
  }

  private collectFrame(time: Seconds): SceneFrame {
    const mobjects = Array.from(this.byId.values())
      .map((mobject) => mobject.getSnapshot())
      .sort((a, b) => {
        if (a.zIndex !== b.zIndex) {
          return a.zIndex - b.zIndex;
        }
        return a.id.localeCompare(b.id);
      })
      .map((snapshot) => cloneSnapshot(snapshot));
    return { time, mobjects };
  }

  private getAllMobjectIds(): string[] {
    return Array.from(this.byId.keys());
  }
}
