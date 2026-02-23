<script lang="ts">
  import ContextMenu from "./ContextMenu.svelte";
  import type { SvgTreeRow } from "../model/svg-tree";

  type Props = {
    rows: SvgTreeRow[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onToggleHide: (id: string) => void;
  };

  let { rows, selectedId, onSelect, onToggleHide }: Props = $props();
  let menuOpen = $state(false);
  let menuX = $state(0);
  let menuY = $state(0);
  let menuTarget: SvgTreeRow | null = $state(null);

  function openContextMenu(event: MouseEvent, row: SvgTreeRow) {
    event.preventDefault();
    menuOpen = true;
    menuTarget = row;
    menuX = event.clientX;
    menuY = event.clientY;
  }

  function closeContextMenu() {
    menuOpen = false;
    menuTarget = null;
  }
</script>

<div class="tree-pane" aria-label="SVG structure tree">
  <header class="pane-header">
    <h2>Structure</h2>
    <p>{rows.length} nodes</p>
  </header>

  <ul class="tree-list">
    {#each rows as row (row.id + "-" + row.depth)}
      <li class="tree-row" data-selectable={row.selectable}>
        <button
          class="row-button"
          type="button"
          disabled={!row.selectable}
          data-node-id={row.id}
          data-selected={selectedId === row.id}
          aria-current={selectedId === row.id ? "true" : "false"}
          data-testid={`tree-row-${row.id}`}
          onclick={() => {
            if (row.selectable) {
              onSelect(row.id);
            }
          }}
          oncontextmenu={(event) => {
            openContextMenu(event, row);
          }}
        >
          <span class="indent" style={`width: ${row.depth * 0.9}rem;`}></span>
          <span class="tag">{row.tag}</span>
          <span class="label">{row.label}</span>
          <span class="state" data-hidden={row.effectiveHidden}>hidden</span>
        </button>
      </li>
    {/each}
  </ul>

  <ContextMenu
    open={menuOpen}
    x={menuX}
    y={menuY}
    canHide={!menuTarget?.explicitHidden}
    onToggleHide={() => {
      if (menuTarget) {
        onToggleHide(menuTarget.id);
      }
    }}
    onClose={closeContextMenu}
  />
</div>

<style>
  .tree-pane {
    height: 100%;
    padding: 1rem 0.75rem;
  }

  .pane-header {
    position: sticky;
    top: 0;
    z-index: 1;
    margin: 0;
    padding: 0.75rem 0.5rem;
    background: #f8fafc;
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

  .tree-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .tree-row {
    margin: 0.05rem 0;
    min-height: 2.1rem;
  }

  .row-button {
    width: 100%;
    border: 0;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    min-height: 2.1rem;
    padding: 0.2rem 0.5rem;
    border-radius: 0.45rem;
    color: #0f172a;
    background: transparent;
    text-align: left;
    cursor: pointer;
  }

  .row-button:hover {
    background: #e2e8f0;
  }

  .row-button[data-selected="true"] {
    background: #dbeafe;
    box-shadow: inset 0 0 0 1px #60a5fa;
  }

  .row-button:focus-visible {
    outline: 2px solid #0ea5e9;
    outline-offset: 1px;
  }

  .row-button:disabled {
    cursor: not-allowed;
  }

  .tree-row[data-selectable="false"] {
    color: #64748b;
  }

  .indent {
    flex: 0 0 auto;
    height: 1px;
  }

  .tag {
    min-width: 2.7rem;
    font-family: "Iosevka Aile", "IBM Plex Sans", sans-serif;
    font-size: 0.78rem;
    color: #0369a1;
    text-transform: uppercase;
  }

  .label {
    font-size: 0.87rem;
  }

  .state {
    margin-left: auto;
    min-width: 3.4rem;
    font-size: 0.75rem;
    color: #b91c1c;
    visibility: hidden;
  }

  .state[data-hidden="true"] {
    visibility: visible;
  }
</style>
