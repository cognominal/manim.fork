const NON_SELECTABLE_TAGS = new Set(["metadata", "title", "desc"]);

export type SvgTreeNode = {
  id: string;
  tag: string;
  label: string;
  children: SvgTreeNode[];
  hidden: boolean;
  selectable: boolean;
};

export type SvgTreeRow = {
  id: string;
  tag: string;
  label: string;
  depth: number;
  explicitHidden: boolean;
  effectiveHidden: boolean;
  selectable: boolean;
};

function fallbackId(tag: string, path: number[]): string {
  if (path.length === 0) {
    return `auto-${tag}-root`;
  }

  return `auto-${tag}-${path.join("-")}`;
}

function parseHidden(el: Element): boolean {
  const style = el.getAttribute("style") ?? "";
  const normalizedStyle = style.replace(/\s+/g, "").toLowerCase();
  const hasDisplayNone = normalizedStyle.includes("display:none");
  const displayAttr = el.getAttribute("display")?.trim().toLowerCase();

  return hasDisplayNone || displayAttr === "none";
}

function toNode(el: Element, path: number[]): SvgTreeNode {
  const tag = el.tagName.toLowerCase();
  const rawId = el.getAttribute("id");
  const id =
    rawId && rawId.trim().length > 0 ? rawId.trim() : fallbackId(tag, path);

  const elementChildren = Array.from(el.childNodes).filter((child) => {
    return child.nodeType === 1;
  }) as Element[];
  const children = elementChildren.map((child, index) => {
    return toNode(child, [...path, index]);
  });

  return {
    id,
    tag,
    label: `${tag}#${id}`,
    children,
    hidden: parseHidden(el),
    selectable: !NON_SELECTABLE_TAGS.has(tag)
  };
}

export function parseSvgTree(svgText: string): SvgTreeNode {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const parseErrorNode = doc.getElementsByTagName("parsererror").item(0);

  if (parseErrorNode) {
    const message =
      parseErrorNode.textContent?.trim() ?? "unknown SVG parse error";

    throw new Error(`Failed to parse SVG: ${message}`);
  }

  const root = doc.documentElement;

  if (root.tagName.toLowerCase() !== "svg") {
    throw new Error("Failed to parse SVG: root element is not <svg>");
  }

  return toNode(root, []);
}

export function flattenNodeIds(node: SvgTreeNode): string[] {
  const ids: string[] = [node.id];

  for (const child of node.children) {
    ids.push(...flattenNodeIds(child));
  }

  return ids;
}

export function buildTreeRows(
  root: SvgTreeNode,
  depth = 0,
  hiddenByAncestor = false
): SvgTreeRow[] {
  const effectiveHidden = hiddenByAncestor || root.hidden;
  const row: SvgTreeRow = {
    id: root.id,
    tag: root.tag,
    label: root.label,
    depth,
    explicitHidden: root.hidden,
    effectiveHidden,
    selectable: root.selectable
  };

  const children = root.children.flatMap((child) => {
    return buildTreeRows(child, depth + 1, effectiveHidden);
  });

  return [row, ...children];
}
