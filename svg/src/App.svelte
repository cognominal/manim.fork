<script lang="ts">
  import { SplitPane } from "@rich_harris/svelte-split-pane";
  import { fromStore } from "svelte/store";
  import ScenePane from "./lib/components/ScenePane.svelte";
  import SplitLayout from "./lib/components/SplitLayout.svelte";
  import SvgCodePane from "./lib/components/SvgCodePane.svelte";
  import TreePane from "./lib/components/TreePane.svelte";
  import { createEditorStore } from "./lib/model/editor-store";
  import fixtureSvg from "./lib/fixtures/simple-scene.svg?raw";

  type ViewTab = "scene" | "svg";

  const editorStore = createEditorStore(fixtureSvg);
  const svgMarkup = fromStore(editorStore.svgMarkup);
  const treeRows = fromStore(editorStore.treeRows);
  const selectedId = fromStore(editorStore.selectedId);
  let activeTab = $state<ViewTab>("scene");
  let splitMode = $state(false);

  function handleSelect(nextId: string | null) {
    editorStore.selectedId.set(nextId);
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      editorStore.selectedId.set(null);
    }
  }

  function handleToggleHide(id: string) {
    editorStore.toggleHidden(id);
  }

  function setTab(tab: ViewTab) {
    activeTab = tab;
  }

  function toggleSplitMode() {
    splitMode = !splitMode;
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

{#snippet leftPane()}
  <TreePane
    rows={treeRows.current}
    selectedId={selectedId.current}
    onSelect={handleSelect}
    onToggleHide={handleToggleHide}
  />
{/snippet}

{#snippet rightPane()}
  <section class="workspace">
    <header class="workspace-bar">
      {#if !splitMode}
        <div class="tab-list" role="tablist" aria-label="View tabs">
          <button
            type="button"
            role="tab"
            class="tab"
            data-active={activeTab === "scene"}
            aria-selected={activeTab === "scene"}
            data-testid="tab-scene"
            onclick={() => setTab("scene")}
          >
            scene
          </button>
          <button
            type="button"
            role="tab"
            class="tab"
            data-active={activeTab === "svg"}
            aria-selected={activeTab === "svg"}
            data-testid="tab-svg"
            onclick={() => setTab("svg")}
          >
            svg
          </button>
        </div>
      {/if}

      <button
        type="button"
        class="split-toggle"
        data-testid="toggle-split"
        onclick={toggleSplitMode}
      >
        {splitMode ? "unsplit" : "split"}
      </button>
    </header>

    <div class="workspace-content">
      {#if splitMode}
        <SplitPane
          type="columns"
          id="scene-svg-split"
          min="18rem"
          max="82%"
          pos="50%"
          --color="#cbd5e1"
          --thickness="10px"
        >
          {#snippet a()}
            <section class="split-pane" data-testid="split-left-svg">
              <SvgCodePane
                svgMarkup={svgMarkup.current}
                selectedId={selectedId.current}
                onSelect={handleSelect}
              />
            </section>
          {/snippet}

          {#snippet b()}
            <section class="split-pane" data-testid="split-right-scene">
              <ScenePane
                svgMarkup={svgMarkup.current}
                selectedId={selectedId.current}
                onSelect={handleSelect}
              />
            </section>
          {/snippet}
        </SplitPane>
      {:else if activeTab === "scene"}
        <ScenePane
          svgMarkup={svgMarkup.current}
          selectedId={selectedId.current}
          onSelect={handleSelect}
        />
      {:else}
        <SvgCodePane
          svgMarkup={svgMarkup.current}
          selectedId={selectedId.current}
          onSelect={handleSelect}
        />
      {/if}
    </div>
  </section>
{/snippet}

<SplitLayout
  left={leftPane}
  right={rightPane}
/>

<style>
  .workspace {
    height: 100%;
    display: grid;
    grid-template-rows: auto 1fr;
  }

  .workspace-bar {
    min-height: 3rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.5rem 0.9rem;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  .tab-list {
    display: inline-flex;
    gap: 0.45rem;
  }

  .tab,
  .split-toggle {
    border: 1px solid #cbd5e1;
    border-radius: 0.45rem;
    min-height: 2rem;
    padding: 0.1rem 0.8rem;
    font-size: 0.85rem;
    text-transform: lowercase;
    background: #fff;
    cursor: pointer;
  }

  .tab[data-active="true"] {
    border-color: #0ea5e9;
    background: #dbeafe;
  }

  .workspace-content {
    min-height: 0;
    height: 100%;
  }

  .split-pane {
    height: calc(100dvh - 3rem);
    overflow: auto;
  }
</style>
