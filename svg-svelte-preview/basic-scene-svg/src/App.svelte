<script lang="ts">
  import { onMount } from "svelte";

  const width = 640;
  const height = 360;
  const squareSize = 40;
  const startX = 40;
  const endX = width - 40;
  const centerY = height / 2;
  const moveMs = 2000;
  const holdMs = 1000;
  const cycleMs = moveMs + holdMs;

  let squareCenterX = $state(startX);
  let elapsedMs = $state(0);
  let phaseLabel = $state("move");

  const squareLeft = $derived(squareCenterX - squareSize / 2);
  const squareTop = $derived(centerY - squareSize / 2);

  function updateState(msInCycle: number): void {
    elapsedMs = msInCycle;

    if (msInCycle < moveMs) {
      phaseLabel = "move";
      const alpha = msInCycle / moveMs;
      squareCenterX = startX + (endX - startX) * alpha;
      return;
    }

    phaseLabel = "hold";
    squareCenterX = endX;
  }

  onMount(() => {
    const t0 = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const msInCycle = (now - t0) % cycleMs;
      updateState(msInCycle);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  });
</script>

<main class="page">
  <section class="panel">
    <h1>basic-scene-svg preview</h1>
    <p class="meta" aria-live="off">
      phase: <span>{phaseLabel}</span>
      <span class="dot">|</span>
      t: {(elapsedMs / 1000).toFixed(2)}s
    </p>

    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label="Moving green square"
    >
      <rect
        x={squareLeft}
        y={squareTop}
        width={squareSize}
        height={squareSize}
        fill="#22c55e"
        stroke="#0b3d2e"
        stroke-width="2"
      />
    </svg>
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    min-height: 100dvh;
    font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
    background: linear-gradient(140deg, #f8fafc, #e5edf8);
    color: #132338;
  }

  .page {
    min-height: 100dvh;
    display: grid;
    place-items: center;
    padding: 1rem;
  }

  .panel {
    width: min(100%, 48rem);
    padding: 1rem;
    border-radius: 0.75rem;
    background: #ffffffd9;
    border: 1px solid #cbd5e1;
    box-shadow: 0 8px 28px #0f172a14;
  }

  h1 {
    margin: 0;
    font-size: clamp(1.1rem, 1rem + 1vw, 1.5rem);
    line-height: 1.2;
    text-transform: lowercase;
  }

  .meta {
    margin: 0.55rem 0 0.8rem;
    min-height: 1.4rem;
    font-size: 0.95rem;
    color: #334155;
  }

  .dot {
    display: inline-block;
    width: 1.1rem;
    text-align: center;
    color: #94a3b8;
  }

  svg {
    display: block;
    border-radius: 0.5rem;
    border: 1px solid #bfdbfe;
    background: linear-gradient(180deg, #0f172a, #111827);
    aspect-ratio: 16 / 9;
  }
</style>
