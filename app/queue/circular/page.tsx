"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowDown, Eye, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

type OperationKey = "enqueue" | "dequeue" | "peek-front" | "isempty" | "isfull" | "reset" | "idle";
type ViewMode = "logical" | "actual";

type ExplanationData = {
  operation: string;
  concept: string;
  steps: string[];
  finalQueue: string;
  timeComplexity: string;
  examNote: string;
};

const defaultValues = ["10", "20"];
const defaultMaxCapacity = 6;

const pseudocodeMap: Record<OperationKey, string[]> = {
  enqueue: [
    "if (REAR + 1) % MAX == FRONT:",
    "    print \"Overflow\"",
    "",
    "else if FRONT == -1:",
    "    FRONT = 0",
    "    REAR = 0",
    "",
    "else:",
    "    REAR = (REAR + 1) % MAX",
    "",
    "queue[REAR] = value",
  ],
  dequeue: [
    "if FRONT == -1:",
    "    print \"Underflow\"",
    "",
    "else if FRONT == REAR:",
    "    FRONT = -1",
    "    REAR = -1",
    "",
    "else:",
    "    FRONT = (FRONT + 1) % MAX",
  ],
  "peek-front": ["if FRONT == -1:", "    print \"Empty\"", "else:", "    print queue[FRONT]"],
  isempty: ["if FRONT == -1:", "    return true"],
  isfull: ["if (REAR + 1) % MAX == FRONT:", "    return true"],
  reset: ["queue = [10, 20]", "FRONT = 0", "REAR = 1", "clear inputs"],
  idle: ["Select operation to view circular queue pseudocode."],
};

type QueueState = {
  arr: (string | null)[];
  front: number;
  rear: number;
  size: number;
};

const buildDefaultState = (capacity: number): QueueState => {
  const arr = Array.from({ length: capacity }, () => null as string | null);
  arr[0] = defaultValues[0];
  if (capacity > 1) arr[1] = defaultValues[1];
  return { arr, front: 0, rear: Math.min(1, capacity - 1), size: Math.min(defaultValues.length, capacity) };
};

const getQueueOrder = (state: QueueState): string[] => {
  if (state.front === -1 || state.size === 0) return [];
  const out: string[] = [];
  let idx = state.front;
  for (let count = 0; count < state.size; count += 1) {
    const value = state.arr[idx];
    if (value !== null) out.push(value);
    idx = (idx + 1) % state.arr.length;
  }
  return out;
};

const formatQueue = (state: QueueState) => {
  const order = getQueueOrder(state);
  return order.length === 0 ? "FRONT -> EMPTY <- REAR" : `FRONT [${order.join(", ")}] REAR`;
};

export default function CircularQueuePage() {
  const [maxCapacity, setMaxCapacity] = useState(defaultMaxCapacity);
  const [capacityInput, setCapacityInput] = useState(String(defaultMaxCapacity));
  const [valueInput, setValueInput] = useState("");
  const [queue, setQueue] = useState<QueueState>(buildDefaultState(defaultMaxCapacity));
  const [activeOperation, setActiveOperation] = useState<OperationKey>("idle");
  const [viewMode, setViewMode] = useState<ViewMode>("logical");
  const [highlightFront, setHighlightFront] = useState(false);
  const [highlightRear, setHighlightRear] = useState(false);
  const [showOverflowWarning, setShowOverflowWarning] = useState(false);
  const [showUnderflowWarning, setShowUnderflowWarning] = useState(false);
  const [showWrapPulse, setShowWrapPulse] = useState(false);
  const [explanation, setExplanation] = useState<ExplanationData>({
    operation: "Overview",
    concept: "Circular Queue FIFO follow karta hai, lekin modulo wrap-around ke through empty slots reuse karta hai.",
    steps: [
      "FRONT dequeue side ko represent karta hai.",
      "REAR enqueue side ko represent karta hai.",
      "(REAR + 1) % MAX formula overflow check ke liye use hota hai.",
    ],
    finalQueue: formatQueue(buildDefaultState(defaultMaxCapacity)),
    timeComplexity: "Depends on operation",
    examNote: "Circular queue me stopping aur wrap-around conditions clear rakhna exam me important hota hai.",
  });

  const isEmpty = queue.front === -1;
  const isFull = !isEmpty && (queue.rear + 1) % maxCapacity === queue.front;
  const pseudocode = useMemo(() => pseudocodeMap[activeOperation], [activeOperation]);
  const orderedQueue = getQueueOrder(queue);

  const setValidationExplanation = (operation: OperationKey, message: string) => {
    setExplanation({
      operation: `${operation.toUpperCase()} (Validation)`,
      concept: message,
      steps: [
        "Operation se pehle circular queue state validate hoti hai.",
        "Wrong state handling se overflow/underflow aa sakta hai.",
        "Correct input/state ke saath operation dobara run karo.",
      ],
      finalQueue: formatQueue(queue),
      timeComplexity: "O(1)",
      examNote: "Circular pointer equations ko boundary checks ke saath likhna scoring hota hai.",
    });
  };

  const handleCapacityUpdate = () => {
    const parsed = Number(capacityInput);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setValidationExplanation("isfull", "Max capacity must be greater than 0.");
      return;
    }
    if (parsed < queue.size) {
      setValidationExplanation("isfull", `Current queue size ${queue.size} hai. Isse chhoti capacity set nahi kar sakte.`);
      return;
    }

    const ordered = getQueueOrder(queue);
    const nextArr = Array.from({ length: parsed }, () => null as string | null);
    ordered.forEach((value, idx) => {
      nextArr[idx] = value;
    });
    const nextFront = ordered.length === 0 ? -1 : 0;
    const nextRear = ordered.length === 0 ? -1 : ordered.length - 1;

    setMaxCapacity(parsed);
    setQueue({ arr: nextArr, front: nextFront, rear: nextRear, size: ordered.length });
    setShowOverflowWarning(false);
    setShowUnderflowWarning(false);
    setExplanation({
      operation: "Capacity Update",
      concept: "Circular queue capacity update me existing order preserve karte hue array remap kiya gaya.",
      steps: [
        `Max capacity ${parsed} set hui.`,
        "Queue elements FRONT se REAR order me preserve hue.",
        "Pointers reset hue with same logical queue order.",
      ],
      finalQueue: ordered.length === 0 ? "FRONT -> EMPTY <- REAR" : `FRONT [${ordered.join(", ")}] REAR`,
      timeComplexity: "O(n)",
      examNote: "Capacity change ke time logical order preserve karna implementation clarity dikhata hai.",
    });
  };

  const handleEnqueue = () => {
    setActiveOperation("enqueue");
    const value = valueInput.trim();
    if (value === "") {
      setValidationExplanation("enqueue", "Please enter a value first.");
      return;
    }
    if (isFull) {
      setShowOverflowWarning(true);
      setShowUnderflowWarning(false);
      setValidationExplanation("enqueue", "Circular Queue Overflow");
      return;
    }

    let nextFront = queue.front;
    let nextRear = queue.rear;
    const nextArr = [...queue.arr];

    if (isEmpty) {
      nextFront = 0;
      nextRear = 0;
    } else {
      const oldRear = queue.rear;
      nextRear = (queue.rear + 1) % maxCapacity;
      setShowWrapPulse(oldRear > nextRear);
    }

    nextArr[nextRear] = value;
    const nextState: QueueState = { arr: nextArr, front: nextFront, rear: nextRear, size: queue.size + 1 };

    setQueue(nextState);
    setHighlightRear(true);
    setHighlightFront(false);
    setShowOverflowWarning(false);
    setShowUnderflowWarning(false);
    setExplanation({
      operation: "Enqueue",
      concept: "Enqueue me insertion REAR par hoti hai, modulo wrap-around use hota hai, empty spaces reuse hoti hain, aur FIFO maintained rehta hai.",
      steps: [
        `Value ${value} insert karne se pehle full condition check hui: (REAR + 1) % MAX == FRONT.`,
        isEmpty ? "Queue empty thi, FRONT=0 aur REAR=0 set hua." : `REAR modulo logic se update hua to ${nextRear}.`,
        "Value updated REAR slot par store hua, queue order maintain raha.",
      ],
      finalQueue: formatQueue(nextState),
      timeComplexity: "O(1)",
      examNote: "Circular queue ka main benefit hai wrap-around se space reuse hona.",
    });
  };

  const handleDequeue = () => {
    setActiveOperation("dequeue");
    if (isEmpty) {
      setShowUnderflowWarning(true);
      setShowOverflowWarning(false);
      setValidationExplanation("dequeue", "Circular Queue Underflow");
      return;
    }

    const nextArr = [...queue.arr];
    const removed = nextArr[queue.front] ?? "";
    nextArr[queue.front] = null;

    let nextFront = queue.front;
    let nextRear = queue.rear;
    const nextSize = queue.size - 1;

    if (queue.front === queue.rear) {
      nextFront = -1;
      nextRear = -1;
    } else {
      const oldFront = queue.front;
      nextFront = (queue.front + 1) % maxCapacity;
      setShowWrapPulse(oldFront > nextFront);
    }

    const nextState: QueueState = { arr: nextArr, front: nextFront, rear: nextRear, size: nextSize };

    setQueue(nextState);
    setHighlightFront(true);
    setHighlightRear(false);
    setShowOverflowWarning(false);
    setShowUnderflowWarning(false);
    setExplanation({
      operation: "Dequeue",
      concept: "Deletion FRONT se hoti hai aur FRONT circularly move karta hai.",
      steps: [
        `FRONT value ${removed} remove hua.`,
        queue.front === queue.rear ? "Single element case me FRONT aur REAR dono -1 par reset hue." : `FRONT modulo logic se ${nextFront} par move hua.`,
        "FIFO maintain raha kyunki oldest element remove hua.",
      ],
      finalQueue: formatQueue(nextState),
      timeComplexity: "O(1)",
      examNote: "Circular dequeue me FRONT update modulo based hota hai.",
    });
  };

  const handlePeekFront = () => {
    setActiveOperation("peek-front");
    if (isEmpty) {
      setShowUnderflowWarning(true);
      setShowOverflowWarning(false);
      setValidationExplanation("peek-front", "Circular Queue Underflow");
      return;
    }

    const frontValue = queue.arr[queue.front] ?? "";
    setHighlightFront(true);
    setHighlightRear(false);
    setShowOverflowWarning(false);
    setShowUnderflowWarning(false);
    setExplanation({
      operation: "Peek Front",
      concept: "Peek Front me FRONT element access hota hai, deletion nahi hoti.",
      steps: [`FRONT index ${queue.front} identify hua.`, `FRONT value ${frontValue} read ki gayi.`, "Queue state unchanged rahi."],
      finalQueue: formatQueue(queue),
      timeComplexity: "O(1)",
      examNote: "Peek read-only operation hai aur queue mutate nahi karti.",
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
      concept: "Circular queue empty condition FRONT == -1 se check hoti hai.",
      steps: [
        "FRONT pointer evaluate hua.",
        isEmpty ? "FRONT == -1 mila, queue empty hai." : `FRONT == ${queue.front}, queue empty nahi hai.`,
        `Result: ${isEmpty ? "true" : "false"}`,
      ],
      finalQueue: formatQueue(queue),
      timeComplexity: "O(1)",
      examNote: "Underflow avoid karne ke liye isEmpty pre-check useful hota hai.",
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
      concept: "Circular queue full condition (REAR + 1) % MAX == FRONT hoti hai.",
      steps: [
        `REAR ${queue.rear} aur FRONT ${queue.front} ke saath formula check hua.`,
        `Computed: (${queue.rear} + 1) % ${maxCapacity} == ${queue.front}`,
        `Result: ${isFull ? "true" : "false"}`,
      ],
      finalQueue: formatQueue(queue),
      timeComplexity: "O(1)",
      examNote: "Ye condition linear queue se different hai aur circular model ka core rule hai.",
    });
  };

  const handleReset = () => {
    setActiveOperation("reset");
    const resetState = buildDefaultState(defaultMaxCapacity);
    setQueue(resetState);
    setValueInput("");
    setCapacityInput(String(defaultMaxCapacity));
    setMaxCapacity(defaultMaxCapacity);
    setHighlightFront(false);
    setHighlightRear(false);
    setShowOverflowWarning(false);
    setShowUnderflowWarning(false);
    setShowWrapPulse(false);
    setExplanation({
      operation: "Reset",
      concept: "Default queue restore hoti hai, pointers reset hote hain, aur inputs clear hote hain.",
      steps: ["Queue default values [10, 20] par reset hui.", "FRONT=0 aur REAR=1 reset hue.", "Inputs aur highlight states clear ho gaye."],
      finalQueue: formatQueue(resetState),
      timeComplexity: "O(n)",
      examNote: "Reset se circular state consistent baseline par wapas aa jati hai.",
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Circular Queue Visualizer</h1>
          <p className="mt-3 max-w-3xl text-slate-600">Understand circular FIFO behavior with modulo wrap-around where empty slots get reused efficiently.</p>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input type="text" value={valueInput} onChange={(event) => setValueInput(event.target.value)} placeholder="Enter value" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none ring-cyan-300 transition focus:ring" />
              <div className="flex gap-2">
                <input type="number" value={capacityInput} onChange={(event) => setCapacityInput(event.target.value)} placeholder="Max capacity" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none ring-cyan-300 transition focus:ring" />
                <button onClick={handleCapacityUpdate} className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-100">Set Max</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-medium md:grid-cols-6">
              <span className="rounded-lg border border-cyan-200 bg-cyan-50 px-2 py-2 text-cyan-700">FRONT: {queue.front}</span>
              <span className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-2 text-blue-700">REAR: {queue.rear}</span>
              <span className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-2 text-indigo-700">Size: {queue.size}</span>
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
            <h2 className="text-lg font-semibold text-slate-900">Circular Queue Visual</h2>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <AnimatePresence>
                {showOverflowWarning && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                    <AlertTriangle className="h-4 w-4" />Circular Queue Overflow
                  </motion.div>
                )}
                {showUnderflowWarning && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-3 flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">
                    <AlertTriangle className="h-4 w-4" />Circular Queue Underflow
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mb-3 inline-flex rounded-xl border border-slate-200 bg-white p-1 text-xs font-medium">
                <button onClick={() => setViewMode("logical")} className={`rounded-lg px-3 py-1.5 ${viewMode === "logical" ? "bg-cyan-100 text-cyan-800" : "text-slate-600"}`}>Logical Queue View</button>
                <button onClick={() => setViewMode("actual")} className={`rounded-lg px-3 py-1.5 ${viewMode === "actual" ? "bg-cyan-100 text-cyan-800" : "text-slate-600"}`}>Actual Circular Array</button>
              </div>

              {viewMode === "logical" ? (
                <div>
                  {orderedQueue.length === 0 ? (
                    <div className="text-sm text-slate-500">FRONT -&gt; EMPTY &lt;- REAR</div>
                  ) : (
                    <div className="rounded-xl border border-cyan-200 bg-cyan-50/60 p-3">
                      <div className="mb-2 flex justify-between text-xs font-semibold text-blue-700">
                        <span>FRONT</span>
                        <span>REAR</span>
                      </div>
                      <div className="mb-2 flex justify-between text-blue-600">
                        <ArrowDown className="h-4 w-4" />
                        <ArrowDown className="h-4 w-4" />
                      </div>
                      <motion.div layout className="flex flex-wrap items-center gap-2">
                        <AnimatePresence>
                          {orderedQueue.map((value, idx) => (
                            <motion.div
                              key={`logical-${value}-${idx}`}
                              layout
                              initial={{ opacity: 0, y: 8, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -8, scale: 0.92 }}
                              transition={{ type: "spring", stiffness: 300, damping: 22 }}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm"
                            >
                              {value}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="mb-2 text-xs font-semibold text-slate-600">Index</div>
                  <div className="mb-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${maxCapacity}, minmax(0, 1fr))` }}>
                    {Array.from({ length: maxCapacity }).map((_, idx) => (
                      <p key={`idx-${idx}`} className="text-center text-xs font-medium text-slate-500">{idx}</p>
                    ))}
                  </div>

                  <div className={`rounded-xl border-2 bg-white p-2 ${isFull ? "border-amber-400" : "border-slate-300"}`}>
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${maxCapacity}, minmax(0, 1fr))` }}>
                      {queue.arr.map((value, idx) => {
                        const isFrontSlot = !isEmpty && idx === queue.front;
                        const isRearSlot = !isEmpty && idx === queue.rear;
                        return (
                          <motion.div
                            key={`slot-${idx}-${value ?? "empty"}`}
                            layout
                            initial={{ opacity: 0.85, y: 6 }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              backgroundColor: value
                                ? isFrontSlot
                                  ? "#a7f3d0"
                                  : isRearSlot
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

                  <div className="mt-3 flex items-center justify-between text-xs font-semibold text-blue-700">
                    <span className={highlightFront ? "text-emerald-700" : ""}>FRONT</span>
                    <span className={highlightRear ? "text-emerald-700" : ""}>REAR</span>
                  </div>
                  <div className="mb-2 flex items-center justify-between text-blue-600">
                    <ArrowDown className="h-4 w-4" />
                    <ArrowDown className="h-4 w-4" />
                  </div>
                </div>
              )}

              <motion.div animate={showWrapPulse ? { rotate: [0, 6, 0, -6, 0] } : { rotate: 0 }} transition={{ duration: 0.7 }} className="mt-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700">
                Wrap-around: index = (index + 1) % MAX
              </motion.div>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800">Key Concept</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-emerald-700">
                <li>Circular Queue follows FIFO.</li>
                <li>Empty spaces are reused.</li>
                <li>Wrap-around uses modulo operator.</li>
                <li>Overflow condition differs from Linear Queue.</li>
                <li>Better memory utilization.</li>
              </ul>
              <p className="mt-3 text-sm text-emerald-800">Circular Queue me dequeue ke baad elements physically shift nahi hote. Sirf FRONT pointer move hota hai, jisse operations O(1) time me perform hote hain.</p>
            </div>

            <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-800">Linear Queue vs Circular Queue</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-blue-700">
                <li>Linear queue me dequeue ke baad front spaces waste ho sakte hain.</li>
                <li>Circular queue modulo wrap se same spaces reuse karti hai.</li>
                <li>Pointer movement circular queue me more memory-efficient hota hai.</li>
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
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Final queue</p><p className="mt-1 font-mono text-slate-800">{explanation.finalQueue}</p></div>
                <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Time complexity</p><span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{explanation.timeComplexity}</span></div>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Exam note</p><p className="mt-1 leading-6 text-slate-700">{explanation.examNote}</p></div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.2)]">
              <h3 className="text-lg font-semibold text-cyan-200">Pseudocode</h3>
              <div className="mt-3 space-y-1 font-mono text-sm leading-6 text-slate-100/95">
                {pseudocode.map((line, idx) => (<p key={`${line}-${idx}`}>{line === "" ? " " : line}</p>))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
