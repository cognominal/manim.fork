import type { Timeline } from "../timeline/types";
import type { Mobject } from "../mobject/types";
import type { SceneFrame } from "../scene/types";
import type { TimelineEvent } from "../timeline/types";

function compareEvents(a: TimelineEvent, b: TimelineEvent): number {
  if (a.start !== b.start) {
    return a.start - b.start;
  }
  return a.animation.id.localeCompare(b.animation.id);
}

export class BasicTimeline implements Timeline {
  public readonly events: TimelineEvent[];
  private readonly resolveTargets: (targetIds: string[]) => Mobject[];
  private readonly collectFrame: (time: number) => SceneFrame;

  public constructor(opts: {
    resolveTargets: (targetIds: string[]) => Mobject[];
    collectFrame: (time: number) => SceneFrame;
  }) {
    this.events = [];
    this.resolveTargets = opts.resolveTargets;
    this.collectFrame = opts.collectFrame;
  }

  public add(event: TimelineEvent): void {
    this.events.push(event);
    this.events.sort(compareEvents);
  }

  public sample(time: number): SceneFrame {
    const t = Math.max(0, time);
    for (const event of this.events) {
      if (event.start > t) {
        break;
      }
      const elapsed = t - event.start;
      const duration = Math.max(0, event.animation.duration);
      const alpha = duration === 0 ? 1 : Math.min(elapsed / duration, 1);
      const targets = this.resolveTargets(event.targets);
      for (const target of targets) {
        event.animation.apply(target, alpha);
      }
    }
    return this.collectFrame(t);
  }
}
