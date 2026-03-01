<script lang="ts">
  import { onMount } from "svelte";

  const width = 700;
  const height = 420;
  const trackY = height / 2;
  const squareSize = 44;
  const startX = 70;
  const endX = width - 70;
  const moveMs = 2600;
  const holdMs = 700;
  const cycleMs = moveMs + holdMs;

  const topCircle = {
    x: 180,
    y: trackY,
    r: 58
  };

  const bottomCircle = {
    x: width - 180,
    y: trackY,
    r: 58
  };

  let squareCenterX = $state(startX);
  let elapsedMs = $state(0);
  let phase = $state("move");

  const squareLeft = $derived(squareCenterX - squareSize / 2);
  const squareTop = $derived(trackY - squareSize / 2);

  function tickScene(msInCycle: number): void {
    elapsedMs = msInCycle;

    if (msInCycle < moveMs) {
      phase = "move";
      const alpha = msInCycle / moveMs;
      squareCenterX = startX + (endX - startX) * alpha;
      return;
    }

    phase = "hold";
    squareCenterX = endX;
  }

  onMount(() => {
    const t0 = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const msInCycle = (now - t0) % cycleMs;
      tickScene(msInCycle);
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  });
</script>

<main class="page">
  <section class="card">
    <h1>layered scene</h1>
    <p class="meta">
      square layer: middle
      <span class="sep">|</span>
      top circle y: {topCircle.y}
      <span class="sep">|</span>
      bottom circle y: {bottomCircle.y}
      <span class="sep">|</span>
      phase: {phase} {(elapsedMs / 1000).toFixed(2)}s
    </p>

    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label="Square traverses between top and bottom circles"
    >
      <defs>
        <linearGradient id="scene-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0b1220" />
          <stop offset="100%" stop-color="#17233a" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width={width} height={height} fill="url(#scene-bg)" />

      <line
        x1={startX}
        y1={trackY}
        x2={endX}
        y2={trackY}
        stroke="#334155"
        stroke-dasharray="6 8"
      />

      <g id="back-layer">
        <rect
          x={squareLeft}
          y={squareTop}
          width={squareSize}
          height={squareSize}
          rx="4"
          fill="#22c55e"
          stroke="#14532d"
          stroke-width="3"
        />
      </g>

      <g id="front-layer">
        <circle
          cx={bottomCircle.x}
          cy={bottomCircle.y}
          r={bottomCircle.r}
          fill="#1d4ed855"
          stroke="#60a5fa"
          stroke-width="3"
        />
        <circle
          cx={topCircle.x}
          cy={topCircle.y}
          r={topCircle.r}
          fill="#f59e0b44"
          stroke="#fcd34d"
          stroke-width="3"
        />
      </g>
    </svg>
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    min-height: 100dvh;
    font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
    color: #dbeafe;
    background:
      radial-gradient(circle at 20% 20%, #1e293b, #0f172a 50%),
      linear-gradient(160deg, #020617, #0b1220);
  }

  .page {
    min-height: 100dvh;
    display: grid;
    place-items: center;
    padding: 1rem;
  }

  .card {
    width: min(100%, 52rem);
    padding: 1rem;
    border-radius: 0.85rem;
    border: 1px solid #334155;
    background: #0b1220c9;
    box-shadow: 0 14px 34px #020617aa;
  }

  h1 {
    margin: 0;
    text-transform: lowercase;
    font-size: clamp(1.1rem, 1rem + 1vw, 1.6rem);
  }

  .meta {
    margin: 0.65rem 0 0.9rem;
    min-height: 1.35rem;
    color: #bfdbfe;
    font-size: 0.9rem;
  }

  .sep {
    display: inline-block;
    width: 1.1rem;
    text-align: center;
    color: #64748b;
  }

  svg {
    display: block;
    border-radius: 0.6rem;
    border: 1px solid #334155;
    aspect-ratio: 5 / 3;
  }
</style>
