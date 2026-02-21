import type { Mobject, MobjectSnapshot } from "../mobject/types";

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

export class BaseMobject implements Mobject {
  public id: string;
  public name?: string;
  public children: Mobject[];
  protected snapshot: MobjectSnapshot;

  public constructor(snapshot: MobjectSnapshot) {
    this.id = snapshot.id;
    this.name = snapshot.name;
    this.children = [];
    this.snapshot = cloneSnapshot(snapshot);
  }

  public getSnapshot(): MobjectSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  public setSnapshot(snapshot: MobjectSnapshot): void {
    this.id = snapshot.id;
    this.name = snapshot.name;
    this.snapshot = cloneSnapshot(snapshot);
  }

  public add(...children: Mobject[]): this {
    this.children.push(...children);
    return this;
  }

  public remove(...children: Mobject[]): this {
    const childIds = new Set(children.map((child) => child.id));
    this.children = this.children.filter((child) => !childIds.has(child.id));
    return this;
  }
}
