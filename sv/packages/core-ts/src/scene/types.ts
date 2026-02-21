import type { Animation } from "../animation/types";
import type { Seconds } from "../math/types";
import type { MobjectSnapshot } from "../mobject/types";

export interface SceneFrame {
  time: Seconds;
  mobjects: MobjectSnapshot[];
}

export interface Scene {
  construct(): void | Promise<void>;
  play(...animations: Animation[]): Promise<void>;
  wait(duration?: Seconds): Promise<void>;
  sample(time: Seconds): SceneFrame;
}
