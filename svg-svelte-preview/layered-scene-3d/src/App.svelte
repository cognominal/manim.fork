<script lang="ts">
  import { onMount } from "svelte";

  type Vec3 = {
    x: number;
    y: number;
    z: number;
  };

  type Projected = {
    x: number;
    y: number;
    depth: number;
    visible: boolean;
    scale: number;
  };

  const width = 900;
  const height = 520;
  const moveMs = 2600;
  const holdMs = 700;
  const cycleMs = moveMs + holdMs;
  const nearPlane = 0.1;

  const leftCircleCenter: Vec3 = { x: -3.2, y: 0, z: 0.9 };
  const rightCircleCenter: Vec3 = { x: 3.2, y: 0, z: 1.1 };
  const squareStartX = -5;
  const squareEndX = 5;

  let elapsedMs = $state(0);
  let phase = $state("move");

  let yawDeg = $state(25);
  let pitchDeg = $state(12);
  let distance = $state(12);
  let panX = $state(0);
  let panY = $state(0);
  let fovDeg = $state(52);

  let squareWorldX = $state(squareStartX);

  const squareCenter = $derived<Vec3>({ x: squareWorldX, y: 0, z: 0 });

  const cameraPos = $derived.by(() => {
    const yaw = (yawDeg * Math.PI) / 180;
    const pitch = (pitchDeg * Math.PI) / 180;
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);

    return {
      x: distance * cp * sy + panX,
      y: distance * sp + panY,
      z: distance * cp * cy
    };
  });

  const viewTarget = $derived<Vec3>({ x: panX, y: panY, z: 0 });

  function normalize(v: Vec3): Vec3 {
    const m = Math.hypot(v.x, v.y, v.z) || 1;
    return { x: v.x / m, y: v.y / m, z: v.z / m };
  }

  function subtract(a: Vec3, b: Vec3): Vec3 {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  }

  function dot(a: Vec3, b: Vec3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  function cross(a: Vec3, b: Vec3): Vec3 {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x
    };
  }

  function projectPoint(point: Vec3): Projected {
    const forward = normalize(subtract(viewTarget, cameraPos));
    const worldUp: Vec3 = { x: 0, y: 1, z: 0 };
    const right = normalize(cross(forward, worldUp));
    const up = cross(right, forward);

    const toPoint = subtract(point, cameraPos);
    const camX = dot(toPoint, right);
    const camY = dot(toPoint, up);
    const camZ = dot(toPoint, forward);

    if (camZ <= nearPlane) {
      return { x: -9999, y: -9999, depth: camZ, visible: false, scale: 0 };
    }

    const f = 1 / Math.tan(((fovDeg * Math.PI) / 180) / 2);
    const aspect = width / height;
    const ndcX = (camX * f) / (camZ * aspect);
    const ndcY = (camY * f) / camZ;

    return {
      x: (ndcX + 1) * width * 0.5,
      y: (1 - ndcY) * height * 0.5,
      depth: camZ,
      visible: true,
      scale: Math.min(3, Math.max(0.2, 6 / camZ))
    };
  }

  const leftCircle2D = $derived(projectPoint(leftCircleCenter));
  const rightCircle2D = $derived(projectPoint(rightCircleCenter));
  const square2D = $derived(projectPoint(squareCenter));

  const drawOrder = $derived.by(() => {
    const items = [
      {
        id: "left-circle",
        type: "circle" as const,
        p: leftCircle2D,
        color: "#3b82f6"
      },
      {
        id: "right-circle",
        type: "circle" as const,
        p: rightCircle2D,
        color: "#f59e0b"
      },
      {
        id: "square",
        type: "square" as const,
        p: square2D,
        color: "#22c55e"
      }
    ];

    return items
      .filter((item) => item.p.visible)
      .sort((a, b) => b.p.depth - a.p.depth);
  });

  function updateMotion(msInCycle: number): void {
    elapsedMs = msInCycle;

    if (msInCycle < moveMs) {
      phase = "move";
      const alpha = msInCycle / moveMs;
      squareWorldX = squareStartX + (squareEndX - squareStartX) * alpha;
      return;
    }

    phase = "hold";
    squareWorldX = squareEndX;
  }

  onMount(() => {
    const t0 = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const msInCycle = (now - t0) % cycleMs;
      updateMotion(msInCycle);
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  });
</script>

<main class="page">
  <section class="card">
    <h1>layered scene 3d</h1>
    <p class="meta">
      depth-correct sort: enabled
      <span class="sep">|</span>
      phase: {phase} {(elapsedMs / 1000).toFixed(2)}s
    </p>

    <div class="layout">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="img"
        aria-label="3D scene projected into SVG"
      >
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0a0f1a" />
            <stop offset="100%" stop-color="#1c2942" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={width} height={height} fill="url(#bg)" />

        {#each drawOrder as item (item.id)}
          {#if item.type === "circle"}
            <circle
              cx={item.p.x}
              cy={item.p.y}
              r={55 * item.p.scale}
              fill={`${item.color}66`}
              stroke={item.color}
              stroke-width={2.5 * item.p.scale}
            />
          {:else}
            <rect
              x={item.p.x - 24 * item.p.scale}
              y={item.p.y - 24 * item.p.scale}
              width={48 * item.p.scale}
              height={48 * item.p.scale}
              rx={6 * item.p.scale}
              fill="#22c55e"
              stroke="#14532d"
              stroke-width={3 * item.p.scale}
            />
          {/if}
        {/each}
      </svg>

      <aside class="controls">
        <h2>viewpoint</h2>
        <label>
          yaw {yawDeg.toFixed(0)}
          <input type="range" min="-180" max="180" bind:value={yawDeg} />
        </label>
        <label>
          pitch {pitchDeg.toFixed(0)}
          <input type="range" min="-70" max="70" bind:value={pitchDeg} />
        </label>
        <label>
          distance {distance.toFixed(1)}
          <input type="range" min="5" max="20" step="0.1"
            bind:value={distance} />
        </label>
        <label>
          fov {fovDeg.toFixed(0)}
          <input type="range" min="25" max="95" bind:value={fovDeg} />
        </label>
        <label>
          pan x {panX.toFixed(1)}
          <input type="range" min="-4" max="4" step="0.1"
            bind:value={panX} />
        </label>
        <label>
          pan y {panY.toFixed(1)}
          <input type="range" min="-4" max="4" step="0.1"
            bind:value={panY} />
        </label>
      </aside>
    </div>
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    min-height: 100dvh;
    font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
    color: #dbeafe;
    background: radial-gradient(circle at 15% 20%, #111827, #030712 55%);
  }

  .page {
    min-height: 100dvh;
    display: grid;
    place-items: center;
    padding: 1rem;
  }

  .card {
    width: min(100%, 70rem);
    padding: 1rem;
    border-radius: 0.85rem;
    border: 1px solid #334155;
    background: #0b1220d6;
  }

  h1 {
    margin: 0;
    font-size: clamp(1.1rem, 1rem + 1vw, 1.6rem);
    text-transform: lowercase;
  }

  .meta {
    margin: 0.65rem 0 0.9rem;
    min-height: 1.35rem;
    color: #bfdbfe;
    font-size: 0.9rem;
  }

  .sep {
    display: inline-block;
    width: 1rem;
    text-align: center;
    color: #64748b;
  }

  .layout {
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr;
  }

  @media (min-width: 56rem) {
    .layout {
      grid-template-columns: minmax(0, 1fr) 18rem;
      align-items: start;
    }
  }

  svg {
    display: block;
    border-radius: 0.6rem;
    border: 1px solid #334155;
    aspect-ratio: 16 / 9;
    background: #020617;
  }

  .controls {
    border: 1px solid #334155;
    border-radius: 0.6rem;
    padding: 0.75rem;
    background: #0f172a;
  }

  h2 {
    margin: 0 0 0.6rem;
    font-size: 0.95rem;
    text-transform: lowercase;
  }

  label {
    display: grid;
    gap: 0.3rem;
    font-size: 0.85rem;
    color: #cbd5e1;
    margin-bottom: 0.55rem;
  }

  input[type="range"] {
    width: 100%;
  }
</style>
