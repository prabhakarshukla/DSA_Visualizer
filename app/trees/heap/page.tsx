"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";

type HeapMode = "min" | "max";

type HeapNode = {
  id: string;
  value: number;
};

type OperationKey = "insert" | "delete" | "extract" | "heapify" | "reset" | "idle";

const defaultHeapData: HeapNode[] = [10, 20, 30, 40, 50].map((value, index) => ({
  id: `node-${index}`,
  value,
}));

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getOperationKey = (operation: string): OperationKey => {
  const lower = operation.toLowerCase();
  if (lower.startsWith("insert")) return "insert";
  if (lower.startsWith("delete")) return "delete";
  if (lower.startsWith("extract")) return "extract";
  if (lower.includes("heapify")) return "heapify";
  if (lower.includes("reset")) return "reset";
  return "idle";
};

const explanationMap: Record<
  OperationKey,
  { concept: string; examNote: string; timeComplexity: string }
> = {
  insert: {
    concept:
      "Insert me naya node end me add hota hai, phir upward heapify se parent-child compare karke swap hota hai jab tak heap property restore ho.",
    examNote: "Insert ka time complexity O(log n) hota hai, exams me frequently poocha jata hai.",
    timeComplexity: "O(log n)",
  },
  delete: {
    concept:
      "Delete Root me root remove hota hai, last node root par aata hai, aur downward heapify se heap property restore hoti hai.",
    examNote: "Delete Root ka time complexity O(log n) hota hai.",
    timeComplexity: "O(log n)",
  },
  extract: {
    concept:
      "Extract Min/Max me root remove hota hai, last node root par shift hota hai aur heap reorder hota hai.",
    examNote: "Extract operation bhi O(log n) hoti hai.",
    timeComplexity: "O(log n)",
  },
  heapify: {
    concept:
      "Heapify me parent aur children ko compare karke heap property ke according swaps kiye jate hain.",
    examNote: "Heapify logic insert/delete dono me use hoti hai.",
    timeComplexity: "O(log n)",
  },
  reset: {
    concept: "Reset se heap default state me wapas aa jata hai.",
    examNote: "Reset ke baad fresh operations easy hote hain.",
    timeComplexity: "O(1)",
  },
  idle: {
    concept: "Koi operation select karo, yahan detailed explanation dikhegi.",
    examNote: "Heap operations ki complexity yaad rakho.",
    timeComplexity: "-",
  },
};

const pseudocodeMap: Record<OperationKey, string[]> = {
  insert: ["add node at end", "while heap property violated:", "    swap upward"],
  delete: ["remove root", "move last node to root", "heapify down"],
  extract: ["remove root (min/max)", "move last node to root", "heapify down"],
  heapify: ["compare parent with children", "swap if required"],
  reset: ["restore default heap"],
  idle: ["Select operation to view pseudocode."],
};

export default function HeapPage() {
  const [heapMode, setHeapMode] = useState<HeapMode>("min");
  const [heapData, setHeapData] = useState<HeapNode[]>(defaultHeapData);
  const [nodeValue, setNodeValue] = useState("");
  const [highlightIndices, setHighlightIndices] = useState<number[]>([]);
  const [swapIndices, setSwapIndices] = useState<number[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [heapifySteps, setHeapifySteps] = useState<string[]>([
    "Operation select karo to steps dikhenge.",
  ]);
  const [propertyChanges, setPropertyChanges] = useState<string[]>([
    "Heap property stable hai.",
  ]);
  const [activeOperation, setActiveOperation] = useState("Idle");
  const [isAnimating, setIsAnimating] = useState(false);

  const idRef = useRef(defaultHeapData.length);

  const modeLabel = useMemo(() => (heapMode === "min" ? "Min Heap" : "Max Heap"), [heapMode]);
  const heapSize = heapData.length;
  const rootValue = heapSize > 0 ? heapData[0].value : "—";
  const treeHeight = heapSize > 0 ? Math.floor(Math.log2(heapSize)) + 1 : 0;
  const finalHeap = useMemo(() => {
    if (heapData.length === 0) return "EMPTY";
    return `[${heapData.map((node) => node.value).join(", ")}]`;
  }, [heapData]);
  const operationKey = useMemo(() => getOperationKey(activeOperation), [activeOperation]);
  const explanation = explanationMap[operationKey];
  const pseudocode = pseudocodeMap[operationKey];

  const selectedRelations = useMemo(() => {
    if (selectedIndex === null) {
      return { selected: null, parent: null, children: [] as number[] };
    }
    const parent = selectedIndex === 0 ? null : Math.floor((selectedIndex - 1) / 2);
    const left = 2 * selectedIndex + 1;
    const right = 2 * selectedIndex + 2;
    const children = [left, right].filter((index) => index < heapData.length);
    return { selected: selectedIndex, parent, children };
  }, [selectedIndex, heapData.length]);

  const positions = useMemo(() => {
    const verticalSpacing = heapData.length > 7 ? 20 : 24;
    return heapData.map((node, index) => {
      const level = Math.floor(Math.log2(index + 1));
      const levelStart = 2 ** level - 1;
      const pos = index - levelStart;
      const slots = 2 ** level;
      const x = ((pos + 0.5) / slots) * 100;
      const y = 12 + level * verticalSpacing;
      return { node, index, x, y };
    });
  }, [heapData]);

  const edges = useMemo(() => {
    const map = new Map<number, { x: number; y: number }>();
    positions.forEach((pos) => {
      map.set(pos.index, { x: pos.x, y: pos.y });
    });
    const next: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    positions.forEach((pos) => {
      const left = 2 * pos.index + 1;
      const right = 2 * pos.index + 2;
      if (map.has(left)) {
        const child = map.get(left)!;
        next.push({ x1: pos.x, y1: pos.y, x2: child.x, y2: child.y });
      }
      if (map.has(right)) {
        const child = map.get(right)!;
        next.push({ x1: pos.x, y1: pos.y, x2: child.x, y2: child.y });
      }
    });
    return next;
  }, [positions]);

  const runHeapifyDown = async (
    nextHeap: HeapNode[],
    startIndex: number,
    mode: HeapMode,
  ) => {
    let index = startIndex;
    const compare = (child: number, parent: number) =>
      mode === "min" ? child < parent : child > parent;
    const symbol = mode === "min" ? "<" : ">";

    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let target = index;

      if (left < nextHeap.length && compare(nextHeap[left].value, nextHeap[target].value)) {
        target = left;
      }
      if (right < nextHeap.length && compare(nextHeap[right].value, nextHeap[target].value)) {
        target = right;
      }

      if (target === index) break;

      const parentValue = nextHeap[index].value;
      const childValue = nextHeap[target].value;
      setHighlightIndices([index, target]);
      setSwapIndices([index, target]);
      setHeapifySteps((prev) => [
        ...prev,
        "Heap property violated",
        `${childValue} ${symbol} ${parentValue} → swapping downward`,
      ]);
      setPropertyChanges((prev) => [
        ...prev,
        "Heap property violated",
        `${childValue} ${symbol} ${parentValue} → swap downward`,
      ]);
      await sleep(350);

      [nextHeap[index], nextHeap[target]] = [nextHeap[target], nextHeap[index]];
      setHeapData([...nextHeap]);
      index = target;

      await sleep(450);
      setSwapIndices([]);
    }
  };

  const handleInsert = async () => {
    if (isAnimating) return;
    const trimmed = nodeValue.trim();
    const parsed = Number(trimmed);
    setActiveOperation("Insert Node");

    if (!trimmed || Number.isNaN(parsed)) {
      setHeapifySteps(["Valid number enter karo to insert ho sake."]);
      setPropertyChanges(["Heap property stable hai."]);
      return;
    }

    setIsAnimating(true);
    const newNode: HeapNode = { id: `node-${idRef.current}`, value: parsed };
    idRef.current += 1;
    const nextHeap = [...heapData, newNode];
    setHeapData(nextHeap);
    setHeapifySteps([`Node end me add hota hai (value: ${parsed}).`, "Upward heapify start hoti hai."]);
    setPropertyChanges(["Heap property check start hua."]);
    let index = nextHeap.length - 1;
    setHighlightIndices([index]);

    await sleep(500);

    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const childValue = nextHeap[index].value;
      const parentValue = nextHeap[parentIndex].value;
      setHighlightIndices([parentIndex, index]);

      const shouldSwap =
        heapMode === "min" ? childValue < parentValue : childValue > parentValue;
      if (!shouldSwap) break;

      setHeapifySteps((prev) => [
        ...prev,
        `${childValue} ${heapMode === "min" ? "<" : ">"} ${parentValue} → swapping upward`,
      ]);
      setPropertyChanges((prev) => [
        ...prev,
        "Heap property violated",
        `${childValue} ${heapMode === "min" ? "<" : ">"} ${parentValue} → swap upward`,
      ]);
      setSwapIndices([parentIndex, index]);
      await sleep(350);

      [nextHeap[parentIndex], nextHeap[index]] = [nextHeap[index], nextHeap[parentIndex]];
      setHeapData([...nextHeap]);
      index = parentIndex;

      await sleep(450);
      setSwapIndices([]);
    }

    setHeapifySteps((prev) => [...prev, "Heap property restore ho gayi."]);
    setPropertyChanges((prev) => [...prev, "Heap property restore ho gayi."]);
    setHighlightIndices([]);
    setSwapIndices([]);
    setNodeValue("");
    setIsAnimating(false);
  };

  const handleDeleteRoot = async () => {
    if (isAnimating) return;
    const mode = heapMode;
    setActiveOperation("Delete Root");

    if (heapData.length === 0) {
      setHeapifySteps(["Heap Empty"]);
      setPropertyChanges(["Heap Empty"]);
      setHighlightIndices([]);
      return;
    }

    setIsAnimating(true);
    const nextHeap = [...heapData];
    const rootValue = nextHeap[0].value;

    if (nextHeap.length === 1) {
      setHeapData([]);
      setHeapifySteps([`Removed root ${rootValue}.`, "Heap Empty"]);
      setPropertyChanges(["Root remove hua.", "Heap Empty"]);
      setHighlightIndices([]);
      setSwapIndices([]);
      setIsAnimating(false);
      return;
    }

    const last = nextHeap.pop()!;
    nextHeap[0] = last;
    setHeapData([...nextHeap]);
    setHeapifySteps([
      "Root remove hota hai.",
      `Last node ${last.value} root par aata hai.`,
      "Downward heapify start hoti hai.",
    ]);
    setPropertyChanges(["Root remove hua.", "Heap property check start hua."]);
    setHighlightIndices([0]);
    await sleep(550);
    await runHeapifyDown(nextHeap, 0, mode);
    setHeapifySteps((prev) => [...prev, "Heap property restore ho gayi."]);
    setPropertyChanges((prev) => [...prev, "Heap property restore ho gayi."]);
    setHighlightIndices([]);
    setSwapIndices([]);
    setIsAnimating(false);
  };

  const handleExtract = async () => {
    if (isAnimating) return;
    const mode = heapMode;
    const label = mode === "min" ? "Extract Min" : "Extract Max";
    setActiveOperation(label);

    if (heapData.length === 0) {
      setHeapifySteps(["Heap Empty"]);
      setPropertyChanges(["Heap Empty"]);
      setHighlightIndices([]);
      return;
    }

    setIsAnimating(true);
    const nextHeap = [...heapData];
    const rootValue = nextHeap[0].value;

    if (nextHeap.length === 1) {
      setHeapData([]);
      setHeapifySteps([`Extracted ${rootValue}.`, "Heap Empty"]);
      setPropertyChanges([`Root remove hua (${rootValue}).`, "Heap Empty"]);
      setHighlightIndices([]);
      setSwapIndices([]);
      setIsAnimating(false);
      return;
    }

    const last = nextHeap.pop()!;
    nextHeap[0] = last;
    setHeapData([...nextHeap]);
    setHeapifySteps([
      `Root remove hota hai (${rootValue}).`,
      `Last node ${last.value} root par shift hota hai.`,
      "Heap reorder hota hai with downward heapify.",
    ]);
    setPropertyChanges(["Root remove hua.", "Heap property check start hua."]);
    setHighlightIndices([0]);
    await sleep(550);
    await runHeapifyDown(nextHeap, 0, mode);
    setHeapifySteps((prev) => [...prev, "Heap property restore ho gayi."]);
    setPropertyChanges((prev) => [...prev, "Heap property restore ho gayi."]);
    setHighlightIndices([]);
    setSwapIndices([]);
    setIsAnimating(false);
  };

  return (
    <main className="min-h-screen bg-[#F1E8C7] px-4 py-8 text-[#4B5320] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-[#4B5320]">
          <Link href="/trees" className="text-[#7D8F3B] hover:text-[#4B5320]">
            &larr; Back to Trees overview
          </Link>
          <Link href="/" className="text-[#7D8F3B] hover:text-[#4B5320]">
            Back to homepage
          </Link>
        </div>

        <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#4B5320] sm:text-4xl">
                Heap Tree Visualizer
              </h1>
              <p className="mt-2 text-[#9CA763]">
                Min Heap and Max Heap Interactive Visualization
              </p>
            </div>
            <div className="rounded-2xl border border-[#AAB76A] bg-[#F7F1DD] px-4 py-3 text-sm text-[#4B5320]">
              Active mode: <span className="font-semibold">{modeLabel}</span>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.6fr,1fr] xl:grid-cols-[2.1fr,2fr]">
          <div className="space-y-5">
            <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#4B5320] sm:text-xl">Tree Visualization</h2>
                <span className="rounded-full border border-[#AAB76A] bg-[#F7F1DD] px-3 py-1 text-xs font-semibold text-[#7D8F3B]">
                  {modeLabel}
                </span>
              </div>
              <div className="mt-4 rounded-2xl border border-[#D8CCA3] bg-gradient-to-br from-white to-slate-50 p-3">
                <div className="relative h-56 w-full sm:h-64 lg:h-72">
                  <svg
                    className="absolute inset-0 z-0 h-full w-full text-[#AAB76A]"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    {edges.map((edge, idx) => (
                      <line
                        key={`edge-${idx}`}
                        x1={edge.x1}
                        y1={edge.y1}
                        x2={edge.x2}
                        y2={edge.y2}
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    ))}
                  </svg>
                  <AnimatePresence>
                    {positions.map((pos) => {
                      const isAnimated = highlightIndices.includes(pos.index);
                      const isSwapping = swapIndices.includes(pos.index);
                      const isSelected = selectedRelations.selected === pos.index;
                      const isRelated =
                        selectedRelations.parent === pos.index ||
                        selectedRelations.children.includes(pos.index);
                      const isRoot = pos.index === 0;
                      const pulse = isAnimating && (isAnimated || isSwapping);
                      const styles = isSwapping
                        ? {
                            backgroundColor: "#fef3c7",
                            borderColor: "#f59e0b",
                            scale: 1.1,
                            boxShadow: "0 0 18px rgba(251,191,36,0.45)",
                          }
                        : isAnimated
                          ? {
                              backgroundColor: "#dbeafe",
                              borderColor: "#2563eb",
                              scale: 1.08,
                              boxShadow: "0 0 18px rgba(59,130,246,0.4)",
                            }
                          : isSelected
                            ? {
                                backgroundColor: "#dcfce7",
                                borderColor: "#10b981",
                                scale: 1.06,
                                boxShadow: "0 0 14px rgba(16,185,129,0.35)",
                              }
                            : isRelated
                              ? {
                                  backgroundColor: "#ecfeff",
                                  borderColor: "#22d3ee",
                                  scale: 1.03,
                                  boxShadow: "0 0 10px rgba(34,211,238,0.3)",
                                }
                              : isRoot
                                ? {
                                    backgroundColor: "#ecfdf3",
                                    borderColor: "#34d399",
                                    scale: 1.04,
                                    boxShadow: "0 0 12px rgba(16,185,129,0.25)",
                                  }
                                : {
                                    backgroundColor: "#ffffff",
                                    borderColor: "#3b82f6",
                                    scale: 1,
                                    boxShadow: "0 0 0 rgba(0,0,0,0)",
                                  };
                      return (
                        <motion.div
                          key={pos.node.id}
                          layout
                          initial={{ opacity: 0, scale: 0.6 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 22,
                            scale: {
                              duration: pulse ? 0.8 : 0.25,
                              repeat: pulse ? Infinity : 0,
                              repeatType: "mirror",
                            },
                            boxShadow: {
                              duration: pulse ? 0.8 : 0.3,
                              repeat: pulse ? Infinity : 0,
                              repeatType: "mirror",
                            },
                          }}
                          className="absolute z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border bg-[#F7F1DD] text-center text-sm font-bold text-[#4B5320] shadow-sm sm:h-12 sm:w-12 sm:text-base"
                          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                          onClick={() => setSelectedIndex(pos.index)}
                          whileHover={{ scale: 1.08 }}
                          animate={{ opacity: 1, color: "#0f172a", ...styles }}
                        >
                          {pos.node.value}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
              <h2 className="text-lg font-semibold text-[#4B5320] sm:text-xl">
                Array Representation
              </h2>
              <div className="mt-4 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA763]">
                  Index
                </div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(46px,1fr))] gap-2 text-center text-xs font-semibold text-[#9CA763] sm:text-sm">
                  {heapData.map((_, index) => (
                    <div
                      key={`index-${index}`}
                      className="rounded-lg border border-[#D8CCA3] bg-[#F1E8C7] px-2 py-1"
                    >
                      {index}
                    </div>
                  ))}
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA763]">
                  Values
                </div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(46px,1fr))] gap-2 text-center text-xs font-semibold text-[#4B5320] sm:text-sm">
                  <AnimatePresence>
                    {heapData.map((node, index) => {
                      const isAnimated = highlightIndices.includes(index);
                      const isSwapping = swapIndices.includes(index);
                      const isSelected = selectedRelations.selected === index;
                      const isRelated =
                        selectedRelations.parent === index ||
                        selectedRelations.children.includes(index);
                      const isRoot = index === 0;
                      const pulse = isAnimating && (isAnimated || isSwapping);
                      const styles = isSwapping
                        ? {
                            backgroundColor: "#fef3c7",
                            borderColor: "#f59e0b",
                            color: "#92400e",
                            scale: 1.06,
                            boxShadow: "0 0 16px rgba(251,191,36,0.35)",
                          }
                        : isAnimated
                          ? {
                              backgroundColor: "#dbeafe",
                              borderColor: "#2563eb",
                              color: "#1e3a8a",
                              scale: 1.05,
                              boxShadow: "0 0 14px rgba(59,130,246,0.3)",
                            }
                          : isSelected
                            ? {
                                backgroundColor: "#dcfce7",
                                borderColor: "#10b981",
                                color: "#065f46",
                                scale: 1.04,
                                boxShadow: "0 0 10px rgba(16,185,129,0.3)",
                              }
                            : isRelated
                              ? {
                                  backgroundColor: "#ecfeff",
                                  borderColor: "#22d3ee",
                                  color: "#0f766e",
                                  scale: 1.03,
                                  boxShadow: "0 0 10px rgba(34,211,238,0.25)",
                                }
                              : isRoot
                                ? {
                                    backgroundColor: "#ecfdf3",
                                    borderColor: "#34d399",
                                    color: "#065f46",
                                    scale: 1.02,
                                    boxShadow: "0 0 10px rgba(16,185,129,0.2)",
                                  }
                                : {
                                    backgroundColor: "#ffffff",
                                    borderColor: "#bfdbfe",
                                    color: "#0f172a",
                                    scale: 1,
                                    boxShadow: "0 0 0 rgba(0,0,0,0)",
                                  };
                      return (
                        <motion.div
                          key={node.id}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 22,
                            scale: {
                              duration: pulse ? 0.8 : 0.25,
                              repeat: pulse ? Infinity : 0,
                              repeatType: "mirror",
                            },
                            boxShadow: {
                              duration: pulse ? 0.8 : 0.3,
                              repeat: pulse ? Infinity : 0,
                              repeatType: "mirror",
                            },
                          }}
                          className="cursor-pointer rounded-lg border px-2 py-2 font-semibold shadow-sm"
                          onClick={() => setSelectedIndex(index)}
                          whileHover={{ scale: 1.05 }}
                          animate={{ opacity: 1, ...styles }}
                        >
                          {node.value}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-[#4B5320] sm:text-xl">Controls Panel</h2>
                <span className="rounded-full border border-[#AAB76A] bg-[#F7F1DD] px-3 py-1 text-xs font-semibold text-[#7D8F3B]">
                  Active: {modeLabel}
                </span>
              </div>
              <div className="mt-4 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-[1fr,auto]">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="heap-node" className="text-sm font-semibold text-[#4B5320]">
                      Node value
                    </label>
                    <input
                      id="heap-node"
                      value={nodeValue}
                      onChange={(event) => setNodeValue(event.target.value)}
                      placeholder="Enter value"
                      className="w-full rounded-2xl border border-[#D8CCA3] bg-[#F7F1DD] px-4 py-2 text-sm text-[#4B5320] shadow-sm outline-none transition focus:border-[#AAB76A] focus:ring-2 focus:ring-[#F1E8C7]"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA763]">
                      Heap Mode
                    </p>
                    <div className="mt-2 inline-flex rounded-full border border-[#D8CCA3] bg-[#F1E8C7] p-1">
                      <button
                        type="button"
                        onClick={() => setHeapMode("min")}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          heapMode === "min"
                            ? "bg-[#7D8F3B] text-white shadow"
                            : "text-[#9CA763] hover:text-[#4B5320]"
                        }`}
                      >
                        Min Heap
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeapMode("max")}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          heapMode === "max"
                            ? "bg-[#F7F1DD]0 text-white shadow"
                            : "text-[#9CA763] hover:text-[#4B5320]"
                        }`}
                      >
                        Max Heap
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                  <button
                    type="button"
                    onClick={handleInsert}
                    disabled={isAnimating}
                    className={`rounded-2xl border px-3 py-2 text-sm font-semibold shadow-sm transition ${
                      isAnimating
                        ? "cursor-not-allowed border-[#D8CCA3] bg-[#F1E8C7] text-[#D8CCA3]"
                        : "border-[#D8CCA3] bg-[#F7F1DD] text-[#4B5320] hover:border-[#AAB76A] hover:text-[#7D8F3B]"
                    }`}
                  >
                    Insert Node
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteRoot}
                    disabled={isAnimating}
                    className={`rounded-2xl border px-3 py-2 text-sm font-semibold shadow-sm transition ${
                      isAnimating
                        ? "cursor-not-allowed border-[#D8CCA3] bg-[#F1E8C7] text-[#D8CCA3]"
                        : "border-[#D8CCA3] bg-[#F7F1DD] text-[#4B5320] hover:border-[#AAB76A] hover:text-[#7D8F3B]"
                    }`}
                  >
                    Delete Root
                  </button>
                  <button
                    type="button"
                    onClick={handleExtract}
                    disabled={isAnimating}
                    className={`rounded-2xl border px-3 py-2 text-sm font-semibold shadow-sm transition ${
                      isAnimating
                        ? "cursor-not-allowed border-[#D8CCA3] bg-[#F1E8C7] text-[#D8CCA3]"
                        : "border-[#D8CCA3] bg-[#F7F1DD] text-[#4B5320] hover:border-[#AAB76A] hover:text-[#7D8F3B]"
                    }`}
                  >
                    Extract {heapMode === "min" ? "Min" : "Max"}
                  </button>
                  {["Heapify", "Reset Heap"].map((label) => (
                    <button
                      key={label}
                      type="button"
                      disabled={isAnimating}
                      className={`rounded-2xl border px-3 py-2 text-sm font-semibold shadow-sm transition ${
                        isAnimating
                          ? "cursor-not-allowed border-[#D8CCA3] bg-[#F1E8C7] text-[#D8CCA3]"
                          : "border-[#D8CCA3] bg-[#F7F1DD] text-[#4B5320] hover:border-[#AAB76A] hover:text-[#7D8F3B]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <div className="space-y-5">
              <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                <h2 className="text-lg font-semibold text-[#4B5320] sm:text-xl">
                  Explanation Panel
                </h2>
                <div className="mt-4 space-y-4 text-sm text-[#4B5320]">
                  <div className="rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA763]">
                      Operation
                    </p>
                    <p className="mt-1 text-base font-semibold text-[#4B5320]">
                      {activeOperation}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#D8CCA3] bg-[#F7F1DD] px-4 py-3 text-[#4B5320]">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7D8F3B]">
                      Concept
                    </p>
                    <p className="mt-2 text-sm leading-relaxed">{explanation.concept}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA763]">
                      Step-by-step process
                    </p>
                    <ul className="mt-2 space-y-2">
                      {heapifySteps.map((step, idx) => (
                        <li
                          key={`step-${idx}`}
                          className="rounded-2xl border border-[#D8CCA3] bg-[#F7F1DD] px-3 py-2 text-[#4B5320]"
                        >
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA763]">
                      Heap property changes
                    </p>
                    <ul className="mt-2 space-y-2">
                      {propertyChanges.map((change, idx) => (
                        <li
                          key={`change-${idx}`}
                          className="rounded-2xl border border-[#AAB76A] bg-[#F7F1DD] px-3 py-2 text-[#7D8F3B]"
                        >
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA763]">
                      Final Heap
                    </p>
                    <p className="mt-1 font-mono text-sm text-[#4B5320]">{finalHeap}</p>
                  </div>
                  <div className="rounded-2xl border border-[#AAB76A] bg-[#F7F1DD] px-4 py-3 text-[#7D8F3B]">
                    Time complexity:{" "}
                    <span className="font-semibold">{explanation.timeComplexity}</span>
                  </div>
                  <div className="rounded-2xl border border-[#D8CCA3] bg-[#F7F1DD] px-4 py-3 text-[#9CA763]">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA763]">
                      Exam note
                    </p>
                    <p className="mt-2 text-sm leading-relaxed">{explanation.examNote}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                <h2 className="text-lg font-semibold text-[#4B5320] sm:text-xl">Pseudocode</h2>
                <div className="mt-4 space-y-2 rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] px-4 py-3 font-mono text-xs text-[#4B5320]">
                  {pseudocode.map((line, idx) => (
                    <div key={`pseudo-${idx}`}>{line}</div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                <h2 className="text-lg font-semibold text-[#4B5320] sm:text-xl">Heap Info</h2>
                <div className="mt-4 space-y-3 text-sm text-[#4B5320]">
                  {[
                    { label: "Heap Type", value: modeLabel },
                    { label: "Root Value", value: rootValue },
                    { label: "Heap Size", value: heapSize },
                    { label: "Tree Height", value: treeHeight },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] px-4 py-3"
                    >
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA763]">
                        {item.label}
                      </span>
                      <span className="text-base font-semibold text-[#4B5320]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                <h2 className="text-lg font-semibold text-[#4B5320] sm:text-xl">Heap Formula</h2>
                <div className="mt-4 space-y-3 text-sm text-[#4B5320]">
                  <div className="rounded-2xl border border-[#D8CCA3] bg-[#F7F1DD] px-4 py-3 text-[#4B5320]">
                    Left Child = 2i + 1
                  </div>
                  <div className="rounded-2xl border border-[#D8CCA3] bg-[#F7F1DD] px-4 py-3 text-[#4B5320]">
                    Right Child = 2i + 2
                  </div>
                  <div className="rounded-2xl border border-[#D8CCA3] bg-[#F7F1DD] px-4 py-3 text-[#4B5320]">
                    Parent = floor((i - 1) / 2)
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                <h2 className="text-lg font-semibold text-[#4B5320] sm:text-xl">Key Concepts</h2>
                <ul className="mt-4 space-y-3 text-sm text-[#4B5320]">
                  {[
                    "Heap is a Complete Binary Tree.",
                    "Min Heap keeps smallest element at root.",
                    "Max Heap keeps largest element at root.",
                    "Heaps are efficiently stored using arrays.",
                  ].map((item) => (
                    <li
                      key={item}
                      className="rounded-2xl border border-[#AAB76A] bg-[#F7F1DD] px-4 py-3 text-[#7D8F3B]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                <h2 className="text-lg font-semibold text-[#4B5320] sm:text-xl">
                  Real-world use cases
                </h2>
                <ul className="mt-4 space-y-3 text-sm text-[#4B5320]">
                  {[
                    "Priority Queue",
                    "CPU Scheduling",
                    "Dijkstra Algorithm",
                    "Memory Management",
                  ].map((item) => (
                    <li
                      key={item}
                      className="rounded-2xl border border-[#D8CCA3] bg-[#F7F1DD] px-4 py-3 text-[#4B5320]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>

        <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-[#4B5320] sm:text-xl">BST vs Heap</h2>
            <span className="rounded-full border border-[#D8CCA3] bg-[#F1E8C7] px-3 py-1 text-xs font-semibold text-[#9CA763]">
              Comparison
            </span>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-[#D8CCA3]">
            <div className="grid grid-cols-3 bg-[#F1E8C7] text-left text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA763]">
              <div className="px-3 py-2">Aspect</div>
              <div className="px-3 py-2">BST</div>
              <div className="px-3 py-2">Heap</div>
            </div>
            {[
              {
                aspect: "Ordering",
                bst: "Left < Root < Right",
                heap: "Only parent-child ordering",
              },
              {
                aspect: "Searching",
                bst: "O(log n) average",
                heap: "O(n) general search",
              },
              {
                aspect: "Structure",
                bst: "Not necessarily complete",
                heap: "Always complete",
              },
              {
                aspect: "Root behavior",
                bst: "Smallest/ largest depends on traversal",
                heap: "Root is min or max",
              },
            ].map((row, index) => (
              <div
                key={row.aspect}
                className={`grid grid-cols-3 text-sm ${
                  index % 2 === 0 ? "bg-[#F7F1DD]" : "bg-[#F1E8C7]"
                }`}
              >
                <div className="px-3 py-2 font-semibold text-[#4B5320]">{row.aspect}</div>
                <div className="px-3 py-2 text-[#9CA763]">{row.bst}</div>
                <div className="px-3 py-2 text-[#9CA763]">{row.heap}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
