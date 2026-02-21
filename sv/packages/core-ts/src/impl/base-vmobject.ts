import type { MobjectSnapshot, VMobjectSnapshot } from "../mobject/types";
import { BaseMobject } from "./base-mobject";

function cloneVMobjectSnapshot(snapshot: VMobjectSnapshot): VMobjectSnapshot {
  return {
    ...snapshot,
    transform: {
      ...snapshot.transform,
      position: { ...snapshot.transform.position },
      scale: { ...snapshot.transform.scale },
    },
    style: { ...snapshot.style },
    pathPoints: snapshot.pathPoints.map((point) => ({ ...point })),
  };
}

export class BaseVMobject extends BaseMobject {
  protected vmSnapshot: VMobjectSnapshot;

  public constructor(snapshot: VMobjectSnapshot) {
    super(snapshot);
    this.vmSnapshot = cloneVMobjectSnapshot(snapshot);
  }

  public override getSnapshot(): VMobjectSnapshot {
    return cloneVMobjectSnapshot(this.vmSnapshot);
  }

  public override setSnapshot(snapshot: MobjectSnapshot): void {
    super.setSnapshot(snapshot);
    if ("pathPoints" in snapshot && Array.isArray(snapshot.pathPoints)) {
      this.vmSnapshot = cloneVMobjectSnapshot(snapshot as VMobjectSnapshot);
    }
  }
}
