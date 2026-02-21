import type { Vec2 } from "../math/types";

export interface Style {
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
  fillOpacity?: number;
  opacity?: number;
}

export interface Transform2D {
  position: Vec2;
  rotation: number; // radians
  scale: Vec2;
}

export interface MobjectSnapshot {
  id: string;
  name?: string;
  parentId?: string;
  zIndex: number;
  transform: Transform2D;
  style: Style;
  visible: boolean;
}

export interface VMobjectSnapshot extends MobjectSnapshot {
  // Flattened cubic-bezier representation for deterministic interpolation.
  pathPoints: Vec2[];
  closed: boolean;
}

export interface Mobject {
  id: string;
  name?: string;
  children: Mobject[];
  getSnapshot(): MobjectSnapshot;
  setSnapshot(snapshot: MobjectSnapshot): void;
  add(...children: Mobject[]): this;
  remove(...children: Mobject[]): this;
}
