"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowDown, ArrowRight, Eye, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

type OperationKey = "enqueue" | "dequeue" | "peek-front" | "isempty" | "isfull" | "reset" | "idle";

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
  enqueue: [
    "if REAR == MAX - 1:",
    "    print \"Overflow\"",
    "else:",
    "    REAR = REAR + 1",
    "    queue[REAR] = value",
  ],
  dequeue: [
    "if FRONT > REAR:",
    "    print \"Underflow\"",
    "else:",
    "    value = queue[FRONT]",
    "    FRONT = FRONT + 1",
  ],
  "peek-front": [
    "if FRONT > REAR:",
    "    print \"Empty\"",
    "else:",
    "    print queue[FRONT]",
  ],
  isempty: ["if FRONT > REAR:", "    return true"],
  isfull: ["if REAR == MAX - 1:", "    return true"],
  reset: ["queue = [10, 20]", "FRONT = 0", "REAR = 1", "clear inputs"],
  idle: ["Select operation to view linear queue pseudocode."],
};

const formatQueue = (queue: string[]) =>
  queue.length === 0 ? "FRONT -> EMPTY <- REAR" : `FRONT [${queue.join(", ")}] REAR`;

export default function LinearQueuePage() {
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
    concept: "Queue FIFO (First In First Out) follow karta hai: jo pehle aata hai woh pehle nikalta hai.",
    steps: [
      "Enqueue REAR par hota hai.",
      "Dequeue FRONT se hota hai.",
      "Linear queue me once REAR reaches end, overflow aa sakta hai.",
    ],
    finalQueue: formatQueue(defaultQueue),
    timeComplexity: "Depends on operation",
    examNote: "Linear queue ke FRONT/REAR movement aur overflow-underflow conditions interview me frequently pooche jate hain.",
  });

  const frontIndex = queue.length === 0 ? -1 : 0;
  const rearIndex = queue.length === 0 ? -1 : queue.length - 1;
  const currentSize = queue.length;
  const isEmpty = currentSize === 0;
  const isFull = currentSize === maxCapacity;
  const pseudocode = useMemo(() => pseudocodeMap[activeOperation], [activeOperation]);

  const setValidationExplanation = (operation: OperationKey, message: string) => {
    setExplanation({
      operation: `${operation.toUpperCase()} (Validation)`,
      concept: message,
      steps: [
        "Operation run karne se pehle queue state validate hoti hai.",
        "Overflow/Underflow avoid karna runtime safety ke liye important hai.",
        "Correct value/capacity/state ke saath operation dobara run karo.",
      ],
      finalQueue: formatQueue(queue),
      timeComplexity: "O(1)",
      examNote: "Queue problems me FRONT aur REAR pointers ka boundary check mandatory hota hai.",
    });
  };

  const handleCapacityUpdate = () => {
    const parsed = Number(capacityInput);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setValidationExplanation("isfull", "Max capacity must be greater than 0.");
      return;
    }

    if (parsed < queue.length) {
      setValidationExplanation("isfull", `Current queue size ${queue.length} hai. Capacity isse chhoti set nahi kar sakte.`);
      return;
    }

    setMaxCapacity(parsed);
    setShowOverflowWarning(false);
    setExplanation({
      operation: "Capacity Update",
      concept:
        "Linear queue array capacity fixed hoti hai, aur yaha learning mode me MAX dynamically set kar sakte ho with safe checks.",
      steps: [
        `Max capacity ${parsed} set hui.`,
        "Current queue elements unchanged rahe.",
        "Ab overflow rule REAR == MAX-1 ke according evaluate hoga.",
      ],
      finalQueue: formatQueue(queue),
      timeComplexity: "O(1)",
      examNote: "Educationally cleaner approach: existing data protect karne ke liye too-small capacity reject ki gayi.",
    });
  };

  const handleEnqueue = () => {
    setActiveOperation("enqueue");
    if (valueInput.trim() === "") {
      setValidationExplanation("enqueue", "Please enter a value first.");
      return;
    }
    if (queue.length >= maxCapacity) {
      setShowOverflowWarning(true);
      setShowUnderflowWarning(false);
      setValidationExplanation("enqueue", "Queue Overflow");
      return;
    }

    const value = valueInput.trim();
    const next = [...queue, value];
    setQueue(next);
    setHighlightRear(true);
    setHighlightFront(false);
    setShowOverflowWarning(false);
    setShowUnderflowWarning(false);
    setExplanation({
      operation: "Enqueue",
      concept:
        "Enqueue me insertion REAR par hoti hai, REAR pointer move hota hai, aur FIFO property maintain hoti hai.",
      steps: [
        `Value ${value} REAR end par add hua.`,
        `REAR index ${next.length - 1} par shift hua.`,
        "Old elements apni order maintain karte hain, isliye FIFO consistent rehta hai.",
      ],
      finalQueue: formatQueue(next),
      timeComplexity: "O(1)",
      examNote: "Linear queue me enqueue tabhi possible hai jab capacity available ho, warna overflow hota hai.",
    });
  };

  const handleDequeue = () => {
    setActiveOperation("dequeue");
    if (queue.length === 0) {
      setShowUnderflowWarning(true);
      setShowOverflowWarning(false);
      setValidationExplanation("dequeue", "Queue Underflow");
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
      operation: "Dequeue",
      concept:
        "Dequeue me deletion FRONT se hoti hai, FRONT pointer move hota hai, aur FIFO property ensure karti hai ki sabse pehla element pehle nikle.",
      steps: [
        `FRONT element ${removed} remove hua.`,
        next.length === 0 ? "Queue empty ho gayi, FRONT/REAR reset state me chale gaye." : "FRONT next element par shift hua.",
        "Oldest element hi dequeue hua, jo FIFO ka core behavior hai.",
      ],
      finalQueue: formatQueue(next),
      timeComplexity: "O(1)",
      examNote: "Conceptually dequeue constant-time operation hai with pointer movement.",
    });
  };

  const handlePeekFront = () => {
    setActiveOperation("peek-front");
    if (queue.length === 0) {
      setShowUnderflowWarning(true);
      setShowOverflowWarning(false);
      setValidationExplanation("peek-front", "Queue Underflow");
      return;
    }

    const value = queue[0];
    setHighlightFront(true);
    setHighlightRear(false);
    setShowOverflowWarning(false);
    setShowUnderflowWarning(false);
    setExplanation({
      operation: "Peek Front",
      concept: "Peek Front me FRONT element access hota hai, deletion nahi hoti.",
      steps: [
        `FRONT index ${frontIndex} identify hua.`,
        `FRONT value ${value} read hui.`,
        "Queue structure unchanged rahi.",
      ],
      finalQueue: formatQueue(queue),
      timeComplexity: "O(1)",
      examNote: "Peek read-only operation hai, state mutate nahi karti.",
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
      concept: "isEmpty queue empty condition check karti hai.",
      steps: [
        "FRONT aur REAR logical state evaluate hui.",
        isEmpty ? "Queue me koi element nahi hai." : "Queue me elements present hain.",
        `Result: ${isEmpty ? "true" : "false"}`,
      ],
      finalQueue: formatQueue(queue),
      timeComplexity: "O(1)",
      examNote: "Queue operations se pehle isEmpty check underflow avoid karne ka basic guard hai.",
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
      concept: "isFull queue full condition check karti hai.",
      steps: [
        `Current size ${currentSize} aur max capacity ${maxCapacity} compare hui.`,
        isFull ? "Queue full hai, enqueue blocked rahega." : "Queue full nahi hai, enqueue possible hai.",
        `Result: ${isFull ? "true" : "false"}`,
      ],
      finalQueue: formatQueue(queue),
      timeComplexity: "O(1)",
      examNote: "Linear queue model me REAR == MAX-1 condition overflow indicator hoti hai.",
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
      concept: "Default queue restore hoti hai aur inputs clear hote hain.",
      steps: [
        "Queue default values [10, 20] par reset hui.",
        "Max capacity default 6 par reset hui.",
        "Input fields clear hue.",
      ],
      finalQueue: formatQueue(defaultQueue),
      timeComplexity: "O(n)",
      examNote: "Reset repeated practice ke liye stable baseline deta hai.",
    });
  };

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <Link href="/queue" className="text-blue-700 hover:text-blue-800">&larr; Back to Queue overview</Link>
          <Link href="/" className="text-blue-700 hover:text-blue-800">Back to homepage</Link>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Linear Queue Visualizer</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Explore FIFO queue behavior where enqueue happens at REAR and dequeue happens at FRONT.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                type="text"
                value={valueInput}
                onChange={(event) => setValueInput(event.target.value)}
                placeholder="Enter value"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none ring-cyan-300 transition focus:ring"
              />

              <div className="flex gap-2">
                <input
                  type="number"
                  value={capacityInput}
                  onChange={(event) => setCapacityInput(event.target.value)}
                  placeholder="Max capacity"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none ring-cyan-300 transition focus:ring"
                />
                <button onClick={handleCapacityUpdate} className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-100">Set Max</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-medium md:grid-cols-6">
              <span className="rounded-lg border border-cyan-200 bg-cyan-50 px-2 py-2 text-cyan-700">FRONT: {frontIndex}</span>
              <span className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-2 text-blue-700">REAR: {rearIndex}</span>
              <span className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-2 text-indigo-700">Size: {currentSize}</span>
              <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2 text-emerald-700">Max: {maxCapacity}</span>
              <span className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-2 text-slate-700">Empty: {isEmpty ? "true" : "false"}</span>
              <span className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-2 text-amber-700">Full: {isFull ? "true" : "false"}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <button onClick={handleEnqueue} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">Enqueue</button>
            <button onClick={handleDequeue} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Dequeue</button>
            <button onClick={handlePeekFront} className="inline-flex items-center justify-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"><Eye className="h-4 w-4" />Peek Front</button>
            <button onClick={handleIsEmpty} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">isEmpty</button>
            <button onClick={handleIsFull} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100">isFull</button>
            <button onClick={handleReset} className="inline-flex items-center justify-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-700 hover:bg-cyan-100"><RotateCcw className="h-4 w-4" />Reset</button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <h2 className="text-lg font-semibold text-slate-900">Linear Queue Visual</h2>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <AnimatePresence>
                {showOverflowWarning && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Queue Overflow
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
                    Queue Underflow
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mb-2 flex justify-between text-xs font-semibold text-blue-700">
                <span className={highlightFront ? "text-emerald-700" : ""}>FRONT</span>
                <span className={highlightRear ? "text-emerald-700" : ""}>REAR</span>
              </div>
              <div className="mb-2 flex justify-between text-blue-600">
                <ArrowDown className="h-4 w-4" />
                <ArrowDown className="h-4 w-4" />
              </div>

              <div className={`rounded-xl border-2 bg-white p-2 ${isFull ? "border-amber-400" : "border-slate-300"}`}>
                <div className="grid grid-cols-6 gap-2">
                  {Array.from({ length: maxCapacity }).map((_, slotIndex) => {
                    const value = queue[slotIndex];
                    const isFrontSlot = !isEmpty && slotIndex === 0;
                    const isRearSlot = !isEmpty && slotIndex === queue.length - 1;
                    return (
                      <motion.div
                        key={`slot-${slotIndex}-${value ?? "empty"}`}
                        layout
                        initial={{ opacity: 0.8, y: 6 }}
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
                        className="rounded-lg border border-slate-300 px-2 py-3 text-center text-sm font-semibold text-slate-800"
                      >
                        {value ?? ""}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800">Key Concept</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-emerald-700">
                <li>Queue follows FIFO.</li>
                <li>Enqueue at REAR.</li>
                <li>Dequeue from FRONT.</li>
                <li>Linear queue can waste space.</li>
                <li>Overflow and Underflow possible.</li>
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Final queue</p>
                  <p className="mt-1 font-mono text-slate-800">{explanation.finalQueue}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Time complexity</p>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{explanation.timeComplexity}</span>
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
                  <p key={`${line}-${idx}`}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
