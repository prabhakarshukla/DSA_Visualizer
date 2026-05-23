"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, Eye, RotateCcw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

type OperationKey = "push" | "pop" | "peek" | "isempty" | "reset" | "idle";

type ExplanationData = {
  operation: string;
  concept: string;
  steps: string[];
  finalStack: string;
  timeComplexity: string;
  examNote: string;
};

const defaultStack = ["10", "20"];
const maxSize = 6;

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
  peek: [
    "if TOP == -1:",
    "    print \"Empty\"",
    "else:",
    "    print stack[TOP]",
  ],
  isempty: ["if TOP == -1:", "    return true", "else:", "    return false"],
  reset: ["stack = [10, 20]", "clear highlight", "clear input", "TOP = stack.length - 1"],
  idle: ["Select operation to view stack pseudocode."],
};

const formatStack = (stack: string[]) =>
  stack.length === 0 ? "TOP -> EMPTY" : `BOTTOM [${stack.join(", ")}] TOP`;

export default function StackPage() {
  const [stack, setStack] = useState<string[]>(defaultStack);
  const [valueInput, setValueInput] = useState("");
  const [activeOperation, setActiveOperation] = useState<OperationKey>("idle");
  const [highlightTop, setHighlightTop] = useState(false);
  const [explanation, setExplanation] = useState<ExplanationData>({
    operation: "Overview",
    concept: "Stack ek linear data structure hai jo LIFO (Last In First Out) principle follow karta hai.",
    steps: [
      "Insertion aur deletion dono TOP par hote hain.",
      "Push element add karta hai, Pop remove karta hai.",
      "Peek sirf top value access karta hai bina remove kiye.",
    ],
    finalStack: formatStack(defaultStack),
    timeComplexity: "Depends on operation",
    examNote: "Stack problems me overflow/underflow conditions explicitly check karna important hota hai.",
  });

  const topIndex = stack.length - 1;
  const currentSize = stack.length;
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

  const handlePush = () => {
    setActiveOperation("push");
    if (valueInput.trim() === "") {
      setValidationExplanation("push", "Please enter a value first.");
      return;
    }
    if (stack.length >= maxSize) {
      setValidationExplanation("push", "Stack Overflow");
      return;
    }

    const value = valueInput.trim();
    const next = [...stack, value];
    setStack(next);
    setHighlightTop(true);
    setExplanation({
      operation: "Push",
      concept:
        "Push me new element TOP par add hota hai, TOP pointer update hota hai, aur LIFO property maintain hoti hai.",
      steps: [
        `Value ${value} stack ke top par add hua.`,
        `TOP index ${next.length - 1} par move hua.`,
        "Latest inserted element ab sabse pehle pop hoga (LIFO).",
      ],
      finalStack: formatStack(next),
      timeComplexity: "O(1)",
      examNote: "Push direct TOP update operation hai, isliye constant time hota hai.",
    });
  };

  const handlePop = () => {
    setActiveOperation("pop");
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
        "Pop me TOP element remove hota hai, TOP next lower element par shift hota hai, aur LIFO behavior visible hota hai.",
      steps: [
        `TOP element ${removed} remove hua.`,
        next.length === 0 ? "Stack empty ho gaya aur TOP = -1 ho gaya." : `TOP ab index ${next.length - 1} par shift hua.`,
        "Jo element sabse last push hua tha wahi pehle pop hua (LIFO).",
      ],
      finalStack: formatStack(next),
      timeComplexity: "O(1)",
      examNote: "Pop se memory clean-up + TOP decrement dono constant time me hote hain.",
    });
  };

  const handlePeek = () => {
    setActiveOperation("peek");
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
      examNote: "Peek safe read operation hai jisme state mutate nahi hoti.",
    });
  };

  const handleIsEmpty = () => {
    setActiveOperation("isempty");
    const empty = stack.length === 0;
    setHighlightTop(false);
    setExplanation({
      operation: "isEmpty",
      concept: "isEmpty stack empty condition check karta hai: agar koi element nahi hai to stack empty return hota hai.",
      steps: [
        "TOP index check hua.",
        empty ? "TOP = -1 mila, isliye stack empty hai." : `TOP = ${stack.length - 1} mila, isliye stack empty nahi hai.`,
        `Result: ${empty ? "true" : "false"}`,
      ],
      finalStack: formatStack(stack),
      timeComplexity: "O(1)",
      examNote: "Empty-check usually push/pop se pehle mandatory safety step hota hai.",
    });
  };

  const handleReset = () => {
    setActiveOperation("reset");
    setStack(defaultStack);
    setValueInput("");
    setHighlightTop(false);
    setExplanation({
      operation: "Reset",
      concept: "Default stack restore hota hai, highlights clear hote hain, aur inputs clear hote hain.",
      steps: [
        "Stack default values [10, 20] par reset hua.",
        "Top highlight clear hua.",
        "Input field clean ho gaya.",
      ],
      finalStack: formatStack(defaultStack),
      timeComplexity: "O(n)",
      examNote: "Reset repeated practice ke liye consistent baseline state deta hai.",
    });
  };

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <Link href="/" className="text-blue-700 hover:text-blue-800">
            &larr; Back to homepage
          </Link>
          <Link href="/arrays" className="text-blue-700 hover:text-blue-800">
            Back to previous section
          </Link>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Stack Visualizer</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Learn LIFO flow with push, pop, and top operations through a vertical animated stack.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              type="text"
              value={valueInput}
              onChange={(event) => setValueInput(event.target.value)}
              placeholder="Enter value"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none ring-cyan-300 transition focus:ring"
            />
            <div className="grid grid-cols-3 gap-2 text-xs font-medium">
              <span className="rounded-lg border border-cyan-200 bg-cyan-50 px-2 py-2 text-cyan-700">TOP: {topIndex}</span>
              <span className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-2 text-blue-700">SIZE: {currentSize}</span>
              <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2 text-emerald-700">MAX: {maxSize}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <button onClick={handlePush} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">Push</button>
            <button onClick={handlePop} className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Trash2 className="h-4 w-4" />Pop</button>
            <button onClick={handlePeek} className="inline-flex items-center justify-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"><Eye className="h-4 w-4" />Peek</button>
            <button onClick={handleIsEmpty} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">isEmpty</button>
            <button onClick={handleReset} className="inline-flex items-center justify-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-700 hover:bg-cyan-100"><RotateCcw className="h-4 w-4" />Reset</button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <h2 className="text-lg font-semibold text-slate-900">Stack Visual</h2>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-700">
                <span>TOP</span>
                <ArrowDown className="h-4 w-4" />
              </div>

              <div className="mx-auto flex min-h-72 w-40 flex-col-reverse justify-start rounded-xl border-2 border-slate-300 bg-white p-2">
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
                        <p className="text-sm font-semibold text-slate-900">{item}</p>
                        <p className="mt-1 text-[11px] text-slate-500">index {index}</p>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {stack.length === 0 && <p className="py-6 text-center text-sm text-slate-500">Stack Empty</p>}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800">Key Concept</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-emerald-700">
                <li>Stack follows LIFO.</li>
                <li>Insertion and deletion happen at TOP.</li>
                <li>Push adds element.</li>
                <li>Pop removes element.</li>
                <li>Peek accesses top element.</li>
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Final stack</p>
                  <p className="mt-1 font-mono text-slate-800">{explanation.finalStack}</p>
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
