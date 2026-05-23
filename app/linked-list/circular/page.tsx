"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";

type OperationKey =
  | "insert-beginning"
  | "insert-end"
  | "insert-position"
  | "delete-beginning"
  | "delete-end"
  | "delete-position"
  | "search"
  | "reset"
  | "idle";

type ExplanationData = {
  operation: string;
  concept: string;
  steps: string[];
  finalList: string;
  timeComplexity: string;
  examNote: string;
};

const defaultList = ["10", "20", "30"];
const addressOf = (index: number) => `${100 + index}`;
const formatCircular = (list: string[]) => {
  if (list.length === 0) return "HEAD -> NULL";
  return `HEAD -> ${list.join(" -> ")} -> (back to ${list[0]})`;
};

const operationLabels: Record<OperationKey, string> = {
  "insert-beginning": "Insert at Beginning",
  "insert-end": "Insert at End",
  "insert-position": "Insert at Position",
  "delete-beginning": "Delete at Beginning",
  "delete-end": "Delete at End",
  "delete-position": "Delete at Position",
  search: "Search Value",
  reset: "Reset",
  idle: "Overview",
};

const pseudocodeMap: Record<OperationKey, string[]> = {
  "insert-beginning": [
    "newNode = createNode(value)",
    "if head == NULL:",
    "    head = newNode",
    "    newNode.next = head",
    "else:",
    "    temp = head",
    "    while temp.next != head:",
    "        temp = temp.next",
    "    newNode.next = head",
    "    temp.next = newNode   // tail.next = new head",
    "    head = newNode",
  ],
  "insert-end": [
    "newNode = createNode(value)",
    "if head == NULL:",
    "    head = newNode",
    "    newNode.next = head",
    "else:",
    "    temp = head",
    "    while temp.next != head:",
    "        temp = temp.next",
    "    temp.next = newNode",
    "    newNode.next = head",
  ],
  "insert-position": [
    "newNode = createNode(value)",
    "if position == 0:",
    "    // same as insert at beginning",
    "else:",
    "    temp = head",
    "    for i = 0 to position - 2:",
    "        temp = temp.next",
    "    newNode.next = temp.next",
    "    temp.next = newNode",
  ],
  "delete-beginning": [
    "if head == NULL: print \"Empty\"",
    "else if head.next == head:",
    "    delete head",
    "    head = NULL",
    "else:",
    "    temp = head",
    "    tail = head",
    "    while tail.next != head:",
    "        tail = tail.next",
    "    head = head.next",
    "    tail.next = head",
    "    delete temp",
  ],
  "delete-end": [
    "if head == NULL: print \"Empty\"",
    "else if head.next == head:",
    "    delete head",
    "    head = NULL",
    "else:",
    "    temp = head",
    "    while temp.next.next != head:",
    "        temp = temp.next",
    "    delete temp.next",
    "    temp.next = head",
  ],
  "delete-position": [
    "if head == NULL: print \"Empty\"",
    "else if position == 0:",
    "    // same as delete beginning",
    "else:",
    "    temp = head",
    "    for i = 0 to position - 2:",
    "        temp = temp.next",
    "    nodeToDelete = temp.next",
    "    temp.next = nodeToDelete.next",
    "    delete nodeToDelete",
  ],
  search: [
    "if head == NULL: return -1",
    "temp = head",
    "position = 0",
    "do:",
    "    if temp.data == value:",
    "        return position",
    "    temp = temp.next",
    "    position = position + 1",
    "while temp != head",
    "return -1",
  ],
  reset: [
    "list = [10, 20, 30]",
    "reconnect tail.next to head",
    "clear highlight",
    "clear inputs",
  ],
  idle: ["Select operation to view circular linked list pseudocode."],
};

export default function CircularLinkedListPage() {
  const [list, setList] = useState<string[]>(defaultList);
  const [valueInput, setValueInput] = useState("");
  const [positionInput, setPositionInput] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [activeOperation, setActiveOperation] = useState<OperationKey>("idle");
  const [explanation, setExplanation] = useState<ExplanationData>({
    operation: "Overview",
    concept:
      "Circular Linked List me last node NULL ko point nahi karta. Instead, woh first node yani HEAD ko point karta hai.",
    steps: [
      "HEAD first node ka address store karta hai.",
      "TAIL ka next always HEAD ko point karta hai.",
      "Traversal me stop condition carefully handle karna padta hai to avoid infinite loop.",
    ],
    finalList: formatCircular(defaultList),
    timeComplexity: "Depends on operation",
    examNote: "Circular traversal ke stop condition (temp == head) ko exam me clearly likho.",
  });

  const pseudocode = useMemo(() => pseudocodeMap[activeOperation], [activeOperation]);
  const headAddress = list.length === 0 ? "NULL" : addressOf(0);
  const tailAddress = list.length === 0 ? "NULL" : addressOf(list.length - 1);

  const setValidationExplanation = (operation: OperationKey, message: string) => {
    setExplanation({
      operation: `${operationLabels[operation]} (Validation)`,
      concept: message,
      steps: [
        "Circular list operations se pehle input validate karna zaroori hai.",
        "Invalid input se traversal logic aur pointer updates galat ho sakte hain.",
        "Correct value/position do aur operation dobara run karo.",
      ],
      finalList: formatCircular(list),
      timeComplexity: "N/A (validation step)",
      examNote: "Edge cases (empty/single node) circular list me specially important hote hain.",
    });
  };

  const requireValue = (operation: OperationKey) => {
    if (valueInput.trim() === "") {
      setValidationExplanation(operation, "Please enter a value first.");
      return null;
    }
    return valueInput.trim();
  };

  const parsePosition = (operation: OperationKey) => {
    if (positionInput.trim() === "") {
      setValidationExplanation(operation, "Please enter a position first.");
      return null;
    }
    const parsed = Number(positionInput);
    if (!Number.isInteger(parsed)) {
      setValidationExplanation(operation, "Please enter a position first.");
      return null;
    }
    return parsed;
  };

  const clearHighlight = () => setHighlightedIndex(null);

  const handleInsertBeginning = () => {
    setActiveOperation("insert-beginning");
    const value = requireValue("insert-beginning");
    if (value === null) return;

    clearHighlight();
    const nextList = [value, ...list];
    setList(nextList);
    setExplanation({
      operation: "Insert at Beginning",
      concept:
        "New node create hota hai, new node.next old head ko point karta hai, tail.next new head ko update hota hai, aur head update hota hai.",
      steps: [
        `New node (${value}) address ${addressOf(0)} par add hua.`,
        list.length === 0
          ? "List empty thi, new node ka next khud HEAD ko point karta hai."
          : `new node ka next old head address ${addressOf(1)} par set hua.`,
        list.length === 0
          ? "HEAD aur TAIL dono new node par set hue."
          : `Old tail.next update hoke new HEAD address ${addressOf(0)} ho gaya.`,
      ],
      finalList: formatCircular(nextList),
      timeComplexity: "O(n)",
      examNote: "Tail locate karne ke liye traversal lagta hai in basic implementation, isliye O(n).",
    });
  };

  const handleInsertEnd = () => {
    setActiveOperation("insert-end");
    const value = requireValue("insert-end");
    if (value === null) return;

    clearHighlight();
    const nextList = [...list, value];
    setList(nextList);
    setExplanation({
      operation: "Insert at End",
      concept:
        "New node create hota hai, tail.next new node ko point karta hai, new node.next head ko point karta hai, aur tail update hota hai.",
      steps: [
        `New node (${value}) create hua with address ${addressOf(nextList.length - 1)}.`,
        list.length === 0
          ? "List empty thi, node ka next khud head ban gaya."
          : `Old tail.next new node address ${addressOf(nextList.length - 1)} par update hua.`,
        `New node ka next HEAD address ${addressOf(0)} par set hua, aur TAIL update ho gaya.`,
      ],
      finalList: formatCircular(nextList),
      timeComplexity: "O(n)",
      examNote: "Without dedicated tail pointer, end insertion traversal-based O(n) hota hai.",
    });
  };

  const handleInsertPosition = () => {
    setActiveOperation("insert-position");
    const value = requireValue("insert-position");
    if (value === null) return;

    const position = parsePosition("insert-position");
    if (position === null) return;

    if (position < 0 || position > list.length) {
      setValidationExplanation("insert-position", "Invalid position for insertion.");
      return;
    }

    clearHighlight();
    const nextList = [...list.slice(0, position), value, ...list.slice(position)];
    setList(nextList);
    setExplanation({
      operation: "Insert at Position",
      concept: "Traversal circular manner me hota hai aur insert ke baad links update hote hain.",
      steps: [
        `Position ${position} validate hui (0 se ${list.length}).`,
        `New node (${value}) address ${addressOf(position)} par insert hua.`,
        position === 0
          ? "Position 0 case beginning insertion jaisa handle hua, tail.next bhi new head par update hua."
          : "Previous node tak circular traversal hua aur pointers re-link hue.",
      ],
      finalList: formatCircular(nextList),
      timeComplexity: "O(n)",
      examNote: "Circular me link updates ke saath stop condition clarity maintain karo.",
    });
  };

  const handleDeleteBeginning = () => {
    setActiveOperation("delete-beginning");
    if (list.length === 0) {
      setValidationExplanation("delete-beginning", "Linked list is already empty.");
      return;
    }

    clearHighlight();
    const removed = list[0];
    const nextList = list.slice(1);
    setList(nextList);
    setExplanation({
      operation: "Delete at Beginning",
      concept: "Old head remove hota hai, head next node par move hota hai, aur tail.next new head ko point karta hai.",
      steps: [
        `Old head (${removed}) remove hua from address ${addressOf(0)}.`,
        nextList.length === 0
          ? "Single node case me list empty ho gayi."
          : `Head new first node address ${addressOf(0)} par move hua.`,
        nextList.length === 0
          ? "HEAD/TAIL NULL ho gaye."
          : `Tail.next update hoke new HEAD address ${addressOf(0)} ko point karta hai.`,
      ],
      finalList: formatCircular(nextList),
      timeComplexity: "O(n)",
      examNote: "Tail locate/update ki wajah se basic circular delete-beginning O(n) hota hai.",
    });
  };

  const handleDeleteEnd = () => {
    setActiveOperation("delete-end");
    if (list.length === 0) {
      setValidationExplanation("delete-end", "Linked list is already empty.");
      return;
    }

    clearHighlight();
    const removed = list[list.length - 1];
    const nextList = list.slice(0, -1);
    setList(nextList);
    setExplanation({
      operation: "Delete at End",
      concept:
        "Second last node locate hota hai, tail remove hota hai, second last node.next head ko point karta hai, aur tail update hota hai.",
      steps: [
        list.length === 1
          ? "Single node remove hone par list empty ho gayi."
          : "Second last node locate karne ke liye traversal hua.",
        `Old tail (${removed}) remove hua.`,
        nextList.length === 0
          ? "HEAD/TAIL NULL ho gaye."
          : `New tail ka next HEAD address ${addressOf(0)} par set hua.`,
      ],
      finalList: formatCircular(nextList),
      timeComplexity: "O(n)",
      examNote: "Second last locate karna main cost driver hai is operation me.",
    });
  };

  const handleDeletePosition = () => {
    setActiveOperation("delete-position");
    if (list.length === 0) {
      setValidationExplanation("delete-position", "Linked list is already empty.");
      return;
    }

    const position = parsePosition("delete-position");
    if (position === null) return;

    if (position < 0 || position >= list.length) {
      setValidationExplanation("delete-position", "Invalid position for deletion.");
      return;
    }

    clearHighlight();
    const removed = list[position];
    const nextList = [...list.slice(0, position), ...list.slice(position + 1)];
    setList(nextList);
    setExplanation({
      operation: "Delete at Position",
      concept: "Traversal circularly hota hai aur previous node apna next pointer update karta hai.",
      steps: [
        `Position ${position} validate hui.`,
        position === 0
          ? "Position 0 case delete-beginning jaisa handle hua with tail.next update."
          : "Previous node tak circular traversal hua aur uska next target ke baad wale node par set hua.",
        `Target node (${removed}) remove ho gaya.`,
      ],
      finalList: formatCircular(nextList),
      timeComplexity: "O(n)",
      examNote: "Circular delete me reconnect step miss karoge toh loop break ho sakta hai.",
    });
  };

  const handleSearch = () => {
    setActiveOperation("search");
    const value = requireValue("search");
    if (value === null) return;

    const foundIndex = list.findIndex((node) => node === value);
    if (foundIndex === -1) {
      setHighlightedIndex(null);
      setValidationExplanation("search", "Value not found in linked list.");
      setExplanation({
        operation: "Search Value",
        concept:
          "Traversal HEAD se start hota hai aur stop condition carefully handle karni padti hai because list circular hoti hai.",
        steps: [
          `Value ${value} ke liye sequential circular traversal hua.`,
          "Har node compare hua but match nahi mila.",
          "Head par wapas aate hi traversal stop kiya gaya aur not found message show hua.",
        ],
        finalList: formatCircular(list),
        timeComplexity: "Best: O(1), Worst: O(n)",
        examNote: "Circular search me infinite loop avoid karne ke liye termination condition compulsory hai.",
      });
      return;
    }

    setHighlightedIndex(foundIndex);
    setExplanation({
      operation: "Search Value",
      concept:
        "Traversal HEAD se start hota hai, matching node highlight hota hai, aur circular stop condition safe handling ke saath apply hoti hai.",
      steps: [
        `Value ${value} ko head se node-by-node compare kiya gaya.`,
        `Match position ${foundIndex} par mila (address ${addressOf(foundIndex)}).`,
        "Matching node highlight hua aur traversal stop kiya gaya.",
      ],
      finalList: formatCircular(list),
      timeComplexity: "Best: O(1), Worst: O(n)",
      examNote: "Best case head match hai, worst case full cycle traverse hota hai.",
    });
  };

  const handleReset = () => {
    setActiveOperation("reset");
    setList(defaultList);
    setValueInput("");
    setPositionInput("");
    setHighlightedIndex(null);
    setExplanation({
      operation: "Reset",
      concept: "Default circular list restore hoti hai, highlights clear hote hain, aur inputs clear hote hain.",
      steps: [
        "Default nodes [10, 20, 30] restore hue.",
        "Tail.next ko head ke saath circularly restore maana gaya.",
        "Highlight aur inputs clear kar diye gaye.",
      ],
      finalList: formatCircular(defaultList),
      timeComplexity: "O(n)",
      examNote: "Reset se consistent demo state maintain hoti hai practice ke liye.",
    });
  };

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <Link href="/linked-list" className="text-blue-700 hover:text-blue-800">
            &larr; Back to Linked List overview
          </Link>
          <Link href="/" className="text-blue-700 hover:text-blue-800">
            Back to homepage
          </Link>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Circular Linked List Visualizer</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Visualize how each node links forward and how tail.next reconnects to HEAD to form a loop.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              type="text"
              value={valueInput}
              onChange={(event) => setValueInput(event.target.value)}
              placeholder="Enter value"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none ring-cyan-300 transition focus:ring"
            />
            <input
              type="number"
              value={positionInput}
              onChange={(event) => setPositionInput(event.target.value)}
              placeholder="Enter position (0-based)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none ring-cyan-300 transition focus:ring"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <button onClick={handleInsertBeginning} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">Insert at Beginning</button>
            <button onClick={handleInsertEnd} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">Insert at End</button>
            <button onClick={handleInsertPosition} className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500">Insert at Position</button>
            <button onClick={handleDeleteBeginning} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Delete at Beginning</button>
            <button onClick={handleDeleteEnd} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Delete at End</button>
            <button onClick={handleDeletePosition} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Delete at Position</button>
            <button onClick={handleSearch} className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-400"><Search className="h-4 w-4" />Search Value</button>
            <button onClick={handleReset} className="inline-flex items-center justify-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-700 hover:bg-cyan-100"><RotateCcw className="h-4 w-4" />Reset</button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Circular Linked List Visual Area</h2>
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-cyan-700">HEAD: {headAddress}</span>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">TAIL: {tailAddress}</span>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {list.length === 0 ? (
              <div className="text-sm text-slate-500">HEAD -&gt; NULL, TAIL -&gt; NULL</div>
            ) : (
              <div className="min-w-max">
                <motion.div layout className="flex items-center gap-2">
                  <AnimatePresence>
                    {list.map((value, index) => {
                      const isHighlighted = highlightedIndex === index;
                      const nextAddress = index === list.length - 1 ? addressOf(0) : addressOf(index + 1);

                      return (
                        <motion.div
                          key={`${value}-${index}`}
                          layout
                          initial={{ opacity: 0, y: 14, scale: 0.92 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -12, scale: 0.9 }}
                          transition={{ type: "spring", stiffness: 320, damping: 24 }}
                          className="flex items-center gap-2"
                        >
                          <motion.div
                            animate={{
                              borderColor: isHighlighted ? "#10b981" : "#93c5fd",
                              backgroundColor: isHighlighted ? "#a7f3d0" : "#eff6ff",
                            }}
                            className="rounded-xl border shadow-sm"
                          >
                            <div className="flex border-b border-slate-200 text-center">
                              <div className="border-r border-slate-300 px-4 py-2">
                                <p className="text-xs text-slate-500">data</p>
                                <p className="text-sm font-semibold text-slate-900">{value}</p>
                              </div>
                              <div className="px-4 py-2">
                                <p className="text-xs text-slate-500">next</p>
                                <p className="text-sm font-semibold text-slate-900">{nextAddress}</p>
                              </div>
                            </div>
                            <p className="py-1 text-center text-xs text-slate-500">addr: {addressOf(index)}</p>
                          </motion.div>

                          {index < list.length - 1 && <span className="text-slate-400">&rarr;</span>}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>

                <motion.div
                  animate={{ rotate: [0, 3, 0, -3, 0] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.8 }}
                  className="mt-3 flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-medium text-cyan-700"
                >
                  <span className="font-semibold">Circular Link:</span>
                  <span>tail.next = head ({tailAddress} -&gt; {headAddress})</span>
                  <span className="text-base">?</span>
                </motion.div>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">Key Concept</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-emerald-700">
              <li>Last node points back to HEAD.</li>
              <li>No node stores NULL in next field.</li>
              <li>Traversal can become infinite if stopping condition is not handled.</li>
              <li>Useful in round-robin scheduling and cyclic systems.</li>
            </ul>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Final circular linked list</p>
                <p className="mt-1 font-mono text-slate-800">{explanation.finalList}</p>
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
                <p key={`${line}-${index}`}>{line === "" ? " " : line}</p>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
