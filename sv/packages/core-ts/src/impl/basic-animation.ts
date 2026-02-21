import type { Animation } from "../animation/types";
import type { Seconds } from "../math/types";
import type { Mobject } from "../mobject/types";

export type ApplyAnimationFn = (target: Mobject, alpha: number) => void;

export class BasicAnimation implements Animation {
  public readonly id: string;
  public readonly duration: Seconds;
  public readonly lagRatio?: number;
  private readonly applyFn: ApplyAnimationFn;

  public constructor(opts: {
    id: string;
    duration: Seconds;
    lagRatio?: number;
    applyFn?: ApplyAnimationFn;
  }) {
    this.id = opts.id;
    this.duration = opts.duration;
    this.lagRatio = opts.lagRatio;
    this.applyFn = opts.applyFn ?? (() => undefined);
  }

  public apply(target: Mobject, alpha: number): void {
    const clampedAlpha = Math.max(0, Math.min(1, alpha));
    this.applyFn(target, clampedAlpha);
  }
}
