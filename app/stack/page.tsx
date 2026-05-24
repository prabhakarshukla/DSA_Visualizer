"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowDown, Eye, RotateCcw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

type OperationKey = "push" | "pop" | "peek" | "isempty" | "isfull" | "reset" | "idle";

type ExplanationData = {
  operation: string;
  concept: string;
  steps: string[];
  finalStack: string;
  timeComplexity: string;
  examNote: string;
};

const defaultStack = ["10", "20"];
const defaultMaxSize = 6;

const pseudocodeMap: Record<OperationKey, string[]> = {
  push: [
    "if TOP == MAX - 1:",
    "    print \"Overflow\"",
    "else:",
    "    TOP = TOP + 1",
    "    stack[TOP] = value",
  ],
  pop: [
    "if TOP == -1:",
    "    print \"Underflow\"",
    "else:",
    "    value = stack[TOP]",
    "    TOP = TOP - 1",
  ],
  peek: ["if TOP == -1:", "    print \"Empty\"", "else:", "    print stack[TOP]"],
  isempty: ["if TOP == -1:", "    return true", "else:", "    return false"],
  isfull: ["if TOP == MAX - 1:", "    return true", "else:", "    return false"],
  reset: ["stack = [10, 20]", "clear highlight", "clear input", "TOP = stack.length - 1", "MAX = 6"],
  idle: ["Select operation to view stack pseudocode."],
};

const formatStack = (stack: string[]) =>
  stack.length === 0 ? "TOP -> EMPTY" : `BOTTOM [${stack.join(", ")}] TOP`;

export default function StackPage() {
  const [stack, setStack] = useState<string[]>(defaultStack);
  const [valueInput, setValueInput] = useState("");
  const [maxSize, setMaxSize] = useState<number>(defaultMaxSize);
  const [capacityInput, setCapacityInput] = useState<string>(String(defaultMaxSize));
  const [activeOperation, setActiveOperation] = useState<OperationKey>("idle");
  const [highlightTop, setHighlightTop] = useState(false);
  const [showOverflowWarning, setShowOverflowWarning] = useState(false);
  const [explanation, setExplanation] = useState<ExplanationData>({
    operation: "Overview",
    concept:
      "Stack ek linear data structure hai jo LIFO (Last In First Out) principle follow karta hai. Array-based stack me capacity fixed hoti hai.",
    steps: [
      "Insertion aur deletion dono TOP par hote hain.",
      "Push element add karta hai, Pop remove karta hai.",
      "Overflow tab hota hai jab TOP == MAX - 1 ho jata hai.",
    ],
    finalStack: formatStack(defaultStack),
    timeComplexity: "Depends on operation",
    examNote: "Stack problems me overflow/underflow checks explicitly likhna important hota hai.",
  });

  const topIndex = stack.length - 1;
  const currentSize = stack.length;
  const isEmpty = currentSize === 0;
  const isFull = currentSize === maxSize;
  const pseudocode = useMemo(() => pseudocodeMap[activeOperation], [activeOperation]);

  const setValidationExplanation = (operation: OperationKey, message: string) => {
    setExplanation({
      operation: `${operation.toUpperCase()} (Validation)`,
      concept: message,
      steps: [
        "Operation run karne se pehle stack state validate hoti hai.",
        "Overflow/Underflow avoid karna runtime safety ke liye zaroori hai.",
        "Correct input/state ke saath operation dobara run karo.",
      ],
      finalStack: formatStack(stack),
      timeComplexity: "O(1)",
      examNote: "Edge-case handling interview me direct scoring point hota hai.",
    });
  };

  const handleCapacityUpdate = () => {
    const parsed = Number(capacityInput);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setValidationExplanation("isfull", "Stack size must be greater than 0.");
      return;
    }

    if (parsed < stack.length) {
      setValidationExplanation(
        "isfull",
        `Current stack size ${stack.length} hai. Capacity ko isse chhota set nahi kar sakte.`
      );
      return;
    }

    setMaxSize(parsed);
    setShowOverflowWarning(false);
    setExplanation({
      operation: "Capacity Update",
      concept:
        "Array-based stack me capacity fixed hoti hai, aur yaha learning ke liye user controlled fixed capacity set kar sakte hain.",
      steps: [
        `MAX capacity ${parsed} set hui.`,
        "Current stack elements unchanged rahe.",
        "Ab overflow check TOP == MAX - 1 rule se hoga.",
      ],
      finalStack: formatStack(stack),
      timeComplexity: "O(1)",
      examNote: "Educationally cleaner approach: existing elements preserve karne ke liye too-small capacity reject ki gayi.",
    });
  };

  const handlePush = () => {
    setActiveOperation("push");
    if (valueInput.trim() === "") {
      setValidationExplanation("push", "Please enter a value first.");
      return;
    }
    if (stack.length >= maxSize) {
      setShowOverflowWarning(true);
      setValidationExplanation("push", "Stack Overflow");
      return;
    }

    const value = valueInput.trim();
    const next = [...stack, value];
    setStack(next);
    setShowOverflowWarning(false);
    setHighlightTop(true);
    setExplanation({
      operation: "Push",
      concept:
        "Push me insertion tabhi possible hai jab stack full na ho. New element TOP par add hota hai aur LIFO property maintain hoti hai.",
      steps: [
        `Full condition check hua: TOP (${stack.length - 1}) vs MAX-1 (${maxSize - 1}).`,
        `Value ${value} stack ke top par add hua.`,
        `TOP index ${next.length - 1} par move hua.`,
      ],
      finalStack: formatStack(next),
      timeComplexity: "O(1)",
      examNote: "Agar TOP == MAX-1 ho to push allowed nahi hota, warna overflow hota hai.",
    });
  };

  const handlePop = () => {
    setActiveOperation("pop");
    setShowOverflowWarning(false);
    if (stack.length === 0) {
      setValidationExplanation("pop", "Stack Underflow");
      return;
    }

    const removed = stack[stack.length - 1];
    const next = stack.slice(0, -1);
    setStack(next);
    setHighlightTop(true);
    setExplanation({
      operation: "Pop",
      concept:
        "Pop me TOP element remove hota hai, TOP next lower element par shift hota hai, aur LIFO behavior clearly dikhai deta hai.",
      steps: [
        `TOP element ${removed} remove hua.`,
        next.length === 0 ? "Stack empty ho gaya aur TOP = -1 ho gaya." : `TOP ab index ${next.length - 1} par shift hua.`,
        "Jo element sabse last push hua tha wahi pehle pop hua.",
      ],
      finalStack: formatStack(next),
      timeComplexity: "O(1)",
      examNote: "Pop constant time operation hai kyunki sirf TOP pointer update hota hai.",
    });
  };

  const handlePeek = () => {
    setActiveOperation("peek");
    setShowOverflowWarning(false);
    if (stack.length === 0) {
      setValidationExplanation("peek", "Stack Underflow");
      return;
    }

    const value = stack[stack.length - 1];
    setHighlightTop(true);
    setExplanation({
      operation: "Peek",
      concept: "Peek me sirf TOP element access hota hai, deletion nahi hoti.",
      steps: [
        `TOP index ${stack.length - 1} identify hua.`,
        `TOP value ${value} read ki gayi bina remove kiye.`,
        "Stack structure unchanged raha.",
      ],
      finalStack: formatStack(stack),
      timeComplexity: "O(1)",
      examNote: "Peek read-only operation hai aur state mutate nahi karti.",
    });
  };

  const handleIsEmpty = () => {
    setActiveOperation("isempty");
    setShowOverflowWarning(false);
    setHighlightTop(false);
    setExplanation({
      operation: "isEmpty",
      concept: "isEmpty stack empty condition check karta hai: agar koi element nahi hai to stack empty return hota hai.",
      steps: [
        "TOP index check hua.",
        isEmpty ? "TOP = -1 mila, isliye stack empty hai." : `TOP = ${topIndex} mila, isliye stack empty nahi hai.`,
        `Result: ${isEmpty ? "true" : "false"}`,
      ],
      finalStack: formatStack(stack),
      timeComplexity: "O(1)",
      examNote: "Empty-check usually push/pop se pehle mandatory safety step hota hai.",
    });
  };

  const handleIsFull = () => {
    setActiveOperation("isfull");
    setShowOverflowWarning(isFull);
    setHighlightTop(false);
    setExplanation({
      operation: "isFull",
      concept:
        "Stack full condition check karti hai ki current size max capacity ke equal hai ya nahi. Agar TOP == MAX - 1, toh stack full maana jata hai.",
      steps: [
        `TOP index ${topIndex} compute hua.`,
        `MAX - 1 (${maxSize - 1}) se compare hua.`,
        `Result: ${isFull ? "true (stack full)" : "false (space available)"}`,
      ],
      finalStack: formatStack(stack),
      timeComplexity: "O(1)",
      examNote: "isFull check overflow prevention ka core guard hota hai.",
    });
  };

  const handleReset = () => {
    setActiveOperation("reset");
    setStack(defaultStack);
    setMaxSize(defaultMaxSize);
    setCapacityInput(String(defaultMaxSize));
    setValueInput("");
    setHighlightTop(false);
    setShowOverflowWarning(false);
    setExplanation({
      operation: "Reset",
      concept: "Default stack restore hota hai, highlights clear hote hain, inputs clear hote hain.",
      steps: [
        "Stack default values [10, 20] par reset hua.",
        "Max capacity default 6 par reset hui.",
        "Highlights aur input fields clear ho gaye.",
      ],
      finalStack: formatStack(defaultStack),
      timeComplexity: "O(n)",
      examNote: "Reset repeated practice ke liye consistent baseline state deta hai.",
    });
  };

  return (
    <main className="min-h-screen bg-[#F1E8C7] px-4 py-10 text-[#4B5320] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <Link href="/" className="text-[#7D8F3B] hover:text-[#4B5320]">
            &larr; Back to homepage
          </Link>
          <Link href="/arrays" className="text-[#7D8F3B] hover:text-[#4B5320]">
            Back to previous section
          </Link>
        </div>

        <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#4B5320] sm:text-4xl">Stack Visualizer</h1>
          <p className="mt-3 max-w-3xl text-[#9CA763]">
            Learn LIFO flow with push, pop, and top operations through a vertical animated stack.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                type="text"
                value={valueInput}
                onChange={(event) => setValueInput(event.target.value)}
                placeholder="Enter value"
                className="w-full rounded-xl border border-[#D8CCA3] bg-[#F1E8C7] px-4 py-2.5 text-sm outline-none ring-[#AAB76A] transition focus:ring"
              />

              <div className="flex gap-2">
                <input
                  type="number"
                  value={capacityInput}
                  onChange={(event) => setCapacityInput(event.target.value)}
                  placeholder="Stack size"
                  className="w-full rounded-xl border border-[#D8CCA3] bg-[#F1E8C7] px-4 py-2.5 text-sm outline-none ring-[#AAB76A] transition focus:ring"
                />
                <button
                  onClick={handleCapacityUpdate}
                  className="rounded-xl border border-[#AAB76A] bg-[#F7F1DD] px-3 py-2.5 text-xs font-semibold text-[#7D8F3B] hover:bg-[#F1E8C7]"
                >
                  Set Size
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-medium md:grid-cols-5">
              <span className="rounded-lg border border-[#AAB76A] bg-[#F7F1DD] px-2 py-2 text-[#7D8F3B]">TOP: {topIndex}</span>
              <span className="rounded-lg border border-[#AAB76A] bg-[#F7F1DD] px-2 py-2 text-[#7D8F3B]">Size: {currentSize}</span>
              <span className="rounded-lg border border-[#AAB76A] bg-[#F7F1DD] px-2 py-2 text-[#7D8F3B]">Max: {maxSize}</span>
              <span className="rounded-lg border border-[#D8CCA3] bg-[#F1E8C7] px-2 py-2 text-[#4B5320]">Empty: {isEmpty ? "true" : "false"}</span>
              <span className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-2 text-amber-700">Full: {isFull ? "true" : "false"}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <button onClick={handlePush} className="rounded-xl bg-[#4B5320] px-3 py-2 text-sm font-medium text-white hover:bg-[#7D8F3B]">Push</button>
            <button onClick={handlePop} className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#D8CCA3] bg-[#F7F1DD] px-3 py-2 text-sm font-medium text-[#4B5320] hover:bg-[#F1E8C7]"><Trash2 className="h-4 w-4" />Pop</button>
            <button onClick={handlePeek} className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#7D8F3B] px-3 py-2 text-sm font-medium text-white hover:bg-[#F7F1DD]0"><Eye className="h-4 w-4" />Peek</button>
            <button onClick={handleIsEmpty} className="rounded-xl border border-[#D8CCA3] bg-[#F7F1DD] px-3 py-2 text-sm font-medium text-[#4B5320] hover:bg-[#F1E8C7]">isEmpty</button>
            <button onClick={handleIsFull} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100">isFull</button>
            <button onClick={handleReset} className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#AAB76A] bg-[#F7F1DD] px-3 py-2 text-sm font-medium text-[#7D8F3B] hover:bg-[#F1E8C7]"><RotateCcw className="h-4 w-4" />Reset</button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
          <div className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <h2 className="text-lg font-semibold text-[#4B5320]">Stack Visual</h2>

            <div className="mt-4 rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] p-4">
              <AnimatePresence>
                {(showOverflowWarning || isFull) && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mb-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Stack Overflow Risk: capacity reached.
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#7D8F3B]">
                <span>TOP</span>
                <ArrowDown className="h-4 w-4" />
              </div>

              <div className={`mx-auto flex min-h-72 w-40 flex-col-reverse justify-start rounded-xl border-2 bg-[#F7F1DD] p-2 ${isFull ? "border-amber-400" : "border-[#D8CCA3]"}`}>
                <AnimatePresence>
                  {stack.map((item, index) => {
                    const isTop = index === stack.length - 1;
                    return (
                      <motion.div
                        key={`${item}-${index}`}
                        initial={{ opacity: 0, y: -14, scale: 0.92 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          backgroundColor:
                            isTop && highlightTop ? "#a7f3d0" : isTop ? "#dbeafe" : "#f8fafc",
                          borderColor: isTop ? "#38bdf8" : "#cbd5e1",
                        }}
                        exit={{ opacity: 0, y: 14, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 320, damping: 22 }}
                        className="mb-2 rounded-lg border px-3 py-3 text-center shadow-sm"
                      >
                        <p className="text-sm font-semibold text-[#4B5320]">{item}</p>
                        <p className="mt-1 text-[11px] text-[#9CA763]">index {index}</p>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {stack.length === 0 && <p className="py-6 text-center text-sm text-[#9CA763]">Stack Empty</p>}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#AAB76A] bg-[#F7F1DD] p-4">
              <p className="text-sm font-semibold text-[#7D8F3B]">Key Concept</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#7D8F3B]">
                <li>Stack follows LIFO.</li>
                <li>Insertion and deletion happen at TOP.</li>
                <li>Array-based stack has fixed capacity.</li>
                <li>Push adds element.</li>
                <li>Pop removes element.</li>
                <li>Peek accesses top element.</li>
                <li>Overflow occurs when stack becomes full.</li>
                <li>Underflow occurs when stack becomes empty.</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
              <h3 className="text-lg font-semibold text-[#4B5320]">Step Explanation</h3>

              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA763]">Operation</p>
                  <p className="mt-1 font-medium text-[#4B5320]">{explanation.operation}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA763]">Concept</p>
                  <p className="mt-1 leading-6 text-[#4B5320]">{explanation.concept}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA763]">Step-by-step process</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-[#4B5320]">
                    {explanation.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA763]">Final stack</p>
                  <p className="mt-1 font-mono text-[#4B5320]">{explanation.finalStack}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA763]">Time complexity</p>
                  <span className="rounded-full border border-[#AAB76A] bg-[#F7F1DD] px-2.5 py-1 text-xs font-semibold text-[#7D8F3B]">{explanation.timeComplexity}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA763]">Exam note</p>
                  <p className="mt-1 leading-6 text-[#4B5320]">{explanation.examNote}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#D8CCA3] bg-[#4B5320] p-6 text-[#F7F1DD] shadow-[0_10px_30px_rgba(15,23,42,0.2)]">
              <h3 className="text-lg font-semibold text-[#AAB76A]">Pseudocode</h3>
              <div className="mt-3 space-y-1 font-mono text-sm leading-6 text-[#F7F1DD]/95">
                {pseudocode.map((line, index) => (
                  <p key={`${line}-${index}`}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
