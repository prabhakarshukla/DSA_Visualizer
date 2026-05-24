"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowDown, Eye, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

type OperationKey =
  | "insert-front"
  | "insert-rear"
  | "delete-front"
  | "delete-rear"
  | "peek-front"
  | "peek-rear"
  | "isempty"
  | "isfull"
  | "reset"
  | "idle";

type ExplanationData = {
  operation: string;
  concept: string;
  steps: string[];
  finalQueue: string;
  timeComplexity: string;
  examNote: string;
};

const defaultQueue = ["10", "20"];
const defaultMaxCapacity = 6;

const pseudocodeMap: Record<OperationKey, string[]> = {
  "insert-front": [
    "if size == MAX:",
    "    print \"Overflow\"",
    "else:",
    "    shift elements right by 1",
    "    queue[0] = value",
  ],
  "insert-rear": [
    "if size == MAX:",
    "    print \"Overflow\"",
    "else:",
    "    queue[size] = value",
    "    size = size + 1",
  ],
  "delete-front": [
    "if size == 0:",
    "    print \"Underflow\"",
    "else:",
    "    remove queue[0]",
    "    shift elements left by 1",
  ],
  "delete-rear": [
    "if size == 0:",
    "    print \"Underflow\"",
    "else:",
    "    remove queue[size - 1]",
  ],
  "peek-front": ["if size == 0: print \"Empty\"", "else: print queue[0]"],
  "peek-rear": ["if size == 0: print \"Empty\"", "else: print queue[size - 1]"],
  isempty: ["if size == 0:", "    return true", "else:", "    return false"],
  isfull: ["if size == MAX:", "    return true", "else:", "    return false"],
  reset: ["queue = [10, 20]", "MAX = 6", "clear highlights", "clear inputs"],
  idle: ["Select operation to view Double Ended Queue pseudocode."],
};

const formatQueue = (queue: string[]) =>
  queue.length === 0 ? "FRONT -> EMPTY <- REAR" : `FRONT [${queue.join(", ")}] REAR`;

export default function DoubleEndedQueuePage() {
  const [queue, setQueue] = useState<string[]>(defaultQueue);
  const [valueInput, setValueInput] = useState("");
  const [capacityInput, setCapacityInput] = useState(String(defaultMaxCapacity));
  const [maxCapacity, setMaxCapacity] = useState(defaultMaxCapacity);
  const [activeOperation, setActiveOperation] = useState<OperationKey>("idle");
  const [highlightFront, setHighlightFront] = useState(false);
  const [highlightRear, setHighlightRear] = useState(false);
  const [showOverflowWarning, setShowOverflowWarning] = useState(false);
  const [showUnderflowWarning, setShowUnderflowWarning] = useState(false);
  const [explanation, setExplanation] = useState<ExplanationData>({
    operation: "Overview",
    concept:
      "Double Ended Queue (Deque) me insertion aur deletion dono ends se possible hota hai: FRONT se bhi aur REAR se bhi.",
    steps: [
      "Insert Front / Delete Front front side par operate karte hain.",
      "Insert Rear / Delete Rear rear side par operate karte hain.",
      "Capacity exceed hone par overflow aur empty hone par underflow aata hai.",
    ],
    finalQueue: formatQueue(defaultQueue),
    timeComplexity: "Depends on operation",
    examNote: "Deque queue se zyada flexible hai kyunki dono ends par operations allow karta hai.",
  });

  const currentSize = queue.length;
  const frontIndex = queue.length === 0 ? -1 : 0;
  const rearIndex = queue.length === 0 ? -1 : queue.length - 1;
  const isEmpty = queue.length === 0;
  const isFull = queue.length === maxCapacity;
  const pseudocode = useMemo(() => pseudocodeMap[activeOperation], [activeOperation]);

  const setValidationExplanation = (operation: OperationKey, message: string) => {
    setExplanation({
      operation: `${operation.toUpperCase()} (Validation)`,
      concept: message,
      steps: [
        "Operation run karne se pehle queue state validate hoti hai.",
        "Invalid state handle na karo to overflow/underflow aa sakta hai.",
        "Correct input/state ke saath operation dobara run karo.",
      ],
      finalQueue: formatQueue(queue),
      timeComplexity: "O(1)",
      examNote: "Boundary checks interviews me expected hote hain.",
    });
  };

  const handleCapacityUpdate = () => {
    const parsed = Number(capacityInput);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setValidationExplanation("isfull", "Max capacity must be greater than 0.");
      return;
    }
    if (parsed < queue.length) {
      setValidationExplanation("isfull", `Current queue size ${queue.length} hai. Isse chhoti capacity set nahi kar sakte.`);
      return;
    }

    setMaxCapacity(parsed);
    setShowOverflowWarning(false);
    setExplanation({
      operation: "Capacity Update",
      concept: "Array-backed Double Ended Queue me max capacity fixed hoti hai, aur yaha controlled way me update ho rahi hai.",
      steps: [
        `Max capacity ${parsed} set hui.`,
        "Current queue order unchanged raha.",
        "Ab full condition size == MAX ke against check hogi.",
      ],
      finalQueue: formatQueue(queue),
      timeComplexity: "O(1)",
      examNote: "Educational clarity ke liye too-small capacity reject karna safer approach hai.",
    });
  };

  const handleInsertFront = () => {
    setActiveOperation("insert-front");
    const value = valueInput.trim();
    if (value === "") {
      setValidationExplanation("insert-front", "Please enter a value first.");
      return;
    }
    if (isFull) {
      setShowOverflowWarning(true);
      setShowUnderflowWarning(false);
      setValidationExplanation("insert-front", "Double Ended Queue Overflow");
      return;
    }

    const next = [value, ...queue];
    setQueue(next);
    setHighlightFront(true);
    setHighlightRear(false);
    setShowOverflowWarning(false);
    setShowUnderflowWarning(false);
    setExplanation({
      operation: "Insert Front",
      concept: "Deque me FRONT side par direct insertion possible hai.",
      steps: [
        `Value ${value} FRONT par insert hua.`,
        "FRONT pointer same conceptual position par raha lekin new element first ban gaya.",
        "Queue order rear side ke relative preserve raha.",
      ],
      finalQueue: formatQueue(next),
      timeComplexity: "O(1)",
      examNote: "Deque ki flexibility ka main point: front insertion allowed hota hai.",
    });
  };

  const handleInsertRear = () => {
    setActiveOperation("insert-rear");
    const value = valueInput.trim();
    if (value === "") {
      setValidationExplanation("insert-rear", "Please enter a value first.");
      return;
    }
    if (isFull) {
      setShowOverflowWarning(true);
      setShowUnderflowWarning(false);
      setValidationExplanation("insert-rear", "Double Ended Queue Overflow");
      return;
    }

    const next = [...queue, value];
    setQueue(next);
    setHighlightFront(false);
    setHighlightRear(true);
    setShowOverflowWarning(false);
    setShowUnderflowWarning(false);
    setExplanation({
      operation: "Insert Rear",
      concept: "Deque me REAR side par insertion queue style me hoti hai.",
      steps: [
        `Value ${value} REAR par add hua.`,
        `REAR index ${next.length - 1} par shift hua.`,
        "Front side ke elements unchanged rahe.",
      ],
      finalQueue: formatQueue(next),
      timeComplexity: "O(1)",
      examNote: "Deque queue ka superset hai, isliye rear insertion normal enqueue jaisa hota hai.",
    });
  };

  const handleDeleteFront = () => {
    setActiveOperation("delete-front");
    if (isEmpty) {
      setShowUnderflowWarning(true);
      setShowOverflowWarning(false);
      setValidationExplanation("delete-front", "Double Ended Queue Underflow");
      return;
    }

    const removed = queue[0];
    const next = queue.slice(1);
    setQueue(next);
    setHighlightFront(true);
    setHighlightRear(false);
    setShowOverflowWarning(false);
    setShowUnderflowWarning(false);
    setExplanation({
      operation: "Delete Front",
      concept: "Deque me FRONT se deletion directly allowed hoti hai.",
      steps: [
        `FRONT element ${removed} remove hua.`,
        next.length === 0 ? "Queue empty ho gayi." : "Naya FRONT next element ban gaya.",
        "Remaining order preserve raha.",
      ],
      finalQueue: formatQueue(next),
      timeComplexity: "O(1)",
      examNote: "Front deletion deque ko stack-queue hybrid jaisa powerful banata hai.",
    });
  };

  const handleDeleteRear = () => {
    setActiveOperation("delete-rear");
    if (isEmpty) {
      setShowUnderflowWarning(true);
      setShowOverflowWarning(false);
      setValidationExplanation("delete-rear", "Double Ended Queue Underflow");
      return;
    }

    const removed = queue[queue.length - 1];
    const next = queue.slice(0, -1);
    setQueue(next);
    setHighlightFront(false);
    setHighlightRear(true);
    setShowOverflowWarning(false);
    setShowUnderflowWarning(false);
    setExplanation({
      operation: "Delete Rear",
      concept: "Deque me REAR se bhi deletion possible hoti hai, jo normal queue se different hai.",
      steps: [
        `REAR element ${removed} remove hua.`,
        next.length === 0 ? "Queue empty ho gayi." : `REAR naya index ${next.length - 1} par shift hua.`,
        "Front side order unchanged raha.",
      ],
      finalQueue: formatQueue(next),
      timeComplexity: "O(1)",
      examNote: "Rear deletion deque ko bidirectional processing ke liye useful banata hai.",
    });
  };

  const handlePeekFront = () => {
    setActiveOperation("peek-front");
    if (isEmpty) {
      setShowUnderflowWarning(true);
      setShowOverflowWarning(false);
      setValidationExplanation("peek-front", "Double Ended Queue Underflow");
      return;
    }

    const value = queue[0];
    setHighlightFront(true);
    setHighlightRear(false);
    setShowOverflowWarning(false);
    setShowUnderflowWarning(false);
    setExplanation({
      operation: "Peek Front",
      concept: "Front value access hoti hai bina deletion ke.",
      steps: [
        `FRONT index ${frontIndex} identify hua.`,
        `Value ${value} read hui.`,
        "Queue structure unchanged rahi.",
      ],
      finalQueue: formatQueue(queue),
      timeComplexity: "O(1)",
      examNote: "Peek operations read-only hoti hain aur debugging me useful hoti hain.",
    });
  };

  const handlePeekRear = () => {
    setActiveOperation("peek-rear");
    if (isEmpty) {
      setShowUnderflowWarning(true);
      setShowOverflowWarning(false);
      setValidationExplanation("peek-rear", "Double Ended Queue Underflow");
      return;
    }

    const value = queue[queue.length - 1];
    setHighlightFront(false);
    setHighlightRear(true);
    setShowOverflowWarning(false);
    setShowUnderflowWarning(false);
    setExplanation({
      operation: "Peek Rear",
      concept: "Rear value access hoti hai bina deletion ke.",
      steps: [
        `REAR index ${rearIndex} identify hua.`,
        `Value ${value} read hui.`,
        "Queue state unchanged rahi.",
      ],
      finalQueue: formatQueue(queue),
      timeComplexity: "O(1)",
      examNote: "Deque ka rear peek operation queue se extra flexibility deta hai.",
    });
  };

  const handleIsEmpty = () => {
    setActiveOperation("isempty");
    setHighlightFront(false);
    setHighlightRear(false);
    setShowOverflowWarning(false);
    setShowUnderflowWarning(false);
    setExplanation({
      operation: "isEmpty",
      concept: "isEmpty check karta hai ki deque me koi element exist karta hai ya nahi.",
      steps: [
        "Current size evaluate hui.",
        isEmpty ? "Size 0 hai, deque empty hai." : `Size ${queue.length} hai, deque empty nahi hai.`,
        `Result: ${isEmpty ? "true" : "false"}`,
      ],
      finalQueue: formatQueue(queue),
      timeComplexity: "O(1)",
      examNote: "Underflow avoid karne ke liye isEmpty pre-check best practice hai.",
    });
  };

  const handleIsFull = () => {
    setActiveOperation("isfull");
    setHighlightFront(false);
    setHighlightRear(false);
    setShowOverflowWarning(isFull);
    setShowUnderflowWarning(false);
    setExplanation({
      operation: "isFull",
      concept: "isFull check karta hai ki size max capacity ke equal hai ya nahi.",
      steps: [
        `Current size ${queue.length} aur max ${maxCapacity} compare hui.`,
        isFull ? "Deque full hai, insertion block hoga." : "Deque full nahi hai, insertion possible hai.",
        `Result: ${isFull ? "true" : "false"}`,
      ],
      finalQueue: formatQueue(queue),
      timeComplexity: "O(1)",
      examNote: "Fixed capacity array model me isFull overflow prevention ka core guard hai.",
    });
  };

  const handleReset = () => {
    setActiveOperation("reset");
    setQueue(defaultQueue);
    setValueInput("");
    setCapacityInput(String(defaultMaxCapacity));
    setMaxCapacity(defaultMaxCapacity);
    setHighlightFront(false);
    setHighlightRear(false);
    setShowOverflowWarning(false);
    setShowUnderflowWarning(false);
    setExplanation({
      operation: "Reset",
      concept: "Default Double Ended Queue restore hota hai, highlights clear hote hain, inputs clear hote hain.",
      steps: [
        "Queue default [10, 20] par reset hui.",
        "Max capacity default 6 par reset hui.",
        "Input fields aur warnings clear ho gaye.",
      ],
      finalQueue: formatQueue(defaultQueue),
      timeComplexity: "O(n)",
      examNote: "Reset repeated practice ke liye useful baseline provide karta hai.",
    });
  };

  return (
    <main className="min-h-screen bg-[#F1E8C7] px-4 py-10 text-[#4B5320] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <Link href="/queue" className="text-[#7D8F3B] hover:text-[#4B5320]">&larr; Back to Queue overview</Link>
          <Link href="/" className="text-[#7D8F3B] hover:text-[#4B5320]">Back to homepage</Link>
        </div>

        <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#4B5320] sm:text-4xl">Double Ended Queue Visualizer</h1>
          <p className="mt-1 text-sm font-medium text-[#7D8F3B]">Also called Deque</p>
          <p className="mt-3 max-w-3xl text-[#9CA763]">
            A queue where insertion and deletion are possible from both FRONT and REAR.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input type="text" value={valueInput} onChange={(event) => setValueInput(event.target.value)} placeholder="Enter value" className="w-full rounded-xl border border-[#D8CCA3] bg-[#F1E8C7] px-4 py-2.5 text-sm outline-none ring-[#AAB76A] transition focus:ring" />
              <div className="flex gap-2">
                <input type="number" value={capacityInput} onChange={(event) => setCapacityInput(event.target.value)} placeholder="Max capacity" className="w-full rounded-xl border border-[#D8CCA3] bg-[#F1E8C7] px-4 py-2.5 text-sm outline-none ring-[#AAB76A] transition focus:ring" />
                <button onClick={handleCapacityUpdate} className="rounded-xl border border-[#AAB76A] bg-[#F7F1DD] px-3 py-2.5 text-xs font-semibold text-[#7D8F3B] hover:bg-[#F1E8C7]">Set Max</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-medium md:grid-cols-6">
              <span className="rounded-lg border border-[#AAB76A] bg-[#F7F1DD] px-2 py-2 text-[#7D8F3B]">FRONT: {frontIndex}</span>
              <span className="rounded-lg border border-[#AAB76A] bg-[#F7F1DD] px-2 py-2 text-[#7D8F3B]">REAR: {rearIndex}</span>
              <span className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-2 text-indigo-700">Size: {currentSize}</span>
              <span className="rounded-lg border border-[#AAB76A] bg-[#F7F1DD] px-2 py-2 text-[#7D8F3B]">Max: {maxCapacity}</span>
              <span className="rounded-lg border border-[#D8CCA3] bg-[#F1E8C7] px-2 py-2 text-[#4B5320]">Empty: {isEmpty ? "true" : "false"}</span>
              <span className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-2 text-amber-700">Full: {isFull ? "true" : "false"}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-9">
            <button onClick={handleInsertFront} className="rounded-xl bg-[#4B5320] px-3 py-2 text-sm font-medium text-white hover:bg-[#7D8F3B]">Insert Front</button>
            <button onClick={handleInsertRear} className="rounded-xl bg-[#4B5320] px-3 py-2 text-sm font-medium text-white hover:bg-[#7D8F3B]">Insert Rear</button>
            <button onClick={handleDeleteFront} className="rounded-xl border border-[#D8CCA3] bg-[#F7F1DD] px-3 py-2 text-sm font-medium text-[#4B5320] hover:bg-[#F1E8C7]">Delete Front</button>
            <button onClick={handleDeleteRear} className="rounded-xl border border-[#D8CCA3] bg-[#F7F1DD] px-3 py-2 text-sm font-medium text-[#4B5320] hover:bg-[#F1E8C7]">Delete Rear</button>
            <button onClick={handlePeekFront} className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#7D8F3B] px-3 py-2 text-sm font-medium text-white hover:bg-[#F7F1DD]0"><Eye className="h-4 w-4" />Peek Front</button>
            <button onClick={handlePeekRear} className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#7D8F3B] px-3 py-2 text-sm font-medium text-white hover:bg-[#F7F1DD]0"><Eye className="h-4 w-4" />Peek Rear</button>
            <button onClick={handleIsEmpty} className="rounded-xl border border-[#D8CCA3] bg-[#F7F1DD] px-3 py-2 text-sm font-medium text-[#4B5320] hover:bg-[#F1E8C7]">isEmpty</button>
            <button onClick={handleIsFull} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100">isFull</button>
            <button onClick={handleReset} className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#AAB76A] bg-[#F7F1DD] px-3 py-2 text-sm font-medium text-[#7D8F3B] hover:bg-[#F1E8C7]"><RotateCcw className="h-4 w-4" />Reset</button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
          <div className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <h2 className="text-lg font-semibold text-[#4B5320]">Double Ended Queue Visual</h2>

            <div className="mt-4 rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] p-4">
              <AnimatePresence>
                {showOverflowWarning && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                    <AlertTriangle className="h-4 w-4" />Double Ended Queue Overflow
                  </motion.div>
                )}
                {showUnderflowWarning && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-3 flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">
                    <AlertTriangle className="h-4 w-4" />Double Ended Queue Underflow
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mb-2 flex justify-between text-xs font-semibold text-[#7D8F3B]"><span className={highlightFront ? "text-[#7D8F3B]" : ""}>FRONT</span><span className={highlightRear ? "text-[#7D8F3B]" : ""}>REAR</span></div>
              <div className="mb-2 flex justify-between text-[#7D8F3B]"><ArrowDown className="h-4 w-4" /><ArrowDown className="h-4 w-4" /></div>

              <div className={`rounded-xl border-2 bg-[#F7F1DD] p-2 ${isFull ? "border-amber-400" : "border-[#D8CCA3]"}`}>
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${maxCapacity}, minmax(0, 1fr))` }}>
                  {Array.from({ length: maxCapacity }).map((_, idx) => {
                    const value = queue[idx];
                    const isFrontSlot = !isEmpty && idx === 0;
                    const isRearSlot = !isEmpty && idx === queue.length - 1;
                    return (
                      <motion.div
                        key={`slot-${idx}-${value ?? "empty"}`}
                        layout
                        initial={{ opacity: 0.85, y: 6 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          backgroundColor: value
                            ? isFrontSlot && highlightFront
                              ? "#a7f3d0"
                              : isRearSlot && highlightRear
                                ? "#bfdbfe"
                                : "#f8fafc"
                            : "#f1f5f9",
                        }}
                        transition={{ type: "spring", stiffness: 280, damping: 20 }}
                        className="rounded-lg border border-[#D8CCA3] px-2 py-3 text-center text-sm font-semibold text-[#4B5320]"
                      >
                        {value ?? ""}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#AAB76A] bg-[#F7F1DD] p-4">
              <p className="text-sm font-semibold text-[#7D8F3B]">Key Concept</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#7D8F3B]">
                <li>Double Ended Queue supports insertion/deletion at both ends.</li>
                <li>Insert Front and Insert Rear dono valid operations hain.</li>
                <li>Delete Front and Delete Rear dono allowed hain.</li>
                <li>Array-based model me fixed capacity overflow risk laata hai.</li>
                <li>Empty state par deletion/peek underflow trigger karte hain.</li>
              </ul>
            </div>

            <div className="mt-4 rounded-2xl border border-[#AAB76A] bg-[#F7F1DD] p-4">
              <p className="text-sm font-semibold text-[#4B5320]">Queue vs Double Ended Queue</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#7D8F3B]">
                <li>Queue me insertion rear par aur deletion front se hota hai.</li>
                <li>Double Ended Queue me dono ends par insertion/deletion allowed hota hai.</li>
                <li>Deque zyada flexible hota hai sliding-window aur undo-like use cases ke liye.</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
              <h3 className="text-lg font-semibold text-[#4B5320]">Step Explanation</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-[#9CA763]">Operation</p><p className="mt-1 font-medium text-[#4B5320]">{explanation.operation}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-[#9CA763]">Concept</p><p className="mt-1 leading-6 text-[#4B5320]">{explanation.concept}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-[#9CA763]">Step-by-step process</p><ul className="mt-1 list-disc space-y-1 pl-5 text-[#4B5320]">{explanation.steps.map((step) => (<li key={step}>{step}</li>))}</ul></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-[#9CA763]">Final queue</p><p className="mt-1 font-mono text-[#4B5320]">{explanation.finalQueue}</p></div>
                <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold uppercase tracking-wide text-[#9CA763]">Time complexity</p><span className="rounded-full border border-[#AAB76A] bg-[#F7F1DD] px-2.5 py-1 text-xs font-semibold text-[#7D8F3B]">{explanation.timeComplexity}</span></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-[#9CA763]">Exam note</p><p className="mt-1 leading-6 text-[#4B5320]">{explanation.examNote}</p></div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#D8CCA3] bg-[#4B5320] p-6 text-[#F7F1DD] shadow-[0_10px_30px_rgba(15,23,42,0.2)]">
              <h3 className="text-lg font-semibold text-[#AAB76A]">Pseudocode</h3>
              <div className="mt-3 space-y-1 font-mono text-sm leading-6 text-[#F7F1DD]/95">
                {pseudocode.map((line, idx) => (<p key={`${line}-${idx}`}>{line === "" ? " " : line}</p>))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
