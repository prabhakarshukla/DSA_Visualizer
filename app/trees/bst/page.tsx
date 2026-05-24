"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, PlayCircle, RotateCcw, Search } from "lucide-react";
import { useMemo, useRef, useState } from "react";

type TraversalType = "inorder" | "preorder" | "postorder" | "levelorder";
type OperationKey = TraversalType | "insert" | "delete" | "search" | "reset" | "idle";
type Status = "idle" | "running" | "paused" | "completed";

type BstNode = {
  id: number;
  value: number;
  left: BstNode | null;
  right: BstNode | null;
};

type ExplanationData = {
  operation: string;
  concept: string;
  steps: string[];
  finalBst: string;
  timeComplexity: string;
  examNote: string;
};

const baseTraversalDelay = 900;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const pseudocodeMap: Record<OperationKey, string[]> = {
  insert: [
    "if root == NULL: return newNode",
    "if value < root.value: root.left = insert(left)",
    "else if value > root.value: root.right = insert(right)",
    "else: duplicate not inserted",
  ],
  delete: [
    "find node to delete",
    "if leaf: remove directly",
    "if one child: connect child to parent",
    "if two children: replace with inorder successor",
  ],
  search: [
    "if value < root: move left",
    "else if value > root: move right",
    "else: value found",
  ],
  inorder: ["traverse(left)", "visit(root)", "traverse(right)"],
  preorder: ["visit(root)", "traverse(left)", "traverse(right)"],
  postorder: ["traverse(left)", "traverse(right)", "visit(root)"],
  levelorder: ["queue = [root]", "while queue:", "  node = pop_front(queue)", "  visit(node)", "  push children"],
  reset: ["restore default BST", "clear highlights", "clear inputs"],
  idle: ["Select operation to view BST pseudocode."],
};

const createDefaultTree = (): BstNode => ({
  id: 1,
  value: 10,
  left: {
    id: 2,
    value: 5,
    left: { id: 4, value: 2, left: null, right: null },
    right: { id: 5, value: 8, left: null, right: null },
  },
  right: {
    id: 3,
    value: 20,
    left: null,
    right: { id: 6, value: 30, left: null, right: null },
  },
});

const serializeBst = (root: BstNode | null) => {
  if (!root) return "EMPTY";
  const arr: string[] = [];
  const queue: BstNode[] = [root];
  while (queue.length > 0) {
    const node = queue.shift()!;
    arr.push(node.value.toString());
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
  return arr.join(" -> ");
};

export default function BstPage() {
  const idCounter = useRef(100);
  const [root, setRoot] = useState<BstNode | null>(createDefaultTree());
  const [valueInput, setValueInput] = useState("");
  const [activeOperation, setActiveOperation] = useState<OperationKey>("idle");
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [comparisonLog, setComparisonLog] = useState<string[]>([]);
  const [traversalOrder, setTraversalOrder] = useState("-");
  const [visitedOrder, setVisitedOrder] = useState<number[]>([]);
  const [traversalStatus, setTraversalStatus] = useState<Status>("idle");
  const [activeTraversalType, setActiveTraversalType] = useState<TraversalType | null>(null);
  const [activeTraversalIds, setActiveTraversalIds] = useState<number[]>([]);
  const [traversalStep, setTraversalStep] = useState(0);
  const [traversalSpeed, setTraversalSpeed] = useState(1);
  const [isStepMode, setIsStepMode] = useState(false);
  const [showNotFound, setShowNotFound] = useState(false);

  const [explanation, setExplanation] = useState<ExplanationData>({
    operation: "Overview",
    concept: "BST me har node ke liye rule fixed hota hai: left subtree < root < right subtree.",
    steps: [
      "Insert aur Search decision comparisons se guided hote hain.",
      "Unnecessary subtree skip hone se average case me fast operations milte hain.",
      "Inorder traversal sorted sequence deta hai.",
    ],
    finalBst: serializeBst(createDefaultTree()),
    timeComplexity: "Average O(log n)",
    examNote: "Balanced BSTs fast queries ke liye use hote hain; skewed tree me O(n) ho sakta hai.",
  });

  const traversalTokenRef = useRef(0);
  const pauseRef = useRef(false);
  const pseudocode = useMemo(() => pseudocodeMap[activeOperation], [activeOperation]);

  const visual = useMemo(() => {
    if (!root) {
      return {
        nodes: [] as Array<{ id: number; value: number; x: number; y: number }>,
        edges: [] as Array<{ key: string; x1: number; y1: number; x2: number; y2: number }>,
        depth: 0,
      };
    }

    const nodes: Array<{ id: number; value: number; x: number; y: number }> = [];
    const edges: Array<{ key: string; x1: number; y1: number; x2: number; y2: number }> = [];
    let maxDepth = 0;

    const walk = (node: BstNode, depth: number, left: number, right: number, parent?: { x: number; y: number; id: number }) => {
      const x = (left + right) / 2;
      const y = 14 + depth * 20;
      nodes.push({ id: node.id, value: node.value, x, y });
      maxDepth = Math.max(maxDepth, depth);
      if (parent) {
        edges.push({ key: `${parent.id}-${node.id}`, x1: parent.x, y1: parent.y, x2: x, y2: y });
      }
      if (node.left) walk(node.left, depth + 1, left, x, { x, y, id: node.id });
      if (node.right) walk(node.right, depth + 1, x, right, { x, y, id: node.id });
    };

    walk(root, 0, 0, 100);
    return { nodes, edges, depth: maxDepth };
  }, [root]);

  const treeHeight = 130 + visual.depth * 36;

  const setValidationExplanation = (operation: OperationKey, message: string) => {
    setExplanation({
      operation: `${operation.toUpperCase()} (Validation)`,
      concept: message,
      steps: [
        "Operation se pehle input aur tree state validate ki gayi.",
        "Invalid case detect hua to tree ko unchanged rakha gaya.",
        "Valid value ke saath operation dubara try karo.",
      ],
      finalBst: serializeBst(root),
      timeComplexity: "O(1)",
      examNote: "Validation boundary cases ko safe banata hai.",
    });
  };

  const clearTraversalPlayback = () => {
    traversalTokenRef.current += 1;
    pauseRef.current = false;
    setTraversalStatus("idle");
    setActiveTraversalType(null);
    setActiveTraversalIds([]);
    setTraversalStep(0);
    setVisitedOrder([]);
    setTraversalOrder("-");
  };

  const parseInputValue = () => {
    const value = Number(valueInput.trim());
    if (!Number.isFinite(value)) return null;
    return value;
  };

  const collectTraversalIds = (node: BstNode | null, type: TraversalType, out: number[]) => {
    if (!node) return;
    if (type === "preorder") out.push(node.id);
    collectTraversalIds(node.left, type, out);
    if (type === "inorder") out.push(node.id);
    collectTraversalIds(node.right, type, out);
    if (type === "postorder") out.push(node.id);
  };

  const collectLevelOrderIds = (node: BstNode | null) => {
    const out: number[] = [];
    if (!node) return out;
    const q: BstNode[] = [node];
    while (q.length) {
      const current = q.shift()!;
      out.push(current.id);
      if (current.left) q.push(current.left);
      if (current.right) q.push(current.right);
    }
    return out;
  };

  const getNodeById = (node: BstNode | null, id: number): BstNode | null => {
    if (!node) return null;
    if (node.id === id) return node;
    return getNodeById(node.left, id) ?? getNodeById(node.right, id);
  };

  const getTraversalIds = (type: TraversalType, node: BstNode | null) => {
    if (!node) return [];
    if (type === "levelorder") return collectLevelOrderIds(node);
    const out: number[] = [];
    collectTraversalIds(node, type, out);
    return out;
  };

  const playTraversal = async (type: TraversalType, ids: number[], startStep: number, token: number) => {
    setTraversalStatus("running");
    for (let i = startStep; i < ids.length; i += 1) {
      if (traversalTokenRef.current !== token) return;
      while (pauseRef.current) {
        if (traversalTokenRef.current !== token) return;
        await sleep(40);
      }
      const id = ids[i];
      const node = getNodeById(root, id);
      if (!node) continue;
      setHighlightId(id);
      setTraversalStep(i + 1);
      setVisitedOrder((prev) => (prev.length > i ? prev : [...prev, node.value]));
      const totalDelay = baseTraversalDelay / traversalSpeed;
      let elapsed = 0;
      while (elapsed < totalDelay) {
        if (traversalTokenRef.current !== token) return;
        if (pauseRef.current) break;
        await sleep(40);
        elapsed += 40;
      }
      if (pauseRef.current) i -= 1;
    }
    setTraversalStatus("completed");
  };

  const runTraversal = async (type: TraversalType) => {
    setActiveOperation(type);
    setShowNotFound(false);
    setComparisonLog([]);
    if (!root) {
      setValidationExplanation(type, "BST empty hai. Traversal run nahi ho sakta.");
      return;
    }
    const ids = getTraversalIds(type, root);
    const values = ids.map((id) => getNodeById(root, id)?.value ?? 0);
    setActiveTraversalType(type);
    setActiveTraversalIds(ids);
    setTraversalStep(0);
    setVisitedOrder([]);
    setTraversalOrder(values.join(" -> "));
    setHighlightId(null);
    const token = traversalTokenRef.current + 1;
    traversalTokenRef.current = token;
    pauseRef.current = isStepMode;
    setTraversalStatus(isStepMode ? "paused" : "running");

    const labels: Record<TraversalType, string> = {
      inorder: "Inorder Traversal",
      preorder: "Preorder Traversal",
      postorder: "Postorder Traversal",
      levelorder: "Level Order Traversal",
    };
    const concepts: Record<TraversalType, string> = {
      inorder: "Inorder (Left -> Root -> Right) BST me sorted output deta hai.",
      preorder: "Preorder (Root -> Left -> Right) tree reconstruction me useful hota hai.",
      postorder: "Postorder (Left -> Right -> Root) deletion-style problems me helpful hota hai.",
      levelorder: "Level Order traversal breadth-first style me nodes ko level wise visit karta hai.",
    };
    setExplanation({
      operation: labels[type],
      concept: concepts[type],
      steps: ["Traversal root se start hui.", `${labels[type]} rule apply hua step-by-step.`, `Visit order: ${values.join(" -> ")}`],
      finalBst: serializeBst(root),
      timeComplexity: "O(n)",
      examNote: "BST me inorder output sorted aata hai, jo interview me frequently asked point hai.",
    });
    if (!isStepMode) await playTraversal(type, ids, 0, token);
  };

  const pauseTraversal = () => {
    if (traversalStatus !== "running") return;
    pauseRef.current = true;
    setTraversalStatus("paused");
  };

  const resumeTraversal = async () => {
    if (isStepMode || traversalStatus !== "paused" || !activeTraversalType || !root) return;
    pauseRef.current = false;
    const token = traversalTokenRef.current;
    await playTraversal(activeTraversalType, activeTraversalIds, traversalStep, token);
  };

  const restartTraversal = async () => {
    if (!activeTraversalType || !root) return;
    traversalTokenRef.current += 1;
    setHighlightId(null);
    setVisitedOrder([]);
    setTraversalStep(0);
    pauseRef.current = false;
    await runTraversal(activeTraversalType);
  };

  const nextStepTraversal = () => {
    if (!isStepMode || activeTraversalIds.length === 0 || traversalStatus === "completed" || !root) return;
    const id = activeTraversalIds[traversalStep];
    const node = getNodeById(root, id);
    if (!node) return;
    setHighlightId(id);
    setVisitedOrder((prev) => [...prev, node.value]);
    const next = traversalStep + 1;
    setTraversalStep(next);
    setTraversalStatus(next >= activeTraversalIds.length ? "completed" : "paused");
  };

  const insertRec = (node: BstNode | null, value: number, log: string[]): { next: BstNode; inserted: boolean } => {
    if (!node) return { next: { id: idCounter.current++, value, left: null, right: null }, inserted: true };
    if (value < node.value) {
      log.push(`${value} < ${node.value} -> moving LEFT`);
      const result = insertRec(node.left, value, log);
      return { next: { ...node, left: result.next }, inserted: result.inserted };
    }
    if (value > node.value) {
      log.push(`${value} > ${node.value} -> moving RIGHT`);
      const result = insertRec(node.right, value, log);
      return { next: { ...node, right: result.next }, inserted: result.inserted };
    }
    log.push(`${value} == ${node.value} -> duplicate, insert skipped`);
    return { next: { ...node }, inserted: false };
  };

  const searchPath = async (value: number, node: BstNode | null) => {
    const logs: string[] = [];
    let current = node;
    while (current) {
      setHighlightId(current.id);
      if (value < current.value) {
        logs.push(`${value} < ${current.value} -> moving LEFT`);
        setComparisonLog([...logs]);
        await sleep(500);
        current = current.left;
      } else if (value > current.value) {
        logs.push(`${value} > ${current.value} -> moving RIGHT`);
        setComparisonLog([...logs]);
        await sleep(500);
        current = current.right;
      } else {
        logs.push(`${value} FOUND`);
        setComparisonLog([...logs]);
        return { found: true, logs };
      }
    }
    logs.push(`${value} NOT FOUND`);
    setComparisonLog([...logs]);
    return { found: false, logs };
  };

  const minNode = (node: BstNode): BstNode => {
    let current = node;
    while (current.left) current = current.left;
    return current;
  };

  const deleteRec = (node: BstNode | null, value: number, notes: string[]): { next: BstNode | null; deleted: boolean } => {
    if (!node) return { next: null, deleted: false };
    if (value < node.value) {
      notes.push(`${value} < ${node.value} -> move LEFT`);
      const res = deleteRec(node.left, value, notes);
      return { next: { ...node, left: res.next }, deleted: res.deleted };
    }
    if (value > node.value) {
      notes.push(`${value} > ${node.value} -> move RIGHT`);
      const res = deleteRec(node.right, value, notes);
      return { next: { ...node, right: res.next }, deleted: res.deleted };
    }
    notes.push(`Node ${value} matched for deletion`);
    if (!node.left && !node.right) {
      notes.push("Leaf node case -> direct remove");
      return { next: null, deleted: true };
    }
    if (!node.left || !node.right) {
      notes.push("Single child case -> child promoted");
      return { next: node.left ?? node.right, deleted: true };
    }
    const successor = minNode(node.right);
    notes.push(`Two children case -> inorder successor ${successor.value} selected`);
    const rightDeleted = deleteRec(node.right, successor.value, notes);
    return { next: { ...node, value: successor.value, right: rightDeleted.next }, deleted: true };
  };

  const handleInsert = async () => {
    setActiveOperation("insert");
    setShowNotFound(false);
    clearTraversalPlayback();
    const value = parseInputValue();
    if (value === null) {
      setValidationExplanation("insert", "Please enter a valid numeric value first.");
      return;
    }
    const logs: string[] = [];
    if (root) await searchPath(value, root);
    const result = insertRec(root, value, logs);
    setRoot(result.next);
    setComparisonLog(logs);
    setExplanation({
      operation: "Insert Node",
      concept: "BST insertion me comparisons se correct position locate hoti hai: left chhota, right bada.",
      steps: logs.length > 0 ? logs : [result.inserted ? `Node ${value} inserted.` : `Node ${value} duplicate tha, insert skip hua.`],
      finalBst: serializeBst(result.next),
      timeComplexity: "Average O(log n)",
      examNote: "Balanced BST me insert fast hota hai, skewed case me O(n) ho sakta hai.",
    });
  };

  const handleSearch = async () => {
    setActiveOperation("search");
    setShowNotFound(false);
    clearTraversalPlayback();
    const value = parseInputValue();
    if (value === null) {
      setValidationExplanation("search", "Please enter a valid numeric value first.");
      return;
    }
    const result = await searchPath(value, root);
    if (!result.found) setShowNotFound(true);
    setExplanation({
      operation: "Search Node",
      concept: "BST property use karke unnecessary subtree skip hota hai, isliye search efficient hoti hai.",
      steps: result.logs,
      finalBst: serializeBst(root),
      timeComplexity: "Average O(log n)",
      examNote: "BST search me har step me comparison based branching hoti hai.",
    });
  };

  const handleDelete = async () => {
    setActiveOperation("delete");
    setShowNotFound(false);
    clearTraversalPlayback();
    const value = parseInputValue();
    if (value === null) {
      setValidationExplanation("delete", "Please enter a valid numeric value first.");
      return;
    }
    const notes: string[] = [];
    const result = deleteRec(root, value, notes);
    setComparisonLog(notes);
    if (!result.deleted) {
      setShowNotFound(true);
      setExplanation({
        operation: "Delete Node",
        concept: "Delete ke liye pehle target node find karna zaroori hota hai.",
        steps: [...notes, `Node ${value} tree me nahi mila.`],
        finalBst: serializeBst(root),
        timeComplexity: "Average O(log n)",
        examNote: "Deletion path bhi search jaisa comparisons use karta hai.",
      });
      return;
    }
    setRoot(result.next);
    await sleep(200);
    setExplanation({
      operation: "Delete Node",
      concept: "Delete case node ke children count par depend karta hai; two-child case me inorder successor use hota hai.",
      steps: notes,
      finalBst: serializeBst(result.next),
      timeComplexity: "Average O(log n)",
      examNote: "Two-child delete me successor replacement interview ka common pattern hai.",
    });
  };

  const handleReset = () => {
    setActiveOperation("reset");
    const next = createDefaultTree();
    setRoot(next);
    setValueInput("");
    setHighlightId(null);
    setComparisonLog([]);
    setShowNotFound(false);
    clearTraversalPlayback();
    setExplanation({
      operation: "Reset Tree",
      concept: "BST default structure par restore hoti hai aur learning state clean reset hoti hai.",
      steps: ["Default BST nodes restore hue.", "Traversal playback aur highlights clear hue.", "Input field reset hui."],
      finalBst: serializeBst(next),
      timeComplexity: "O(n)",
      examNote: "Reset se same scenarios ko repeat karke concept strong banta hai.",
    });
  };

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <Link href="/trees" className="text-blue-700 hover:text-blue-800">&larr; Back to Trees overview</Link>
          <Link href="/" className="text-blue-700 hover:text-blue-800">Back to homepage</Link>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Binary Search Tree Visualizer</h1>
          <p className="mt-3 max-w-3xl text-slate-600">BST me rule fixed hota hai: Left subtree &lt; Root &lt; Right subtree. Comparisons dekhkar search/insert/delete samjho.</p>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
            <input type="number" value={valueInput} onChange={(e) => setValueInput(e.target.value)} placeholder="Enter node value" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none ring-cyan-300 transition focus:ring" />
            <button onClick={handleReset} className="inline-flex items-center justify-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2.5 text-sm font-medium text-cyan-700 hover:bg-cyan-100"><RotateCcw className="h-4 w-4" />Reset Tree</button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button onClick={() => void handleInsert()} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">Insert Node</button>
            <button onClick={() => void handleDelete()} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Delete Node</button>
            <button onClick={() => void handleSearch()} className="inline-flex items-center justify-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"><Search className="h-4 w-4" />Search Node</button>
            <button onClick={handleReset} className="inline-flex items-center justify-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-700 hover:bg-cyan-100"><RotateCcw className="h-4 w-4" />Reset Tree</button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button onClick={() => void runTraversal("inorder")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Inorder</button>
            <button onClick={() => void runTraversal("preorder")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Preorder</button>
            <button onClick={() => void runTraversal("postorder")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Postorder</button>
            <button onClick={() => void runTraversal("levelorder")} className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><PlayCircle className="h-4 w-4" />Level Order</button>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Traversal Controls</p>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Traversal Speed ({traversalSpeed.toFixed(2)}x)</label>
                <input type="range" min="0.25" max="2" step="0.25" value={traversalSpeed} onChange={(e) => setTraversalSpeed(Number(e.target.value))} className="mt-2 w-full accent-cyan-600" />
                <div className="mt-2 flex gap-2">
                  <button onClick={() => setTraversalSpeed(0.5)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">Slow</button>
                  <button onClick={() => setTraversalSpeed(1)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">Normal</button>
                  <button onClick={() => setTraversalSpeed(1.75)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">Fast</button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Playback</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button onClick={pauseTraversal} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">Pause</button>
                  <button onClick={() => void resumeTraversal()} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">Resume</button>
                  <button onClick={() => void restartTraversal()} className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-700">Restart Traversal</button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <input id="bst-stepmode" type="checkbox" checked={isStepMode} onChange={(e) => setIsStepMode(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-cyan-600" />
                  <label htmlFor="bst-stepmode" className="font-medium">Step-by-Step mode</label>
                  <button onClick={nextStepTraversal} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">Next Step</button>
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 text-xs font-medium sm:grid-cols-3">
              <span className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-blue-700">Status: {traversalStatus === "idle" ? "Idle" : traversalStatus === "running" ? "Running" : traversalStatus === "paused" ? "Paused" : "Completed"}</span>
              <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-emerald-700">Step {Math.min(traversalStep, activeTraversalIds.length)} / {activeTraversalIds.length || 0}</span>
              <span className="rounded-lg border border-cyan-200 bg-cyan-50 px-2 py-1.5 text-cyan-700">Visited: {visitedOrder.length === 0 ? "-" : visitedOrder.join(" -> ")}</span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <h2 className="text-lg font-semibold text-slate-900">BST Visual</h2>
            <p className="mt-1 text-xs font-medium text-blue-700">Traversal output: {traversalOrder}</p>
            <p className="mt-1 text-xs font-medium text-emerald-700">Current visited node: {highlightId ? getNodeById(root, highlightId)?.value ?? "-" : "-"}</p>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <AnimatePresence>
                {showNotFound && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-3 flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">
                    <AlertTriangle className="h-4 w-4" />Value not found in BST.
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">BST Decision Path</p>
                <ul className="mt-1 space-y-1 text-sm text-blue-800">
                  {comparisonLog.length === 0 ? <li>-</li> : comparisonLog.map((line) => <li key={line}>{line}</li>)}
                </ul>
              </div>
              <div className="relative w-full overflow-x-auto" style={{ minHeight: `${treeHeight}px` }}>
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {visual.edges.map((edge) => (
                    <motion.line key={edge.key} x1={edge.x1} y1={edge.y1 + 2} x2={edge.x2} y2={edge.y2 - 2} stroke="#94a3b8" strokeWidth="0.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35 }} />
                  ))}
                </svg>
                {visual.nodes.map((node) => (
                  <motion.div key={node.id} layout initial={{ opacity: 0, scale: 0.86 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.82 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${node.x}%`, top: `${node.y}%` }}>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-bold shadow-sm ${highlightId === node.id ? "border-emerald-400 bg-emerald-100 text-emerald-800" : "border-cyan-200 bg-cyan-50 text-slate-800"}`}>{node.value}</div>
                  </motion.div>
                ))}
                {visual.nodes.length === 0 && <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-slate-500">BST is empty</div>}
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800">Key Concept</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-emerald-700">
                <li>BST sorted ordering maintain karta hai.</li>
                <li>Left subtree &lt; Root &lt; Right subtree.</li>
                <li>Inorder traversal sorted sequence deta hai.</li>
                <li>Average search complexity O(log n) hoti hai.</li>
              </ul>
            </div>
            <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-800">Binary Tree vs BST</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-blue-700">
                <li>Binary Tree me ordering rule mandatory nahi hota; BST me strict ordering hoti hai.</li>
                <li>BST search average me faster hoti hai due to subtree skipping.</li>
                <li>BST ka inorder traversal sorted output deta hai.</li>
              </ul>
            </div>
            <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
              <p className="text-sm font-semibold text-cyan-800">Real-world Use Cases</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-cyan-700">
                <li>Databases</li>
                <li>Search systems</li>
                <li>Dictionaries</li>
                <li>File indexing</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
              <h3 className="text-lg font-semibold text-slate-900">Step Explanation</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Operation</p><p className="mt-1 font-medium text-slate-800">{explanation.operation}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Concept</p><p className="mt-1 leading-6 text-slate-700">{explanation.concept}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step-by-step process</p><ul className="mt-1 list-disc space-y-1 pl-5 text-slate-700">{explanation.steps.map((step) => (<li key={step}>{step}</li>))}</ul></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Final BST</p><p className="mt-1 font-mono text-slate-800">{explanation.finalBst}</p></div>
                <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Time complexity</p><span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{explanation.timeComplexity}</span></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Exam note</p><p className="mt-1 leading-6 text-slate-700">{explanation.examNote}</p></div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.2)]">
              <h3 className="text-lg font-semibold text-cyan-200">Pseudocode</h3>
              <div className="mt-3 space-y-1 font-mono text-sm leading-6 text-slate-100/95">
                {pseudocode.map((line, idx) => (<p key={`${line}-${idx}`}>{line}</p>))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
