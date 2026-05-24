"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Eye, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

type PriorityItem = {
  value: string;
  priority: number;
};

type OperationKey = "insert" | "delete" | "peek" | "isempty" | "isfull" | "reset" | "idle";

type ExplanationData = {
  operation: string;
  concept: string;
  steps: string[];
  finalQueue: string;
  timeComplexity: string;
  examNote: string;
};

const defaultQueue: PriorityItem[] = [
  { value: "10", priority: 3 },
  { value: "20", priority: 1 },
  { value: "30", priority: 2 },
];
const defaultMaxCapacity = 6;

const sortByPriority = (queue: PriorityItem[]) =>
  [...queue].sort((a, b) => a.priority - b.priority);

const formatQueue = (queue: PriorityItem[]) =>
  queue.length === 0
    ? "FRONT -> EMPTY <- REAR"
    : `FRONT [${queue.map((item) => `${item.value}(P:${item.priority})`).join(", ")}] REAR`;

const pseudocodeMap: Record<OperationKey, string[]> = {
  insert: [
    "if size == MAX:",
    "    print \"Overflow\"",
    "else:",
    "    insert element according to priority order",
    "    // smaller number = higher priority",
  ],
  delete: ["if size == 0:", "    print \"Underflow\"", "else:", "    remove FRONT element"],
  peek: ["if size == 0:", "    print \"Empty\"", "else:", "    print FRONT element"],
  isempty: ["if size == 0:", "    return true", "else:", "    return false"],
  isfull: ["if size == MAX:", "    return true", "else:", "    return false"],
  reset: ["queue = default", "MAX = 6", "clear highlights", "clear inputs"],
  idle: ["Select an operation to view Priority Queue pseudocode."],
};

export default function PriorityQueuePage() {
  const [queue, setQueue] = useState<PriorityItem[]>(sortByPriority(defaultQueue));
  const [valueInput, setValueInput] = useState("");
  const [priorityInput, setPriorityInput] = useState("");
  const [capacityInput, setCapacityInput] = useState(String(defaultMaxCapacity));
  const [maxCapacity, setMaxCapacity] = useState(defaultMaxCapacity);
  const [activeOperation, setActiveOperation] = useState<OperationKey>("idle");
  const [highlightFront, setHighlightFront] = useState(false);
  const [showOverflowWarning, setShowOverflowWarning] = useState(false);
  const [showUnderflowWarning, setShowUnderflowWarning] = useState(false);
  const [explanation, setExplanation] = useState<ExplanationData>({
    operation: "Overview",
    concept:
      "Priority Queue me processing FIFO se nahi, priority se hoti hai. Yaha smaller priority number ka matlab higher priority hai.",
    steps: [
      "FRONT par highest priority element rehta hai.",
      "Insert karte waqt queue auto-sort hoti hai.",
      "Same priority par FIFO behavior follow hota hai.",
    ],
    finalQueue: formatQueue(sortByPriority(defaultQueue)),
    timeComplexity: "Depends on operation",
    examNote: "Priority Queue scheduling aur resource management me bahut common hai.",
  });

  const isEmpty = queue.length === 0;
  const isFull = queue.length === maxCapacity;
  const highest = queue[0] ?? null;
  const pseudocode = useMemo(() => pseudocodeMap[activeOperation], [activeOperation]);

  const setValidationExplanation = (operation: OperationKey, message: string) => {
    setExplanation({
      operation: `${operation.toUpperCase()} (Validation)`,
      concept: message,
      steps: [
        "Operation se pehle input/state validation hoti hai.",
        "Invalid state par overflow/underflow ya wrong output avoid kiya jata hai.",
        "Valid values ke saath operation dobara run karo.",
      ],
      finalQueue: formatQueue(queue),
      timeComplexity: "O(1)",
      examNote: "Boundary checks exam aur interviews dono me expected hote hain.",
    });
  };

  const handleCapacityUpdate = () => {
    const parsed = Number(capacityInput);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setValidationExplanation("isfull", "Max capacity must be greater than 0.");
      return;
    }
    if (parsed < queue.length) {
      setValidationExplanation("isfull", `Current size ${queue.length} hai. Itni chhoti capacity set nahi kar sakte.`);
      return;
    }

    setMaxCapacity(parsed);
    setShowOverflowWarning(false);
    setExplanation({
      operation: "Capacity Update",
      concept: "Array-based Priority Queue me fixed max capacity concept use hota hai.",
      steps: [
        `Max capacity ${parsed} set hui.`,
        "Current priority order unchanged raha.",
        "Ab full condition size == MAX par evaluate hogi.",
      ],
      finalQueue: formatQueue(queue),
      timeComplexity: "O(1)",
      examNote: "Capacity constraints overflow concept samajhne me help karte hain.",
    });
  };

  const handleInsert = () => {
    setActiveOperation("insert");
    const value = valueInput.trim();
    const priority = Number(priorityInput);

    if (value === "") {
      setValidationExplanation("insert", "Please enter a value first.");
      return;
    }
    if (!Number.isInteger(priority)) {
      setValidationExplanation("insert", "Please enter a valid integer priority.");
      return;
    }
    if (isFull) {
      setShowOverflowWarning(true);
      setShowUnderflowWarning(false);
      setValidationExplanation("insert", "Priority Queue Overflow");
      return;
    }

    const newItem: PriorityItem = { value, priority };
    const insertIndex = queue.findIndex((item) => item.priority > priority);
    const next =
      insertIndex === -1
        ? [...queue, newItem]
        : [...queue.slice(0, insertIndex), newItem, ...queue.slice(insertIndex)];

    setQueue(next);
    setHighlightFront(true);
    setShowOverflowWarning(false);
    setShowUnderflowWarning(false);
    setExplanation({
      operation: "Insert",
      concept:
        "Priority Queue me element priority ke according place hota hai. Smaller number ka matlab higher priority hota hai.",
      steps: [
        `Element ${value}(P:${priority}) insert hua.`,
        "Queue ne automatic reorder karke correct priority position maintain ki.",
        "Agar same priority ho to existing order (FIFO for equals) preserve hota hai.",
      ],
      finalQueue: formatQueue(next),
      timeComplexity: "O(n)",
      examNote: "Array-based sorted insertion generally O(n) hoti hai kyunki shifting/repositioning lag sakti hai.",
    });
  };

  const handleDeleteHighest = () => {
    setActiveOperation("delete");
    if (isEmpty) {
      setShowUnderflowWarning(true);
      setShowOverflowWarning(false);
      setValidationExplanation("delete", "Priority Queue Underflow");
      return;
    }

    const removed = queue[0];
    const next = queue.slice(1);
    setQueue(next);
    setHighlightFront(true);
    setShowOverflowWarning(false);
    setShowUnderflowWarning(false);
    setExplanation({
      operation: "Delete Highest Priority",
      concept: "Highest priority element usually FRONT par hota hai, isliye wahi remove hota hai.",
      steps: [
        `FRONT element ${removed.value}(P:${removed.priority}) delete hua.`,
        next.length === 0 ? "Queue ab empty hai." : "Next highest priority element FRONT ban gaya.",
        "Priority-based processing maintain rahi.",
      ],
      finalQueue: formatQueue(next),
      timeComplexity: "O(1) or O(log n)",
      examNote: "Array sorted model me delete-front O(1) ho sakta hai; heap implementations me delete O(log n) hota hai.",
    });
  };

  const handlePeek = () => {
    setActiveOperation("peek");
    if (isEmpty) {
      setShowUnderflowWarning(true);
      setShowOverflowWarning(false);
      setValidationExplanation("peek", "Priority Queue Underflow");
      return;
    }

    const top = queue[0];
    setHighlightFront(true);
    setShowOverflowWarning(false);
    setShowUnderflowWarning(false);
    setExplanation({
      operation: "Peek Highest Priority",
      concept: "Peek me highest priority element ko bina delete kiye access kiya jata hai.",
      steps: [
        "FRONT position identify hui.",
        `Highest priority value ${top.value}(P:${top.priority}) read hui.`,
        "Queue structure unchanged rahi.",
      ],
      finalQueue: formatQueue(queue),
      timeComplexity: "O(1)",
      examNote: "Peek monitoring aur quick decision-making ke liye useful hota hai.",
    });
  };

  const handleIsEmpty = () => {
    setActiveOperation("isempty");
    setHighlightFront(false);
    setShowOverflowWarning(false);
    setShowUnderflowWarning(false);
    setExplanation({
      operation: "isEmpty",
      concept: "isEmpty check karta hai ki queue me koi element hai ya nahi.",
      steps: [
        "Current size evaluate hui.",
        isEmpty ? "Size 0 hai, queue empty hai." : `Size ${queue.length} hai, queue empty nahi hai.`,
        `Result: ${isEmpty ? "true" : "false"}`,
      ],
      finalQueue: formatQueue(queue),
      timeComplexity: "O(1)",
      examNote: "Delete/Peek se pehle isEmpty check underflow avoid karta hai.",
    });
  };

  const handleIsFull = () => {
    setActiveOperation("isfull");
    setHighlightFront(false);
    setShowOverflowWarning(isFull);
    setShowUnderflowWarning(false);
    setExplanation({
      operation: "isFull",
      concept: "isFull check karta hai ki current size max capacity ke equal hai ya nahi.",
      steps: [
        `Current size ${queue.length} aur max ${maxCapacity} compare hue.`,
        isFull ? "Queue full hai, insert block hoga." : "Queue full nahi hai, insert possible hai.",
        `Result: ${isFull ? "true" : "false"}`,
      ],
      finalQueue: formatQueue(queue),
      timeComplexity: "O(1)",
      examNote: "Fixed array capacity model me overflow prevention ke liye isFull critical hai.",
    });
  };

  const handleReset = () => {
    setActiveOperation("reset");
    const resetQueue = sortByPriority(defaultQueue);
    setQueue(resetQueue);
    setValueInput("");
    setPriorityInput("");
    setCapacityInput(String(defaultMaxCapacity));
    setMaxCapacity(defaultMaxCapacity);
    setHighlightFront(false);
    setShowOverflowWarning(false);
    setShowUnderflowWarning(false);
    setExplanation({
      operation: "Reset",
      concept: "Default priority queue restore hoti hai aur inputs/highlights clear ho jate hain.",
      steps: [
        "Queue default values par reset hui aur priority order maintain raha.",
        "Max capacity default 6 par reset hui.",
        "Value/priority inputs clear hue.",
      ],
      finalQueue: formatQueue(resetQueue),
      timeComplexity: "O(n)",
      examNote: "Reset repeated practice ke liye clean baseline provide karta hai.",
    });
  };

  return (
    <main className="min-h-screen bg-[#F1E8C7] px-4 py-10 text-[#4B5320] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <Link href="/queue" className="text-[#556B2F] hover:text-[#4B5320]">
            &larr; Back to Queue overview
          </Link>
          <Link href="/" className="text-[#556B2F] hover:text-[#4B5320]">
            Back to homepage
          </Link>
        </div>

        <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#4B5320] sm:text-4xl">Priority Queue Visualizer</h1>
          <p className="mt-3 max-w-3xl text-[#556B2F]">
            Priority Queue me smaller number ka matlab higher priority hota hai, isliye dequeue order FIFO se different ho sakta hai.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input
                type="text"
                value={valueInput}
                onChange={(event) => setValueInput(event.target.value)}
                placeholder="Enter value"
                className="w-full rounded-xl border border-[#D8CCA3] bg-[#F1E8C7] px-4 py-2.5 text-sm outline-none ring-[#AAB76A] transition focus:ring"
              />
              <input
                type="number"
                value={priorityInput}
                onChange={(event) => setPriorityInput(event.target.value)}
                placeholder="Enter priority (smaller = higher)"
                className="w-full rounded-xl border border-[#D8CCA3] bg-[#F1E8C7] px-4 py-2.5 text-sm outline-none ring-[#AAB76A] transition focus:ring"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={capacityInput}
                  onChange={(event) => setCapacityInput(event.target.value)}
                  placeholder="Max capacity"
                  className="w-full rounded-xl border border-[#D8CCA3] bg-[#F1E8C7] px-4 py-2.5 text-sm outline-none ring-[#AAB76A] transition focus:ring"
                />
                <button
                  onClick={handleCapacityUpdate}
                  className="rounded-xl border border-[#AAB76A] bg-[#F7F1DD] px-3 py-2.5 text-xs font-semibold text-[#556B2F] hover:bg-[#F1E8C7]"
                >
                  Set Max
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-medium md:grid-cols-5">
              <span className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-2 text-indigo-700">Size: {queue.length}</span>
              <span className="rounded-lg border border-[#AAB76A] bg-[#F7F1DD] px-2 py-2 text-[#556B2F]">Max: {maxCapacity}</span>
              <span className="rounded-lg border border-[#D8CCA3] bg-[#F1E8C7] px-2 py-2 text-[#4B5320]">Empty: {isEmpty ? "true" : "false"}</span>
              <span className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-2 text-amber-700">Full: {isFull ? "true" : "false"}</span>
              <span className="rounded-lg border border-[#AAB76A] bg-[#F7F1DD] px-2 py-2 text-[#556B2F]">
                Highest: {highest ? `${highest.value} (P:${highest.priority})` : "N/A"}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <button onClick={handleInsert} className="rounded-xl bg-[#4B5320] px-3 py-2 text-sm font-medium text-white hover:bg-[#7D8F3B]">
              Insert
            </button>
            <button
              onClick={handleDeleteHighest}
              className="rounded-xl border border-[#D8CCA3] bg-[#F7F1DD] px-3 py-2 text-sm font-medium text-[#4B5320] hover:bg-[#F1E8C7]"
            >
              Delete Highest Priority
            </button>
            <button
              onClick={handlePeek}
              className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#7D8F3B] px-3 py-2 text-sm font-medium text-white hover:bg-[#F7F1DD]0"
            >
              <Eye className="h-4 w-4" />
              Peek Highest Priority
            </button>
            <button onClick={handleIsEmpty} className="rounded-xl border border-[#D8CCA3] bg-[#F7F1DD] px-3 py-2 text-sm font-medium text-[#4B5320] hover:bg-[#F1E8C7]">
              isEmpty
            </button>
            <button onClick={handleIsFull} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100">
              isFull
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#AAB76A] bg-[#F7F1DD] px-3 py-2 text-sm font-medium text-[#556B2F] hover:bg-[#F1E8C7]"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
          <div className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <h2 className="text-lg font-semibold text-[#4B5320]">Priority Queue Visual</h2>
            <p className="mt-1 text-xs font-medium text-[#556B2F]">FRONT par highest priority element</p>

            <div className="mt-4 rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] p-4">
              <AnimatePresence>
                {showOverflowWarning && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Priority Queue Overflow
                  </motion.div>
                )}
                {showUnderflowWarning && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-3 flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Priority Queue Underflow
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="mb-2 text-xs font-semibold text-[#556B2F]">FRONT</p>
              <div className={`space-y-2 rounded-xl border-2 bg-[#F7F1DD] p-3 ${isFull ? "border-amber-400" : "border-[#D8CCA3]"}`}>
                <AnimatePresence>
                  {queue.map((item, idx) => (
                    <motion.div
                      key={`${item.value}-${item.priority}-${idx}`}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        backgroundColor: idx === 0 && highlightFront ? "#bfdbfe" : "#f8fafc",
                      }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ type: "spring", stiffness: 280, damping: 22 }}
                      className="rounded-lg border border-[#D8CCA3] px-3 py-2 text-sm font-semibold text-[#4B5320]"
                    >
                      {item.value} | P:{item.priority}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {queue.length === 0 && (
                  <div className="rounded-lg border border-dashed border-[#D8CCA3] px-3 py-4 text-center text-sm text-[#556B2F]">Queue is empty</div>
                )}
              </div>
              <p className="mt-2 text-right text-xs font-semibold text-[#556B2F]">REAR</p>
            </div>

            <div className="mt-4 rounded-2xl border border-[#AAB76A] bg-[#F7F1DD] p-4">
              <p className="text-sm font-semibold text-[#556B2F]">Key Concept</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#556B2F]">
                <li>Priority Queue elements ko priority ke basis par process karti hai.</li>
                <li>Smaller priority number = higher priority.</li>
                <li>Same priority par FIFO apply hota hai.</li>
                <li>Array capacity fixed ho to overflow possible hai.</li>
              </ul>
            </div>

            <div className="mt-4 rounded-2xl border border-[#AAB76A] bg-[#F7F1DD] p-4">
              <p className="text-sm font-semibold text-[#4B5320]">Normal Queue vs Priority Queue</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#556B2F]">
                <li>Normal Queue FIFO strictly follow karti hai.</li>
                <li>Priority Queue priority-based ordering karti hai.</li>
                <li>Use cases: scheduling, emergency handling, critical task execution.</li>
              </ul>
            </div>

            <div className="mt-4 rounded-2xl border border-[#AAB76A] bg-[#F7F1DD] p-4">
              <p className="text-sm font-semibold text-[#556B2F]">Real-world Use Cases</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#556B2F]">
                <li>CPU Scheduling</li>
                <li>Emergency systems</li>
                <li>Network routing</li>
                <li>Task scheduling</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
              <h3 className="text-lg font-semibold text-[#4B5320]">Step Explanation</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Operation</p>
                  <p className="mt-1 font-medium text-[#4B5320]">{explanation.operation}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Concept</p>
                  <p className="mt-1 leading-6 text-[#4B5320]">{explanation.concept}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Step-by-step process</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-[#4B5320]">
                    {explanation.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Final priority queue</p>
                  <p className="mt-1 font-mono text-[#4B5320]">{explanation.finalQueue}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Time complexity</p>
                  <span className="rounded-full border border-[#AAB76A] bg-[#F7F1DD] px-2.5 py-1 text-xs font-semibold text-[#556B2F]">
                    {explanation.timeComplexity}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Exam note</p>
                  <p className="mt-1 leading-6 text-[#4B5320]">{explanation.examNote}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#D8CCA3] bg-[#4B5320] p-6 text-[#F7F1DD] shadow-[0_10px_30px_rgba(15,23,42,0.2)]">
              <h3 className="text-lg font-semibold text-[#AAB76A]">Pseudocode</h3>
              <div className="mt-3 space-y-1 font-mono text-sm leading-6 text-[#F7F1DD]/95">
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
