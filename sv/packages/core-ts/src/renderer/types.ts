import type { SceneFrame } from "../scene/types";

export interface Renderer {
  render(frame: SceneFrame): Promise<void> | void;
}
