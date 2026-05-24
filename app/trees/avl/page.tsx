"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, PlayCircle, RotateCcw, Search } from "lucide-react";
import { useMemo, useRef, useState } from "react";

type TraversalType = "inorder" | "preorder" | "postorder" | "levelorder";
type OperationKey = TraversalType | "insert" | "delete" | "search" | "reset" | "idle";
type Status = "idle" | "running" | "paused" | "completed";

type AvlNode = {
  id: number;
  value: number;
  height: number;
  left: AvlNode | null;
  right: AvlNode | null;
};

type ExplanationData = {
  operation: string;
  concept: string;
  steps: string[];
  rotationExplanation: string;
  finalTree: string;
  timeComplexity: string;
  examNote: string;
};

type OpMeta = {
  steps: string[];
  rotations: string[];
  unbalancedIds: number[];
};

const baseTraversalDelay = 900;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const pseudocodeMap: Record<OperationKey, string[]> = {
  insert: [
    "BST insert(value)",
    "update height(node)",
    "BF = height(left) - height(right)",
    "if BF > 1 or BF < -1: apply rotation",
  ],
  delete: [
    "BST delete(value)",
    "update height(node)",
    "check BF after deletion",
    "rebalance with LL / RR / LR / RL rotation",
  ],
  search: ["if value < root: move left", "else if value > root: move right", "else: found"],
  inorder: ["traverse(left)", "visit(root)", "traverse(right)"],
  preorder: ["visit(root)", "traverse(left)", "traverse(right)"],
  postorder: ["traverse(left)", "traverse(right)", "visit(root)"],
  levelorder: ["queue = [root]", "while queue:", "  visit(node)", "  push children"],
  reset: ["restore default AVL", "clear highlights", "clear traversal states"],
  idle: ["Select operation to view AVL pseudocode."],
};

const createDefaultTree = (): AvlNode => ({
  id: 1,
  value: 20,
  height: 2,
  left: { id: 2, value: 10, height: 1, left: null, right: null },
  right: { id: 3, value: 30, height: 1, left: null, right: null },
});

const getHeight = (node: AvlNode | null) => (node ? node.height : 0);
const getBalance = (node: AvlNode | null) => (node ? getHeight(node.left) - getHeight(node.right) : 0);
const updateNode = (node: AvlNode): AvlNode => ({ ...node, height: 1 + Math.max(getHeight(node.left), getHeight(node.right)) });

const serializeTree = (root: AvlNode | null) => {
  if (!root) return "EMPTY";
  const q: AvlNode[] = [root];
  const out: string[] = [];
  while (q.length) {
    const n = q.shift()!;
    out.push(n.value.toString());
    if (n.left) q.push(n.left);
    if (n.right) q.push(n.right);
  }
  return out.join(" -> ");
};

const isBalancedTree = (node: AvlNode | null): boolean => {
  if (!node) return true;
  const bf = Math.abs(getBalance(node));
  return bf <= 1 && isBalancedTree(node.left) && isBalancedTree(node.right);
};

const countNodes = (node: AvlNode | null): number => (node ? 1 + countNodes(node.left) + countNodes(node.right) : 0);

export default function AvlPage() {
  const idRef = useRef(100);
  const [root, setRoot] = useState<AvlNode | null>(createDefaultTree());
  const [valueInput, setValueInput] = useState("");
  const [activeOperation, setActiveOperation] = useState<OperationKey>("idle");
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [unbalancedIds, setUnbalancedIds] = useState<number[]>([]);
  const [comparisonLog, setComparisonLog] = useState<string[]>([]);
  const [lastRotation, setLastRotation] = useState("None");
  const [showNotFound, setShowNotFound] = useState(false);

  const [traversalOrder, setTraversalOrder] = useState("-");
  const [visitedOrder, setVisitedOrder] = useState<number[]>([]);
  const [traversalStatus, setTraversalStatus] = useState<Status>("idle");
  const [activeTraversalType, setActiveTraversalType] = useState<TraversalType | null>(null);
  const [activeTraversalIds, setActiveTraversalIds] = useState<number[]>([]);
  const [traversalStep, setTraversalStep] = useState(0);
  const [traversalSpeed, setTraversalSpeed] = useState(1);
  const [isStepMode, setIsStepMode] = useState(false);

  const [explanation, setExplanation] = useState<ExplanationData>({
    operation: "Overview",
    concept: "AVL Tree self-balancing BST hota hai jaha har node ka balance factor -1, 0, +1 ke range me maintain kiya jata hai.",
    steps: [
      "BST insertion/deletion ke baad height update hoti hai.",
      "BF = height(left) - height(right) compute hota hai.",
      "Imbalance aane par LL/RR/LR/RL rotations apply hoti hain.",
    ],
    rotationExplanation: "No rotation yet.",
    finalTree: serializeTree(createDefaultTree()),
    timeComplexity: "O(log n)",
    examNote: "AVL balancing ki wajah se worst-case search/insert/delete O(log n) maintain rehta hai.",
  });

  const traversalTokenRef = useRef(0);
  const pauseRef = useRef(false);
  const pseudocode = useMemo(() => pseudocodeMap[activeOperation], [activeOperation]);

  const visual = useMemo(() => {
    if (!root) {
      return {
        nodes: [] as Array<{ id: number; value: number; height: number; bf: number; x: number; y: number }>,
        edges: [] as Array<{ key: string; x1: number; y1: number; x2: number; y2: number }>,
        depth: 0,
      };
    }

    const nodes: Array<{ id: number; value: number; height: number; bf: number; x: number; y: number }> = [];
    const edges: Array<{ key: string; x1: number; y1: number; x2: number; y2: number }> = [];
    let maxDepth = 0;

    const walk = (node: AvlNode, depth: number, left: number, right: number, parent?: { x: number; y: number; id: number }) => {
      const x = (left + right) / 2;
      const y = 12 + depth * 22;
      nodes.push({ id: node.id, value: node.value, height: node.height, bf: getBalance(node), x, y });
      maxDepth = Math.max(maxDepth, depth);
      if (parent) edges.push({ key: `${parent.id}-${node.id}`, x1: parent.x, y1: parent.y, x2: x, y2: y });
      if (node.left) walk(node.left, depth + 1, left, x, { x, y, id: node.id });
      if (node.right) walk(node.right, depth + 1, x, right, { x, y, id: node.id });
    };

    walk(root, 0, 0, 100);
    return { nodes, edges, depth: maxDepth };
  }, [root]);

  const treeHeight = 150 + visual.depth * 44;
  const treeInfo = useMemo(
    () => ({
      height: getHeight(root),
      balanced: isBalancedTree(root),
      count: countNodes(root),
    }),
    [root],
  );

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

  const nodeById = (node: AvlNode | null, id: number): AvlNode | null => {
    if (!node) return null;
    if (node.id === id) return node;
    return nodeById(node.left, id) ?? nodeById(node.right, id);
  };

  const rightRotate = (y: AvlNode, meta: OpMeta): AvlNode => {
    const x = y.left!;
    const t2 = x.right;
    const newY = updateNode({ ...y, left: t2 });
    const newX = updateNode({ ...x, right: newY });
    meta.steps.push(`Right rotation performed at ${y.value}.`);
    return newX;
  };

  const leftRotate = (x: AvlNode, meta: OpMeta): AvlNode => {
    const y = x.right!;
    const t2 = y.left;
    const newX = updateNode({ ...x, right: t2 });
    const newY = updateNode({ ...y, left: newX });
    meta.steps.push(`Left rotation performed at ${x.value}.`);
    return newY;
  };

  const rebalance = (node: AvlNode, insertedOrDeletedValue: number, meta: OpMeta): AvlNode => {
    const updated = updateNode(node);
    const bf = getBalance(updated);
    if (Math.abs(bf) > 1) {
      meta.unbalancedIds.push(updated.id);
      meta.steps.push(`Node ${updated.value} became unbalanced (BF=${bf}).`);
    }

    if (bf > 1 && insertedOrDeletedValue < (updated.left?.value ?? insertedOrDeletedValue)) {
      meta.rotations.push("LL Rotation Applied");
      meta.steps.push("LL case detected -> Right Rotation.");
      return rightRotate(updated, meta);
    }
    if (bf < -1 && insertedOrDeletedValue > (updated.right?.value ?? insertedOrDeletedValue)) {
      meta.rotations.push("RR Rotation Applied");
      meta.steps.push("RR case detected -> Left Rotation.");
      return leftRotate(updated, meta);
    }
    if (bf > 1 && insertedOrDeletedValue > (updated.left?.value ?? insertedOrDeletedValue)) {
      meta.rotations.push("LR Rotation Applied");
      meta.steps.push("LR case detected -> Left Rotation on left child, then Right Rotation.");
      const left = leftRotate(updated.left!, meta);
      return rightRotate({ ...updated, left }, meta);
    }
    if (bf < -1 && insertedOrDeletedValue < (updated.right?.value ?? insertedOrDeletedValue)) {
      meta.rotations.push("RL Rotation Applied");
      meta.steps.push("RL case detected -> Right Rotation on right child, then Left Rotation.");
      const right = rightRotate(updated.right!, meta);
      return leftRotate({ ...updated, right }, meta);
    }

    return updated;
  };

  const insertRec = (node: AvlNode | null, value: number, meta: OpMeta): { next: AvlNode; inserted: boolean } => {
    if (!node) {
      meta.steps.push(`Inserted ${value} at empty position.`);
      return { next: { id: idRef.current++, value, height: 1, left: null, right: null }, inserted: true };
    }
    if (value < node.value) {
      meta.steps.push(`${value} < ${node.value} -> moving LEFT`);
      const res = insertRec(node.left, value, meta);
      return { next: rebalance({ ...node, left: res.next }, value, meta), inserted: res.inserted };
    }
    if (value > node.value) {
      meta.steps.push(`${value} > ${node.value} -> moving RIGHT`);
      const res = insertRec(node.right, value, meta);
      return { next: rebalance({ ...node, right: res.next }, value, meta), inserted: res.inserted };
    }
    meta.steps.push(`${value} already exists -> duplicate skipped.`);
    return { next: node, inserted: false };
  };

  const minNode = (node: AvlNode): AvlNode => {
    let current = node;
    while (current.left) current = current.left;
    return current;
  };

  const deleteRec = (node: AvlNode | null, value: number, meta: OpMeta): { next: AvlNode | null; deleted: boolean } => {
    if (!node) return { next: null, deleted: false };

    if (value < node.value) {
      meta.steps.push(`${value} < ${node.value} -> moving LEFT`);
      const res = deleteRec(node.left, value, meta);
      if (!res.next && !res.deleted) return { next: node, deleted: false };
      return { next: rebalance({ ...node, left: res.next }, value, meta), deleted: res.deleted };
    }
    if (value > node.value) {
      meta.steps.push(`${value} > ${node.value} -> moving RIGHT`);
      const res = deleteRec(node.right, value, meta);
      if (!res.next && !res.deleted) return { next: node, deleted: false };
      return { next: rebalance({ ...node, right: res.next }, value, meta), deleted: res.deleted };
    }

    meta.steps.push(`Node ${value} matched for deletion.`);
    if (!node.left && !node.right) {
      meta.steps.push("Leaf node deleted directly.");
      return { next: null, deleted: true };
    }
    if (!node.left || !node.right) {
      meta.steps.push("Single child case -> child promoted.");
      return { next: node.left ?? node.right, deleted: true };
    }

    const successor = minNode(node.right);
    meta.steps.push(`Two-child case -> inorder successor ${successor.value} selected.`);
    const deletedSuccessor = deleteRec(node.right, successor.value, meta);
    const replaced = { ...node, value: successor.value, right: deletedSuccessor.next };
    return { next: rebalance(replaced, successor.value, meta), deleted: true };
  };

  const searchPath = async (value: number) => {
    const steps: string[] = [];
    let current = root;
    while (current) {
      setHighlightId(current.id);
      if (value < current.value) {
        steps.push(`${value} < ${current.value} -> LEFT`);
        setComparisonLog([...steps]);
        await sleep(460);
        current = current.left;
      } else if (value > current.value) {
        steps.push(`${value} > ${current.value} -> RIGHT`);
        setComparisonLog([...steps]);
        await sleep(460);
        current = current.right;
      } else {
        steps.push(`${value} FOUND`);
        setComparisonLog([...steps]);
        return { found: true, steps };
      }
    }
    steps.push(`${value} NOT FOUND`);
    setComparisonLog([...steps]);
    return { found: false, steps };
  };

  const collectTraversalIds = (node: AvlNode | null, type: TraversalType, out: number[]) => {
    if (!node) return;
    if (type === "preorder") out.push(node.id);
    collectTraversalIds(node.left, type, out);
    if (type === "inorder") out.push(node.id);
    collectTraversalIds(node.right, type, out);
    if (type === "postorder") out.push(node.id);
  };

  const collectLevelIds = (node: AvlNode | null) => {
    const out: number[] = [];
    if (!node) return out;
    const q: AvlNode[] = [node];
    while (q.length) {
      const n = q.shift()!;
      out.push(n.id);
      if (n.left) q.push(n.left);
      if (n.right) q.push(n.right);
    }
    return out;
  };

  const traversalIds = (type: TraversalType, node: AvlNode | null) => {
    if (!node) return [];
    if (type === "levelorder") return collectLevelIds(node);
    const out: number[] = [];
    collectTraversalIds(node, type, out);
    return out;
  };

  const playTraversal = async (ids: number[], start: number, token: number) => {
    setTraversalStatus("running");
    for (let i = start; i < ids.length; i += 1) {
      if (traversalTokenRef.current !== token) return;
      while (pauseRef.current) {
        if (traversalTokenRef.current !== token) return;
        await sleep(40);
      }
      const id = ids[i];
      const node = nodeById(root, id);
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
    setComparisonLog([]);
    setShowNotFound(false);
    if (!root) {
      setExplanation({
        operation: `${type.toUpperCase()} (Validation)`,
        concept: "AVL tree empty hai.",
        steps: ["Traversal ke liye nodes required hote hain.", "Tree currently empty hai.", "Pehle insert operation try karo."],
        rotationExplanation: "No rotation.",
        finalTree: "EMPTY",
        timeComplexity: "O(1)",
        examNote: "Empty tree edge case handle karna important hota hai.",
      });
      return;
    }

    const ids = traversalIds(type, root);
    const values = ids.map((id) => nodeById(root, id)?.value ?? 0);
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

    const label: Record<TraversalType, string> = {
      inorder: "Inorder Traversal",
      preorder: "Preorder Traversal",
      postorder: "Postorder Traversal",
      levelorder: "Level Order Traversal",
    };
    const concept: Record<TraversalType, string> = {
      inorder: "Inorder traversal me Left -> Root -> Right follow hota hai, AVL/BST me sorted output deta hai.",
      preorder: "Preorder traversal Root -> Left -> Right follow karta hai.",
      postorder: "Postorder traversal Left -> Right -> Root follow karta hai.",
      levelorder: "Level Order traversal breadth-first style me level-by-level nodes visit karta hai.",
    };

    setExplanation({
      operation: label[type],
      concept: concept[type],
      steps: ["Traversal root se start hui.", `${label[type]} sequence apply hua.`, `Visited order: ${values.join(" -> ")}`],
      rotationExplanation: "Traversal operation me rotation apply nahi hoti.",
      finalTree: serializeTree(root),
      timeComplexity: "O(n)",
      examNote: "Inorder output sorted hone ki wajah se AVL validation me useful hota hai.",
    });

    if (!isStepMode) await playTraversal(ids, 0, token);
  };

  const pauseTraversal = () => {
    if (traversalStatus !== "running") return;
    pauseRef.current = true;
    setTraversalStatus("paused");
  };

  const resumeTraversal = async () => {
    if (isStepMode || traversalStatus !== "paused") return;
    pauseRef.current = false;
    await playTraversal(activeTraversalIds, traversalStep, traversalTokenRef.current);
  };

  const restartTraversal = async () => {
    if (!activeTraversalType) return;
    traversalTokenRef.current += 1;
    setHighlightId(null);
    setVisitedOrder([]);
    setTraversalStep(0);
    pauseRef.current = false;
    await runTraversal(activeTraversalType);
  };

  const nextStep = () => {
    if (!isStepMode || traversalStatus === "completed" || !root) return;
    const id = activeTraversalIds[traversalStep];
    const node = nodeById(root, id);
    if (!node) return;
    setHighlightId(id);
    setVisitedOrder((prev) => [...prev, node.value]);
    const next = traversalStep + 1;
    setTraversalStep(next);
    setTraversalStatus(next >= activeTraversalIds.length ? "completed" : "paused");
  };

  const handleInsert = async () => {
    setActiveOperation("insert");
    setShowNotFound(false);
    clearTraversalPlayback();
    setUnbalancedIds([]);
    const value = parseInputValue();
    if (value === null) {
      setExplanation({
        operation: "INSERT (Validation)",
        concept: "Please enter a valid numeric value first.",
        steps: ["Input validate hua.", "Invalid number detect hua.", "Valid number enter karke retry karo."],
        rotationExplanation: "No rotation.",
        finalTree: serializeTree(root),
        timeComplexity: "O(1)",
        examNote: "Input validation invalid comparisons ko prevent karta hai.",
      });
      return;
    }

    await searchPath(value);
    const meta: OpMeta = { steps: [], rotations: [], unbalancedIds: [] };
    const res = insertRec(root, value, meta);
    setRoot(res.next);
    setComparisonLog(meta.steps);
    setUnbalancedIds(meta.unbalancedIds);
    const rotation = meta.rotations.length ? meta.rotations.join(", ") : "No rotation required";
    setLastRotation(meta.rotations[meta.rotations.length - 1] ?? "None");
    setExplanation({
      operation: "Insert Node",
      concept: "AVL insertion me pehle BST insertion hota hai, fir balance factor check karke required rotation apply hoti hai.",
      steps: meta.steps,
      rotationExplanation: rotation,
      finalTree: serializeTree(res.next),
      timeComplexity: "O(log n)",
      examNote: "AVL balancing ki wajah se insert worst-case me bhi efficient rehta hai.",
    });
  };

  const handleSearch = async () => {
    setActiveOperation("search");
    setShowNotFound(false);
    clearTraversalPlayback();
    setUnbalancedIds([]);
    const value = parseInputValue();
    if (value === null) {
      setExplanation({
        operation: "SEARCH (Validation)",
        concept: "Please enter a valid numeric value first.",
        steps: ["Input validate hua.", "Invalid number detect hua.", "Valid number enter karo."],
        rotationExplanation: "No rotation.",
        finalTree: serializeTree(root),
        timeComplexity: "O(1)",
        examNote: "Validation safe comparison flow ke liye important hai.",
      });
      return;
    }
    const result = await searchPath(value);
    if (!result.found) setShowNotFound(true);
    setExplanation({
      operation: "Search Node",
      concept: "AVL/BST property use karke unnecessary subtree skip hota hai, isliye search fast hoti hai.",
      steps: result.steps,
      rotationExplanation: "Search operation me rotation apply nahi hoti.",
      finalTree: serializeTree(root),
      timeComplexity: "O(log n)",
      examNote: "Balanced AVL me search worst-case height bounded rehta hai.",
    });
  };

  const handleDelete = () => {
    setActiveOperation("delete");
    setShowNotFound(false);
    clearTraversalPlayback();
    const value = parseInputValue();
    if (value === null) {
      setExplanation({
        operation: "DELETE (Validation)",
        concept: "Please enter a valid numeric value first.",
        steps: ["Input validate hua.", "Invalid number detect hua.", "Valid number enter karo."],
        rotationExplanation: "No rotation.",
        finalTree: serializeTree(root),
        timeComplexity: "O(1)",
        examNote: "Validation delete path errors avoid karta hai.",
      });
      return;
    }

    const meta: OpMeta = { steps: [], rotations: [], unbalancedIds: [] };
    const res = deleteRec(root, value, meta);
    if (!res.deleted) {
      setShowNotFound(true);
      setComparisonLog(meta.steps);
      setExplanation({
        operation: "Delete Node",
        concept: "Delete me pehle target node locate hota hai, agar na mile to tree same rehta hai.",
        steps: [...meta.steps, `Node ${value} not found.`],
        rotationExplanation: "No rotation.",
        finalTree: serializeTree(root),
        timeComplexity: "O(log n)",
        examNote: "Deletion search-path based hota hai.",
      });
      return;
    }

    setRoot(res.next);
    setComparisonLog(meta.steps);
    setUnbalancedIds(meta.unbalancedIds);
    const rotation = meta.rotations.length ? meta.rotations.join(", ") : "No rotation required after deletion";
    setLastRotation(meta.rotations[meta.rotations.length - 1] ?? "None");
    setExplanation({
      operation: "Delete Node",
      concept: "AVL delete me node remove karne ke baad heights update hoti hain aur rebalance apply hota hai.",
      steps: meta.steps,
      rotationExplanation: rotation,
      finalTree: serializeTree(res.next),
      timeComplexity: "O(log n)",
      examNote: "Deletion ke baad rebalance AVL ka core difference hai normal BST se.",
    });
  };

  const handleReset = () => {
    setActiveOperation("reset");
    const next = createDefaultTree();
    setRoot(next);
    setValueInput("");
    setHighlightId(null);
    setUnbalancedIds([]);
    setComparisonLog([]);
    setLastRotation("None");
    setShowNotFound(false);
    clearTraversalPlayback();
    setExplanation({
      operation: "Reset Tree",
      concept: "AVL default tree par reset hui aur saare highlights/playback states clear ho gaye.",
      steps: ["Default nodes 20, 10, 30 restore hue.", "Traversal states clear hue.", "Rotation log reset hua."],
      rotationExplanation: "No rotation.",
      finalTree: serializeTree(next),
      timeComplexity: "O(n)",
      examNote: "Reset repeated practice ke liye clean starting point deta hai.",
    });
  };

  const bfTone = (bf: number) => {
    const abs = Math.abs(bf);
    if (abs === 0) return "border-emerald-300 bg-emerald-50 text-emerald-700";
    if (abs === 1) return "border-amber-300 bg-amber-50 text-amber-700";
    return "border-rose-300 bg-rose-50 text-rose-700";
  };

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <Link href="/trees" className="text-blue-700 hover:text-blue-800">&larr; Back to Trees overview</Link>
          <Link href="/" className="text-blue-700 hover:text-blue-800">Back to homepage</Link>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">AVL Tree Visualizer</h1>
          <p className="mt-3 max-w-3xl text-slate-600">AVL ek self-balancing BST hai jaha balance factor maintain karne ke liye automatic LL/RR/LR/RL rotations lagti hain.</p>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
            <input type="number" value={valueInput} onChange={(e) => setValueInput(e.target.value)} placeholder="Enter node value" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none ring-cyan-300 transition focus:ring" />
            <button onClick={handleReset} className="inline-flex items-center justify-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2.5 text-sm font-medium text-cyan-700 hover:bg-cyan-100"><RotateCcw className="h-4 w-4" />Reset Tree</button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button onClick={() => void handleInsert()} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">Insert Node</button>
            <button onClick={handleDelete} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Delete Node</button>
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
                  <input id="avl-stepmode" type="checkbox" checked={isStepMode} onChange={(e) => setIsStepMode(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-cyan-600" />
                  <label htmlFor="avl-stepmode" className="font-medium">Step-by-Step mode</label>
                  <button onClick={nextStep} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">Next Step</button>
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

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <h2 className="text-lg font-semibold text-slate-900">AVL Visual</h2>
            <p className="mt-1 text-xs font-medium text-blue-700">Traversal output: {traversalOrder}</p>
            <p className="mt-1 text-xs font-medium text-emerald-700">Current visited node: {highlightId ? nodeById(root, highlightId)?.value ?? "-" : "-"}</p>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-medium md:grid-cols-4">
              <span className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1.5 text-indigo-700">Tree Height: {treeInfo.height}</span>
              <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-emerald-700">Balanced: {treeInfo.balanced ? "true" : "false"}</span>
              <span className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-1.5 text-slate-700">Node Count: {treeInfo.count}</span>
              <span className="rounded-lg border border-cyan-200 bg-cyan-50 px-2 py-1.5 text-cyan-700">Last Rotation: {lastRotation}</span>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <AnimatePresence>
                {showNotFound && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-3 flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">
                    <AlertTriangle className="h-4 w-4" />Value not found in AVL tree.
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Comparison / Decision Path</p>
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
                  <motion.div key={node.id} layout initial={{ opacity: 0, scale: 0.86 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.82 }} transition={{ type: "spring", stiffness: 250, damping: 22 }} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${node.x}%`, top: `${node.y}%` }}>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-bold shadow-sm ${highlightId === node.id ? "border-cyan-400 bg-cyan-100 text-cyan-800" : unbalancedIds.includes(node.id) ? "border-rose-400 bg-rose-100 text-rose-800" : "border-slate-300 bg-white text-slate-900"}`}>
                      {node.value}
                    </div>
                    <div className={`mt-1 rounded-md border px-1.5 py-0.5 text-center text-[10px] font-semibold ${bfTone(node.bf)}`}>
                      H:{node.height} BF:{node.bf}
                    </div>
                  </motion.div>
                ))}

                {visual.nodes.length === 0 && <div className="flex h-full min-h-[260px] items-center justify-center text-sm text-slate-500">AVL tree is empty</div>}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800">Key Concept</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-emerald-700">
                <li>AVL ek self-balancing BST hai.</li>
                <li>Balance factor (left height - right height) se balance track hota hai.</li>
                <li>LL, RR, LR, RL rotations balance restore karti hain.</li>
                <li>Search/insert/delete operations O(log n) maintain karte hain.</li>
              </ul>
            </div>

            <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-800">BST vs AVL</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-blue-700">
                <li>BST skew ho sakta hai, AVL actively balance maintain karta hai.</li>
                <li>AVL ka worst-case height low rehta hai.</li>
                <li>Isliye AVL me search typically faster and predictable hoti hai.</li>
              </ul>
            </div>

            <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
              <p className="text-sm font-semibold text-cyan-800">Real-world Use Cases</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-cyan-700">
                <li>Databases</li>
                <li>Memory indexing</li>
                <li>Search systems</li>
                <li>Real-time applications</li>
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
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rotation explanation</p><p className="mt-1 text-slate-700">{explanation.rotationExplanation}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Final AVL tree</p><p className="mt-1 font-mono text-slate-800">{explanation.finalTree}</p></div>
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
