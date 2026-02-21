# ManimTS Interfaces (v1 Draft)

## Scope
This document defines the initial TypeScript contracts for the runtime engine, timeline, and export boundary. These are intentionally minimal and aimed at fast v1 delivery.

## Core Types

```ts
export type Seconds = number;

export interface Vec2 {
  x: number;
  y: number;
}

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
```

## Runtime Contracts

```ts
export interface Mobject {
  id: string;
  name?: string;
  children: Mobject[];
  getSnapshot(): MobjectSnapshot;
  setSnapshot(snapshot: MobjectSnapshot): void;
  add(...children: Mobject[]): this;
  remove(...children: Mobject[]): this;
}

export interface Animation {
  readonly id: string;
  readonly duration: Seconds;
  readonly lagRatio?: number;
  apply(target: Mobject, alpha: number): void; // alpha in [0, 1]
}

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
```

## Render and Export Contracts

```ts
export interface Renderer {
  render(frame: SceneFrame): Promise<void> | void;
}

export interface VideoExporter {
  exportMp4(
    scene: Scene,
    opts: {
      outFile: string;
      fps: number;
      width: number;
      height: number;
      duration: Seconds;
    },
  ): Promise<void>;
}
```

## Constraints
- Deterministic sampling: same scene + time must yield same `SceneFrame`.
- Runtime and Studio playback must share the same timeline semantics.
- Export pipeline is an adapter and must not alter scene timing behavior.
