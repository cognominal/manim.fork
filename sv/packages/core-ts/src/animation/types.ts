import type { Seconds } from "../math/types";
import type { Mobject } from "../mobject/types";

export interface Animation {
  readonly id: string;
  readonly duration: Seconds;
  readonly lagRatio?: number;
  apply(target: Mobject, alpha: number): void; // alpha in [0, 1]
}
