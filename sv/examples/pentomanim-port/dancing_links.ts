export class Node {
  readonly name: string;
  left: Node;
  right: Node;

  constructor(name: string) {
    this.name = name;
    this.left = this;
    this.right = this;
  }
}

export function insertAfter(anchor: Node, node: Node): void {
  const right = anchor.right;
  node.left = anchor;
  node.right = right;
  anchor.right = node;
  right.left = node;
}

export function remove(node: Node): void {
  node.left.right = node.right;
  node.right.left = node.left;
}

export function restore(node: Node): void {
  node.left.right = node;
  node.right.left = node;
}

export function ringValues(head: Node): string[] {
  const values = [head.name];
  let cur = head.right;
  while (cur !== head) {
    values.push(cur.name);
    cur = cur.right;
  }
  return values;
}

export function buildRing(names: readonly string[]): Node {
  if (names.length < 1) {
    throw new Error("names must contain at least one item");
  }
  const head = new Node(names[0]);
  for (const name of names.slice(1)) {
    insertAfter(head.left, new Node(name));
  }
  return head;
}

export function findByName(head: Node, target: string): Node {
  let cur = head;
  while (true) {
    if (cur.name === target) {
      return cur;
    }
    cur = cur.right;
    if (cur === head) {
      break;
    }
  }
  throw new Error(`node '${target}' not found`);
}

export type DemoEvent = {
  op: "start" | "remove" | "restore";
  target?: string;
  ring: readonly string[];
};

export function runDemo(): DemoEvent[] {
  const head = buildRing(["H", "1", "2", "3", "4"]);
  const events: DemoEvent[] = [{ op: "start", ring: ringValues(head) }];

  const n3 = findByName(head, "3");
  remove(n3);
  events.push({ op: "remove", target: "3", ring: ringValues(head) });

  const n2 = findByName(head, "2");
  remove(n2);
  events.push({ op: "remove", target: "2", ring: ringValues(head) });

  restore(n2);
  events.push({ op: "restore", target: "2", ring: ringValues(head) });

  restore(n3);
  events.push({ op: "restore", target: "3", ring: ringValues(head) });

  return events;
}

function main(): void {
  const events = runDemo();
  for (const event of events) {
    if (event.op === "start") {
      console.log("start      ", event.ring);
      continue;
    }
    console.log(`${event.op}(${event.target})`.padEnd(12), event.ring);
  }
}

if (import.meta.main) {
  main();
}
