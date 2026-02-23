export type NodeTextRange = {
  id: string;
  start: number;
  end: number;
};

export type NodeRangeIndex = {
  rangesById: Map<string, NodeTextRange[]>;
  allRanges: NodeTextRange[];
};

type OpenTag = {
  id: string;
  tag: string;
  start: number;
};

const TAG_PATTERN =
  /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>|<!DOCTYPE[\s\S]*?>|<\/?[^>]+?>/g;

const ID_PATTERN = /\b(?:id|data-node-id)\s*=\s*(?:"([^"]*)"|'([^']*)')/;
const OPEN_TAG_PATTERN = /^<\s*([A-Za-z_][\w:.-]*)/;
const CLOSE_TAG_PATTERN = /^<\s*\/\s*([A-Za-z_][\w:.-]*)/;

function readTagName(token: string, closing: boolean): string | null {
  const pattern = closing ? CLOSE_TAG_PATTERN : OPEN_TAG_PATTERN;
  const match = token.match(pattern);

  if (!match || !match[1]) {
    return null;
  }

  return match[1].toLowerCase();
}

function readNodeId(token: string): string | null {
  const match = token.match(ID_PATTERN);

  if (!match) {
    return null;
  }

  const id = match[1] ?? match[2] ?? "";
  const normalized = id.trim();

  return normalized.length > 0 ? normalized : null;
}

export function buildNodeRangeIndex(svgText: string): NodeRangeIndex {
  const stack: OpenTag[] = [];
  const allRanges: NodeTextRange[] = [];
  let match: RegExpExecArray | null;

  while ((match = TAG_PATTERN.exec(svgText)) !== null) {
    const token = match[0];
    const start = match.index;
    const end = start + token.length;

    if (token.startsWith("<!--") || token.startsWith("<?") ||
      token.startsWith("<!")) {
      continue;
    }

    const isClosing = token.startsWith("</");

    if (isClosing) {
      const tagName = readTagName(token, true);

      if (!tagName) {
        continue;
      }

      for (let i = stack.length - 1; i >= 0; i -= 1) {
        const open = stack[i];

        if (open && open.tag === tagName) {
          stack.splice(i, 1);
          allRanges.push({
            id: open.id,
            start: open.start,
            end
          });
          break;
        }
      }

      continue;
    }

    const tagName = readTagName(token, false);

    if (!tagName) {
      continue;
    }

    const id = readNodeId(token);
    const selfClosing = /\/\s*>$/.test(token);

    if (!id) {
      continue;
    }

    if (selfClosing) {
      allRanges.push({ id, start, end });
      continue;
    }

    stack.push({ id, tag: tagName, start });
  }

  for (const open of stack) {
    allRanges.push({
      id: open.id,
      start: open.start,
      end: svgText.length
    });
  }

  allRanges.sort((a, b) => {
    if (a.start !== b.start) {
      return a.start - b.start;
    }

    return a.end - b.end;
  });

  const rangesById = new Map<string, NodeTextRange[]>();

  for (const range of allRanges) {
    const current = rangesById.get(range.id);

    if (current) {
      current.push(range);
      continue;
    }

    rangesById.set(range.id, [range]);
  }

  return {
    rangesById,
    allRanges
  };
}

export function findPrimaryRange(
  index: NodeRangeIndex,
  nodeId: string
): NodeTextRange | null {
  const ranges = index.rangesById.get(nodeId);

  if (!ranges || ranges.length === 0) {
    return null;
  }

  return ranges[0] ?? null;
}

export function findNodeIdAtPosition(
  index: NodeRangeIndex,
  position: number
): string | null {
  let candidate: NodeTextRange | null = null;

  for (const range of index.allRanges) {
    const inRange = position >= range.start && position <= range.end;

    if (!inRange) {
      continue;
    }

    if (!candidate) {
      candidate = range;
      continue;
    }

    const candidateSpan = candidate.end - candidate.start;
    const rangeSpan = range.end - range.start;

    if (rangeSpan <= candidateSpan) {
      candidate = range;
    }
  }

  return candidate ? candidate.id : null;
}
