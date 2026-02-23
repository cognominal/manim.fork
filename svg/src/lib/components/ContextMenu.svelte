<script lang="ts">
  type Props = {
    open: boolean;
    x: number;
    y: number;
    canHide: boolean;
    onToggleHide: () => void;
    onClose: () => void;
  };

  let { open, x, y, canHide, onToggleHide, onClose }: Props = $props();

  $effect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = () => {
      onClose();
    };

    const handleWindowKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleWindowKeydown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleWindowKeydown);
    };
  });
</script>

{#if open}
  <div
    class="menu"
    role="menu"
    tabindex="-1"
    data-testid="tree-context-menu"
    style={`left: ${x}px; top: ${y}px;`}
    onpointerdown={(event) => {
      event.stopPropagation();
    }}
  >
    <button
      type="button"
      class="menu-item"
      role="menuitem"
      data-testid="menu-toggle-hide"
      onclick={() => {
        onToggleHide();
        onClose();
      }}
    >
      {canHide ? "Hide" : "Unhide"}
    </button>
  </div>
{/if}

<style>
  .menu {
    position: fixed;
    z-index: 50;
    min-width: 8rem;
    padding: 0.3rem;
    border: 1px solid #cbd5e1;
    border-radius: 0.5rem;
    background: #fff;
    box-shadow: 0 10px 18px rgb(15 23 42 / 0.15);
  }

  .menu-item {
    width: 100%;
    border: 0;
    border-radius: 0.4rem;
    padding: 0.45rem 0.6rem;
    text-align: left;
    font-size: 0.85rem;
    background: transparent;
    cursor: pointer;
  }

  .menu-item:hover,
  .menu-item:focus-visible {
    background: #e2e8f0;
    outline: none;
  }
</style>
