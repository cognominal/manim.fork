import type { Animation } from "../animation/types";
import type { Seconds } from "../math/types";
import type { SceneFrame } from "../scene/types";

export interface TimelineEvent {
  start: Seconds;
  animation: Animation;
  targets: string[]; // mobject ids
}

export interface Timeline {
  events: TimelineEvent[];
  add(event: TimelineEvent): void;
  sample(time: Seconds): SceneFrame;
}
