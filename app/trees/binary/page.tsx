"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Search, RotateCcw, PlayCircle } from "lucide-react";
import { useMemo, useRef, useState } from "react";

type OperationKey =
  | "insert"
  | "delete"
  | "search"
  | "inorder"
  | "preorder"
  | "postorder"
  | "levelorder"
  | "reset"
  | "idle";

type ExplanationData = {
  operation: string;
  concept: string;
  steps: string[];
  finalTree: string;
  timeComplexity: string;
  examNote: string;
};

const defaultTree: Array<string | null> = ["10", "5", "20", "2", "8"];

const pseudocodeMap: Record<OperationKey, string[]> = {
  insert: [
    "if tree is empty:",
    "    root = newNode",
    "else:",
    "    find first empty position in level order",
    "    place newNode there",
  ],
  delete: [
    "if tree is empty:",
    "    print \"Not found\"",
    "else:",
    "    find target node",
    "    find deepest rightmost node",
    "    replace target with deepest",
    "    remove deepest node",
  ],
  search: [
    "for each node in traversal:",
    "    if node.value == target:",
    "        return found",
    "return not found",
  ],
  inorder: ["traverse(left)", "visit(root)", "traverse(right)"],
  preorder: ["visit(root)", "traverse(left)", "traverse(right)"],
  postorder: ["traverse(left)", "traverse(right)", "visit(root)"],
  levelorder: ["queue = [root]", "while queue not empty:", "    node = pop front", "    visit(node)", "    push children"],
  reset: ["tree = default tree", "clear highlights", "clear inputs"],
  idle: ["Select operation to view Binary Tree pseudocode."],
};

const trimTrailingNulls = (arr: Array<string | null>) => {
  const next = [...arr];
  while (next.length > 0 && next[next.length - 1] === null) {
    next.pop();
  }
  return next;
};

const serializeTree = (arr: Array<string | null>) => {
  const parts: string[] = [];
  for (let i = 0; i < arr.length; i += 1) {
    if (arr[i] !== null) {
      parts.push(`[${i}:${arr[i]}]`);
    }
  }
  return parts.length === 0 ? "EMPTY" : parts.join(" ");
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function BinaryTreePage() {
  const [tree, setTree] = useState<Array<string | null>>(defaultTree);
  const [valueInput, setValueInput] = useState("");
  const [activeOperation, setActiveOperation] = useState<OperationKey>("idle");
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [traversalOrder, setTraversalOrder] = useState<string>("-");
  const [showNotFound, setShowNotFound] = useState(false);
  const traversalTokenRef = useRef(0);

  const [explanation, setExplanation] = useState<ExplanationData>({
    operation: "Overview",
    concept:
      "Binary Tree me har node ke max 2 children hote hain: left aur right. Ye structure sorted hona zaroori nahi hota.",
    steps: [
      "Insert level-order empty position par hota hai.",
      "Delete me structure maintain karne ke liye replacement use karte hain.",
      "Traversal orders exam me frequently pooche jate hain.",
    ],
    finalTree: serializeTree(defaultTree),
    timeComplexity: "Depends on operation",
    examNote: "Binary Tree aur BST alag concepts hain; Binary Tree me ordering rule mandatory nahi hai.",
  });

  const pseudocode = useMemo(() => pseudocodeMap[activeOperation], [activeOperation]);

  const nodes = useMemo(() => {
    const presentIndices = tree
      .map((value, index) => ({ value, index }))
      .filter((item) => item.value !== null)
      .map((item) => item.index);

    return presentIndices.map((index) => {
      const level = Math.floor(Math.log2(index + 1));
      const levelStart = 2 ** level - 1;
      const pos = index - levelStart;
      const slots = 2 ** level;
      const x = ((pos + 0.5) / slots) * 100;
      const y = 14 + level * 20;
      return { index, value: tree[index] as string, x, y };
    });
  }, [tree]);

  const maxLevel = useMemo(() => {
    if (nodes.length === 0) return 0;
    return Math.max(...nodes.map((node) => Math.floor(Math.log2(node.index + 1))));
  }, [nodes]);

  const treeHeight = 120 + maxLevel * 32;

  const edges = useMemo(() => {
    const nodeMap = new Map(nodes.map((node) => [node.index, node]));
    const lines: Array<{ key: string; x1: number; y1: number; x2: number; y2: number }> = [];
    for (const node of nodes) {
      const left = 2 * node.index + 1;
      const right = 2 * node.index + 2;
      if (nodeMap.has(left)) {
        const child = nodeMap.get(left)!;
        lines.push({ key: `${node.index}-${left}`, x1: node.x, y1: node.y, x2: child.x, y2: child.y });
      }
      if (nodeMap.has(right)) {
        const child = nodeMap.get(right)!;
        lines.push({ key: `${node.index}-${right}`, x1: node.x, y1: node.y, x2: child.x, y2: child.y });
      }
    }
    return lines;
  }, [nodes]);

  const setValidationExplanation = (operation: OperationKey, message: string) => {
    setExplanation({
      operation: `${operation.toUpperCase()} (Validation)`,
      concept: message,
      steps: [
        "Operation run karne se pehle input aur tree state validate hoti hai.",
        "Invalid input par operation skip karke current tree preserve kiya gaya.",
        "Sahi value ke saath operation dobara try karo.",
      ],
      finalTree: serializeTree(tree),
      timeComplexity: "O(1)",
      examNote: "Validation checks runtime errors aur confusion dono reduce karte hain.",
    });
  };

  const getInorderIndices = (index: number, acc: number[]) => {
    if (index >= tree.length || tree[index] === null) return;
    getInorderIndices(2 * index + 1, acc);
    acc.push(index);
    getInorderIndices(2 * index + 2, acc);
  };

  const getPreorderIndices = (index: number, acc: number[]) => {
    if (index >= tree.length || tree[index] === null) return;
    acc.push(index);
    getPreorderIndices(2 * index + 1, acc);
    getPreorderIndices(2 * index + 2, acc);
  };

  const getPostorderIndices = (index: number, acc: number[]) => {
    if (index >= tree.length || tree[index] === null) return;
    getPostorderIndices(2 * index + 1, acc);
    getPostorderIndices(2 * index + 2, acc);
    acc.push(index);
  };

  const getLevelOrderIndices = () => {
    const acc: number[] = [];
    for (let i = 0; i < tree.length; i += 1) {
      if (tree[i] !== null) acc.push(i);
    }
    return acc;
  };

  const runTraversal = async (type: "inorder" | "preorder" | "postorder" | "levelorder") => {
    setActiveOperation(type);
    setShowNotFound(false);

    if (tree.every((node) => node === null)) {
      setValidationExplanation(type, "Tree empty hai. Traversal run nahi ho sakta.");
      setTraversalOrder("-");
      return;
    }

    let indices: number[] = [];
    if (type === "inorder") {
      getInorderIndices(0, indices);
    } else if (type === "preorder") {
      getPreorderIndices(0, indices);
    } else if (type === "postorder") {
      getPostorderIndices(0, indices);
    } else {
      indices = getLevelOrderIndices();
    }

    const values = indices.map((idx) => tree[idx] as string);
    setTraversalOrder(values.join(" -> "));

    const token = traversalTokenRef.current + 1;
    traversalTokenRef.current = token;
    for (const idx of indices) {
      if (traversalTokenRef.current !== token) return;
      setHighlightIndex(idx);
      await sleep(420);
    }

    const labels: Record<typeof type, string> = {
      inorder: "Inorder Traversal",
      preorder: "Preorder Traversal",
      postorder: "Postorder Traversal",
      levelorder: "Level Order Traversal",
    };

    const concepts: Record<typeof type, string> = {
      inorder: "Inorder me Left -> Root -> Right pattern follow hota hai.",
      preorder: "Preorder me Root -> Left -> Right order follow hota hai.",
      postorder: "Postorder me Left -> Right -> Root order hota hai.",
      levelorder: "Level Order me nodes level-by-level visit hote hain.",
    };

    setExplanation({
      operation: labels[type],
      concept: concepts[type],
      steps: [
        "Traversal root node se start hui.",
        `${labels[type]} rule ke according nodes visit hue.`,
        `Final visit order: ${values.join(" -> ")}`,
      ],
      finalTree: serializeTree(tree),
      timeComplexity: "O(n)",
      examNote: "Traversal orders recursion aur tree problems ka base banate hain.",
    });
  };

  const handleInsert = () => {
    setActiveOperation("insert");
    setShowNotFound(false);
    traversalTokenRef.current += 1;
    const value = valueInput.trim();
    if (value === "") {
      setValidationExplanation("insert", "Please enter a node value first.");
      return;
    }

    const next = [...tree];
    const emptyIndex = next.findIndex((node) => node === null);
    if (emptyIndex !== -1) {
      next[emptyIndex] = value;
      setHighlightIndex(emptyIndex);
    } else {
      next.push(value);
      setHighlightIndex(next.length - 1);
    }

    const final = trimTrailingNulls(next);
    setTree(final);
    setTraversalOrder("-");
    setExplanation({
      operation: "Insert Node",
      concept: "Binary Tree me insertion ke liye strict sorting rule mandatory nahi hota.",
      steps: [
        `Naya node ${value} insert request aayi.`,
        "Level-order me pehla available empty position detect hua.",
        "Node us position par place hua, tree shape maintain rahi.",
      ],
      finalTree: serializeTree(final),
      timeComplexity: "O(n)",
      examNote: "Binary Tree insertion generally level-order scan ke through kiya ja sakta hai.",
    });
  };

  const handleDelete = () => {
    setActiveOperation("delete");
    setShowNotFound(false);
    traversalTokenRef.current += 1;
    const value = valueInput.trim();
    if (value === "") {
      setValidationExplanation("delete", "Please enter a node value first.");
      return;
    }

    const target = tree.findIndex((node) => node === value);
    if (target === -1) {
      setShowNotFound(true);
      setValidationExplanation("delete", "Node not found in tree.");
      return;
    }

    let deepest = -1;
    for (let i = tree.length - 1; i >= 0; i -= 1) {
      if (tree[i] !== null) {
        deepest = i;
        break;
      }
    }

    const next = [...tree];
    if (deepest === target) {
      next[target] = null;
    } else {
      next[target] = next[deepest];
      next[deepest] = null;
    }

    const final = trimTrailingNulls(next);
    setTree(final);
    setHighlightIndex(target < final.length ? target : null);
    setTraversalOrder("-");
    setExplanation({
      operation: "Delete Node",
      concept: "Delete me node remove karke tree structure connected rakhna important hota hai.",
      steps: [
        `Target node ${value} locate hua.`,
        "Deepest rightmost node identify karke target position par place kiya gaya.",
        "Old deepest node remove karke structure valid rakha gaya.",
      ],
      finalTree: serializeTree(final),
      timeComplexity: "O(n)",
      examNote: "General Binary Tree delete me replacement strategy common interview pattern hai.",
    });
  };

  const handleSearch = async () => {
    setActiveOperation("search");
    setShowNotFound(false);
    traversalTokenRef.current += 1;
    const value = valueInput.trim();
    if (value === "") {
      setValidationExplanation("search", "Please enter a node value first.");
      return;
    }

    const order = getLevelOrderIndices();
    const token = traversalTokenRef.current;
    let foundIndex = -1;

    for (const idx of order) {
      if (traversalTokenRef.current !== token) return;
      setHighlightIndex(idx);
      await sleep(280);
      if (tree[idx] === value) {
        foundIndex = idx;
        break;
      }
    }

    if (foundIndex === -1) {
      setShowNotFound(true);
      setExplanation({
        operation: "Search Node",
        concept: "Binary Tree search traversal-based hota hai, ordering guarantee nahi hoti.",
        steps: [
          `Value ${value} ko level-order traversal se compare kiya gaya.`,
          "Har visited node ka data target se match check hua.",
          "Value nahi mila, isliye not found message show hua.",
        ],
        finalTree: serializeTree(tree),
        timeComplexity: "O(n)",
        examNote: "Unordered Binary Tree me worst-case me sab nodes check karne pad sakte hain.",
      });
      return;
    }

    setExplanation({
      operation: "Search Node",
      concept: "Search traversal ke through node-by-node comparison karke hota hai.",
      steps: [
        `Value ${value} ke liye traversal start hui.`,
        `Match index ${foundIndex} par mila aur node highlight hua.`,
        "Search successful, tree unchanged rahi.",
      ],
      finalTree: serializeTree(tree),
      timeComplexity: "O(n)",
      examNote: "Binary Tree search me data distribution ke hisab se best/worst vary karta hai.",
    });
  };

  const handleReset = () => {
    setActiveOperation("reset");
    traversalTokenRef.current += 1;
    setTree(defaultTree);
    setValueInput("");
    setHighlightIndex(null);
    setTraversalOrder("-");
    setShowNotFound(false);
    setExplanation({
      operation: "Reset Tree",
      concept: "Tree default structure par restore hota hai taki fresh practice start ho sake.",
      steps: [
        "Default nodes 10, 5, 20, 2, 8 restore hue.",
        "Highlights aur traversal output clear hua.",
        "Input field reset hui.",
      ],
      finalTree: serializeTree(defaultTree),
      timeComplexity: "O(n)",
      examNote: "Reset concept quick iterative practice ke liye useful hota hai.",
    });
  };

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <Link href="/trees" className="text-blue-700 hover:text-blue-800">
            &larr; Back to Trees overview
          </Link>
          <Link href="/" className="text-blue-700 hover:text-blue-800">
            Back to homepage
          </Link>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Binary Tree Visualizer</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Node insertion, deletion, searching, aur traversal ko visual form me samjho. Binary Tree sorted hona zaroori nahi hota,
            isliye traversal behavior par focus karo.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
            <input
              type="text"
              value={valueInput}
              onChange={(event) => setValueInput(event.target.value)}
              placeholder="Enter node value"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none ring-cyan-300 transition focus:ring"
            />
            <button
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2.5 text-sm font-medium text-cyan-700 hover:bg-cyan-100"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Tree
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button onClick={handleInsert} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
              Insert Node
            </button>
            <button onClick={handleDelete} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Delete Node
            </button>
            <button
              onClick={handleSearch}
              className="inline-flex items-center justify-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              <Search className="h-4 w-4" />
              Search Node
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-700 hover:bg-cyan-100"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Tree
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button onClick={() => runTraversal("inorder")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Inorder Traversal
            </button>
            <button onClick={() => runTraversal("preorder")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Preorder Traversal
            </button>
            <button onClick={() => runTraversal("postorder")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Postorder Traversal
            </button>
            <button onClick={() => runTraversal("levelorder")} className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <PlayCircle className="h-4 w-4" />
              Level Order Traversal
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <h2 className="text-lg font-semibold text-slate-900">Tree Visual</h2>
            <p className="mt-1 text-xs font-medium text-blue-700">Traversal output: {traversalOrder}</p>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <AnimatePresence>
                {showNotFound && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-3 flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Node not found in tree.
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative w-full overflow-x-auto" style={{ minHeight: `${treeHeight}px` }}>
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {edges.map((edge) => (
                    <motion.line
                      key={edge.key}
                      x1={edge.x1}
                      y1={edge.y1 + 2}
                      x2={edge.x2}
                      y2={edge.y2 - 2}
                      stroke="#94a3b8"
                      strokeWidth="0.5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.35 }}
                    />
                  ))}
                </svg>

                {nodes.map((node) => (
                  <motion.div
                    key={`node-${node.index}-${node.value}`}
                    layout
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-bold shadow-sm ${
                        highlightIndex === node.index
                          ? "border-emerald-400 bg-emerald-100 text-emerald-800"
                          : "border-cyan-200 bg-cyan-50 text-slate-800"
                      }`}
                    >
                      {node.value}
                    </div>
                    <p className="mt-1 text-center text-[10px] font-medium text-slate-500">idx {node.index}</p>
                  </motion.div>
                ))}

                {nodes.length === 0 && (
                  <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-slate-500">Tree is empty</div>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800">Key Concept</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-emerald-700">
                <li>Binary Tree node ke max 2 children hote hain.</li>
                <li>Left aur Right child pointers se structure banta hai.</li>
                <li>Binary Tree necessarily sorted nahi hota.</li>
                <li>Traversals (Inorder/Preorder/Postorder/Level) bahut important hote hain.</li>
              </ul>
            </div>

            <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-800">Real-world Use Cases</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-blue-700">
                <li>Hierarchical data representation</li>
                <li>File system structure</li>
                <li>Expression trees in compilers</li>
                <li>Decision trees in ML systems</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
              <h3 className="text-lg font-semibold text-slate-900">Step Explanation</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Operation</p>
                  <p className="mt-1 font-medium text-slate-800">{explanation.operation}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Concept</p>
                  <p className="mt-1 leading-6 text-slate-700">{explanation.concept}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step-by-step process</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-700">
                    {explanation.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Final tree</p>
                  <p className="mt-1 font-mono text-slate-800">{explanation.finalTree}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Time complexity</p>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    {explanation.timeComplexity}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Exam note</p>
                  <p className="mt-1 leading-6 text-slate-700">{explanation.examNote}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.2)]">
              <h3 className="text-lg font-semibold text-cyan-200">Pseudocode</h3>
              <div className="mt-3 space-y-1 font-mono text-sm leading-6 text-slate-100/95">
                {pseudocode.map((line, idx) => (
                  <p key={`${line}-${idx}`}>{line === "" ? " " : line}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
