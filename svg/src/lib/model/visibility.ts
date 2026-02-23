const ELEMENT_NODE = 1;

function isElementNode(node: Node): node is Element {
  return node.nodeType === ELEMENT_NODE;
}

function matchesNodeId(el: Element, nodeId: string): boolean {
  const id = el.getAttribute("id");
  const dataNodeId = el.getAttribute("data-node-id");

  return id === nodeId || dataNodeId === nodeId;
}

function findElementByNodeId(root: Element, nodeId: string): Element | null {
  if (matchesNodeId(root, nodeId)) {
    return root;
  }

  const descendants = root.getElementsByTagName("*");

  for (let i = 0; i < descendants.length; i += 1) {
    const candidate = descendants.item(i);

    if (candidate && matchesNodeId(candidate, nodeId)) {
      return candidate;
    }
  }

  return null;
}

function hasDisplayNoneInStyle(el: Element): boolean {
  const style = el.getAttribute("style") ?? "";
  const normalized = style.replace(/\s+/g, "").toLowerCase();

  return normalized.includes("display:none");
}

export function isNodeHiddenInSvg(svgText: string, nodeId: string): boolean {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const root = doc.documentElement;

  if (!isElementNode(root)) {
    return false;
  }

  const node = findElementByNodeId(root, nodeId);

  if (!node) {
    return false;
  }

  const displayAttr = node.getAttribute("display")?.trim().toLowerCase();

  return displayAttr === "none" || hasDisplayNoneInStyle(node);
}

export function setNodeHiddenInSvg(
  svgText: string,
  nodeId: string,
  hidden: boolean
): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const root = doc.documentElement;

  if (!isElementNode(root)) {
    return svgText;
  }

  const node = findElementByNodeId(root, nodeId);

  if (!node) {
    return svgText;
  }

  if (hidden) {
    node.setAttribute("display", "none");
  } else {
    node.removeAttribute("display");
  }

  const serializer = new XMLSerializer();

  return serializer.serializeToString(doc) + "\n";
}
