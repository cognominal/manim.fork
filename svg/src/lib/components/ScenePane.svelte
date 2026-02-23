<script lang="ts">
  import { tick } from "svelte";

  type Props = {
    svgMarkup: string;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
  };

  let { svgMarkup, selectedId, onSelect }: Props = $props();
  let sceneCanvas: HTMLDivElement | null = null;

  function findNodeById(nodeId: string): Element | null {
    if (!sceneCanvas) {
      return null;
    }

    const safeId = CSS.escape(nodeId);

    return sceneCanvas.querySelector(
      `[id="${safeId}"], [data-node-id="${safeId}"]`
    );
  }

  function applySelectionMarker(nodeId: string | null) {
    if (!sceneCanvas) {
      return;
    }

    const selected = sceneCanvas.querySelector(".is-selected");
    selected?.classList.remove("is-selected");

    if (!nodeId) {
      return;
    }

    const match = findNodeById(nodeId);
    match?.classList.add("is-selected");
  }

  $effect(() => {
    svgMarkup;

    tick().then(() => {
      applySelectionMarker(selectedId);
    });
  });

  $effect(() => {
    selectedId;
    applySelectionMarker(selectedId);
  });

  $effect(() => {
    const canvas = sceneCanvas;

    if (!canvas) {
      return;
    }

    const clickHandler = (event: MouseEvent) => {
      handleSceneClick(event);
    };

    canvas.addEventListener("click", clickHandler);

    return () => {
      canvas.removeEventListener("click", clickHandler);
    };
  });

  function handleSceneClick(event: MouseEvent) {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const candidate = target.closest("[id], [data-node-id]");

    if (!candidate || !sceneCanvas?.contains(candidate)) {
      onSelect(null);
      return;
    }

    const candidateId =
      candidate.getAttribute("id") ?? candidate.getAttribute("data-node-id");

    onSelect(candidateId && candidateId.length > 0 ? candidateId : null);
  }
</script>

<div class="scene-pane">
  <header class="pane-header">
    <h2>Scene</h2>
    <p>Fixture: simple rectangle with centered text</p>
  </header>

  <div
    bind:this={sceneCanvas}
    class="scene-canvas"
    aria-label="SVG scene preview"
  >
    {@html svgMarkup}
  </div>
</div>

<style>
  .scene-pane {
    height: 100%;
    padding: 1rem;
  }

  .pane-header {
    margin: 0;
    padding: 0.75rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .pane-header h2 {
    margin: 0;
    font-size: 0.95rem;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .pane-header p {
    margin: 0.35rem 0 0;
    color: #64748b;
    font-size: 0.82rem;
  }

  .scene-canvas {
    display: grid;
    place-items: center;
    min-height: calc(100% - 5.2rem);
    padding: 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    background:
      linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
  }

  :global(.scene-canvas svg) {
    width: min(100%, 40rem);
    height: auto;
    box-shadow: 0 8px 20px rgb(15 23 42 / 0.12);
    background: #fff;
    border-radius: 0.5rem;
  }

  :global(.scene-canvas svg [id]),
  :global(.scene-canvas svg [data-node-id]) {
    cursor: pointer;
  }

  :global(.scene-canvas .is-selected) {
    stroke: #0ea5e9 !important;
    stroke-width: 4 !important;
    paint-order: stroke;
  }
</style>
