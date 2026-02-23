<script lang="ts">
  import { SplitPane } from "@rich_harris/svelte-split-pane";
  import type { Snippet } from "svelte";

  type Unit = "%" | "px" | "em" | "rem";
  type Length = `${number}${Unit}`;

  type Props = {
    left: Snippet;
    right: Snippet;
    id?: string;
    min?: Length;
    max?: Length;
    pos?: Length;
  };

  let {
    left,
    right,
    id = "svg-studio-main",
    min = "14rem",
    max = "82%",
    pos = "30%"
  }: Props = $props();
</script>

<SplitPane
  type="columns"
  {id}
  {min}
  {max}
  {pos}
  --color="#cbd5e1"
  --thickness="10px"
>
  {#snippet a()}
    <section class="pane pane-left">
      {@render left()}
    </section>
  {/snippet}

  {#snippet b()}
    <section class="pane pane-right">
      {@render right()}
    </section>
  {/snippet}
</SplitPane>

<style>
  .pane {
    height: 100vh;
    overflow: auto;
  }

  .pane-left {
    border-right: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  .pane-right {
    background: #fff;
  }
</style>
