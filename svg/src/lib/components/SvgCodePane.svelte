<script lang="ts">
  import { unfoldCode } from "@codemirror/language";
  import { xml } from "@codemirror/lang-xml";
  import { EditorSelection, EditorState } from "@codemirror/state";
  import { EditorView, keymap } from "@codemirror/view";
  import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
  import {
    buildNodeRangeIndex,
    findNodeIdAtPosition,
    findPrimaryRange,
    type NodeRangeIndex
  } from "../model/svg-text-map";

  type Props = {
    svgMarkup: string;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
  };

  let { svgMarkup, selectedId, onSelect }: Props = $props();
  let rootEl: HTMLDivElement | null = null;
  let editorView: EditorView | null = null;
  let rangeIndex: NodeRangeIndex = buildNodeRangeIndex("");
  let suppressSelectionBroadcast = false;

  function buildEditorState(initialDoc: string): EditorState {
    return EditorState.create({
      doc: initialDoc,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        xml(),
        EditorState.readOnly.of(true),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (!update.selectionSet || suppressSelectionBroadcast) {
            return;
          }

          const head = update.state.selection.main.head;
          const nodeId = findNodeIdAtPosition(rangeIndex, head);

          onSelect(nodeId);
        })
      ]
    });
  }

  function setEditorSelectionByNodeId(nodeId: string | null) {
    const view = editorView;

    if (!view || !nodeId) {
      return;
    }

    const range = findPrimaryRange(rangeIndex, nodeId);

    if (!range) {
      return;
    }

    suppressSelectionBroadcast = true;
    view.dispatch({
      selection: EditorSelection.single(range.start, range.end),
      scrollIntoView: true
    });
    unfoldCode(view);
    suppressSelectionBroadcast = false;
  }

  $effect(() => {
    if (!rootEl) {
      return;
    }

    const state = buildEditorState(svgMarkup);
    const view = new EditorView({
      state,
      parent: rootEl
    });
    (rootEl as HTMLDivElement & { __cmView?: EditorView }).__cmView = view;

    editorView = view;
    rangeIndex = buildNodeRangeIndex(svgMarkup);

    return () => {
      view.destroy();
      Reflect.deleteProperty(
        rootEl as HTMLDivElement & { __cmView?: EditorView },
        "__cmView"
      );
      editorView = null;
    };
  });

  $effect(() => {
    svgMarkup;

    if (!editorView) {
      return;
    }

    rangeIndex = buildNodeRangeIndex(svgMarkup);
    const currentDoc = editorView.state.doc.toString();

    if (currentDoc !== svgMarkup) {
      suppressSelectionBroadcast = true;
      editorView.dispatch({
        changes: {
          from: 0,
          to: currentDoc.length,
          insert: svgMarkup
        }
      });
      suppressSelectionBroadcast = false;
    }

    setEditorSelectionByNodeId(selectedId);
  });

  $effect(() => {
    selectedId;
    setEditorSelectionByNodeId(selectedId);
  });
</script>

<div class="svg-code-pane">
  <header class="pane-header">
    <h2>SVG Source</h2>
    <p>Read-only CodeMirror view</p>
  </header>
  <div bind:this={rootEl} class="editor-shell" data-testid="svg-code-pane"></div>
</div>

<style>
  .svg-code-pane {
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

  .editor-shell {
    height: calc(100% - 5.2rem);
    overflow: hidden;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    background: #f8fafc;
  }

  :global(.editor-shell .cm-editor) {
    height: 100%;
  }

  :global(.editor-shell .cm-scroller) {
    font-family: "Iosevka", "IBM Plex Mono", monospace;
    font-size: 0.86rem;
    line-height: 1.45;
  }
</style>
