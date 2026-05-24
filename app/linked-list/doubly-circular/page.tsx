"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeftRight, RotateCcw, Search } from "lucide-react";
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
const formatList = (list: string[]) =>
  list.length === 0 ? "HEAD <-> NULL" : `HEAD <-> ${list.join(" <-> ")} <-> (back to HEAD)`;

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
    "    head = tail = newNode",
    "    head.prev = tail",
    "    tail.next = head",
    "else:",
    "    newNode.next = head",
    "    newNode.prev = tail",
    "    head.prev = newNode",
    "    tail.next = newNode",
    "    head = newNode",
  ],
  "insert-end": [
    "newNode = createNode(value)",
    "if head == NULL:",
    "    head = tail = newNode",
    "else:",
    "    tail.next = newNode",
    "    newNode.prev = tail",
    "    newNode.next = head",
    "    head.prev = newNode",
    "    tail = newNode",
  ],
  "insert-position": [
    "if position == 0: insertBeginning()",
    "else:",
    "    temp = head",
    "    for i = 0 to position - 2:",
    "        temp = temp.next   // circular traversal",
    "    newNode.next = temp.next",
    "    newNode.prev = temp",
    "    temp.next.prev = newNode",
    "    temp.next = newNode",
  ],
  "delete-beginning": [
    "if head == NULL: print \"Empty\"",
    "else if head == tail:",
    "    delete head",
    "    head = tail = NULL",
    "else:",
    "    head = head.next",
    "    head.prev = tail",
    "    tail.next = head",
  ],
  "delete-end": [
    "if head == NULL: print \"Empty\"",
    "else if head == tail:",
    "    delete head",
    "    head = tail = NULL",
    "else:",
    "    tail = tail.prev",
    "    tail.next = head",
    "    head.prev = tail",
  ],
  "delete-position": [
    "if position == 0: deleteBeginning()",
    "else:",
    "    temp = head",
    "    for i = 0 to position:",
    "        temp = temp.next   // circular traversal",
    "    temp.prev.next = temp.next",
    "    temp.next.prev = temp.prev",
    "    delete temp",
  ],
  search: [
    "if head == NULL: return -1",
    "temp = head, index = 0",
    "do:",
    "    if temp.data == value: return index",
    "    temp = temp.next",
    "    index = index + 1",
    "while temp != head",
    "return -1",
  ],
  reset: [
    "list = [10, 20, 30]",
    "head.prev = tail",
    "tail.next = head",
    "clear inputs + highlight",
  ],
  idle: ["Select operation to view doubly circular pseudocode."],
};

export default function DoublyCircularLinkedListPage() {
  const [list, setList] = useState<string[]>(defaultList);
  const [valueInput, setValueInput] = useState("");
  const [positionInput, setPositionInput] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [activeOperation, setActiveOperation] = useState<OperationKey>("idle");
  const [explanation, setExplanation] = useState<ExplanationData>({
    operation: "Overview",
    concept:
      "Doubly circular linked list me nodes ke paas prev aur next dono pointers hote hain, aur head-tail circularly connected hote hain.",
    steps: [
      "Head.prev tail ko point karta hai.",
      "Tail.next head ko point karta hai.",
      "Non-empty list me NULL pointers nahi hote.",
    ],
    finalList: formatList(defaultList),
    timeComplexity: "Depends on operation",
    examNote: "Circular traversal me stopping condition clear rakhna zaroori hai.",
  });

  const pseudocode = useMemo(() => pseudocodeMap[activeOperation], [activeOperation]);
  const headAddress = list.length === 0 ? "NULL" : addressOf(0);
  const tailAddress = list.length === 0 ? "NULL" : addressOf(list.length - 1);

  const setValidationExplanation = (operation: OperationKey, message: string) => {
    setExplanation({
      operation: `${operationLabels[operation]} (Validation)`,
      concept: message,
      steps: [
        "Input validation circular list me extra important hoti hai.",
        "Galat position se prev/next links corrupt ho sakte hain.",
        "Sahi input ke saath operation dobara run karo.",
      ],
      finalList: formatList(list),
      timeComplexity: "N/A (validation step)",
      examNote: "Boundary cases clear likhna interviews me strong signal hai.",
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
    const next = [value, ...list];
    setList(next);
    setExplanation({
      operation: "Insert at Beginning",
      concept:
        "new node create hota hai, new node.next old head ko point karta hai, new node.prev tail ko point karta hai, old head.prev new node hota hai, tail.next new head hota hai aur head update hota hai.",
      steps: [
        `New node (${value}) address ${addressOf(0)} par insert hua.`,
        list.length === 0
          ? "Single node case me head.prev aur tail.next dono same node ko point karte hain."
          : `newNode.next old head address ${addressOf(1)} aur newNode.prev old tail address ${addressOf(list.length)} store karta hai.`,
        list.length === 0
          ? "Head/Tail dono new node ban gaye."
          : `old head.prev aur tail.next dono ${addressOf(0)} par update hue, head shift ho gaya.`,
      ],
      finalList: formatList(next),
      timeComplexity: "O(n)",
      examNote: "Basic model me tail locate/update traversal-cost ke saath explain karo.",
    });
  };

  const handleInsertEnd = () => {
    setActiveOperation("insert-end");
    const value = requireValue("insert-end");
    if (value === null) return;

    clearHighlight();
    const next = [...list, value];
    setList(next);
    setExplanation({
      operation: "Insert at End",
      concept:
        "tail.next new node, new node.prev old tail, new node.next head, head.prev new node, aur tail update hota hai.",
      steps: [
        `New node (${value}) address ${addressOf(next.length - 1)} par create hua.`,
        list.length === 0
          ? "Empty case me node self-circular ban gaya."
          : `old tail.next new node par set hua aur new node.prev old tail address ${addressOf(next.length - 2)} par set hua.`,
        `new node.next head address ${addressOf(0)} par set hua, head.prev bhi new tail par update hua.`,
      ],
      finalList: formatList(next),
      timeComplexity: "O(n)",
      examNote: "Tail update ke baad head.prev aur tail.next consistency verify karna zaroori hai.",
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
    const next = [...list.slice(0, position), value, ...list.slice(position)];
    setList(next);
    setExplanation({
      operation: "Insert at Position",
      concept: "Traversal circularly hota hai aur prev/next links dono update hote hain.",
      steps: [
        `Position ${position} validate hui.`,
        `New node (${value}) address ${addressOf(position)} par add hua.`,
        position === 0
          ? "Position 0 case insert-beginning jaisa pointer updates follow karta hai."
          : "Previous aur next neighboring nodes ke links reconnected hue with both-direction updates.",
      ],
      finalList: formatList(next),
      timeComplexity: "O(n)",
      examNote: "Doubly circular me 4 pointer updates ka order likhna scoring point hai.",
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
    const next = list.slice(1);
    setList(next);
    setExplanation({
      operation: "Delete at Beginning",
      concept: "old head remove hota hai, head next node ban jata hai, head.prev tail hota hai, aur tail.next head hota hai.",
      steps: [
        `Old head (${removed}) remove hua.`,
        next.length === 0
          ? "Single node delete hone par list empty ho gayi."
          : `New head address ${addressOf(0)} set hua, head.prev new tail address ${addressOf(next.length - 1)} par set hua.`,
        next.length === 0 ? "HEAD/TAIL NULL ho gaye." : "Tail.next bhi new head par update ho gaya.",
      ],
      finalList: formatList(next),
      timeComplexity: "O(n)",
      examNote: "Circular integrity ke liye head.prev aur tail.next dono update mention karo.",
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
    const next = list.slice(0, -1);
    setList(next);
    setExplanation({
      operation: "Delete at End",
      concept: "tail remove hota hai, new tail.next head hota hai, head.prev new tail hota hai.",
      steps: [
        `Old tail (${removed}) remove hua.`,
        next.length === 0
          ? "Single node deletion ke baad list empty ho gayi."
          : `New tail address ${addressOf(next.length - 1)} ban gaya.`,
        next.length === 0
          ? "HEAD/TAIL NULL ho gaye."
          : `new tail.next head address ${addressOf(0)} par aur head.prev new tail par set hua.`,
      ],
      finalList: formatList(next),
      timeComplexity: "O(n)",
      examNote: "End delete me bidirectional circular links sync rehna chahiye.",
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
    const next = [...list.slice(0, position), ...list.slice(position + 1)];
    setList(next);
    setExplanation({
      operation: "Delete at Position",
      concept: "Neighboring nodes reconnect hote hain aur prev/next links update hote hain.",
      steps: [
        `Position ${position} validate hui.`,
        position === 0
          ? "Position 0 case delete-beginning jaisa handle hua."
          : "Previous.next aur next.prev pointers dono target ko skip karke reconnect hue.",
        `Target node (${removed}) remove ho gaya.`,
      ],
      finalList: formatList(next),
      timeComplexity: "O(n)",
      examNote: "Middle delete me dono direction pointers update karna mandatory hai.",
    });
  };

  const handleSearch = () => {
    setActiveOperation("search");
    const value = requireValue("search");
    if (value === null) return;

    const foundIndex = list.findIndex((n) => n === value);
    if (foundIndex === -1) {
      setHighlightedIndex(null);
      setValidationExplanation("search", "Value not found in linked list.");
      setExplanation({
        operation: "Search Value",
        concept:
          "Traversal circularly hota hai. Infinite traversal avoid karne ke liye stopping condition required hoti hai.",
        steps: [
          `Value ${value} ke liye HEAD se scan start hua.`,
          "Nodes compare hue but match nahi mila.",
          "Head par wapas aate hi traversal stop hua.",
        ],
        finalList: formatList(list),
        timeComplexity: "Best: O(1), Worst: O(n)",
        examNote: "Circular search me do-while style stopping logic explain karo.",
      });
      return;
    }

    setHighlightedIndex(foundIndex);
    setExplanation({
      operation: "Search Value",
      concept:
        "Traversal circularly hota hai, stopping condition maintain karte hue matching node highlight hota hai.",
      steps: [
        `Value ${value} ko sequentially compare kiya gaya.`,
        `Match position ${foundIndex} par mila (address ${addressOf(foundIndex)}).`,
        "Matching node highlight hua aur search stop hua.",
      ],
      finalList: formatList(list),
      timeComplexity: "Best: O(1), Worst: O(n)",
      examNote: "Head match best case hai; full cycle complete hona worst case hota hai.",
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
      concept: "Default structure restore hota hai, highlights clear hote hain, inputs clear hote hain.",
      steps: [
        "Default list [10, 20, 30] restore hui.",
        "head.prev = tail aur tail.next = head relation reset hua.",
        "Inputs aur highlight state clear ho gaye.",
      ],
      finalList: formatList(defaultList),
      timeComplexity: "O(n)",
      examNote: "Reset se circular structure ko repeatedly demo karna easy ho jata hai.",
    });
  };

  return (
    <main className="min-h-screen bg-[#F1E8C7] px-4 py-10 text-[#4B5320] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <Link href="/linked-list" className="text-[#7D8F3B] hover:text-[#4B5320]">
            &larr; Back to Linked List overview
          </Link>
          <Link href="/" className="text-[#7D8F3B] hover:text-[#4B5320]">
            Back to homepage
          </Link>
        </div>

        <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#4B5320] sm:text-4xl">Doubly Circular Linked List Visualizer</h1>
          <p className="mt-3 max-w-3xl text-[#9CA763]">
            Visualize doubly-linked circular behavior where nodes connect in both directions and head-tail links stay closed.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              type="text"
              value={valueInput}
              onChange={(event) => setValueInput(event.target.value)}
              placeholder="Enter value"
              className="w-full rounded-xl border border-[#D8CCA3] bg-[#F1E8C7] px-4 py-2.5 text-sm outline-none ring-[#AAB76A] transition focus:ring"
            />
            <input
              type="number"
              value={positionInput}
              onChange={(event) => setPositionInput(event.target.value)}
              placeholder="Enter position (0-based)"
              className="w-full rounded-xl border border-[#D8CCA3] bg-[#F1E8C7] px-4 py-2.5 text-sm outline-none ring-[#AAB76A] transition focus:ring"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <button onClick={handleInsertBeginning} className="rounded-xl bg-[#4B5320] px-3 py-2 text-sm font-medium text-white hover:bg-[#7D8F3B]">Insert at Beginning</button>
            <button onClick={handleInsertEnd} className="rounded-xl bg-[#4B5320] px-3 py-2 text-sm font-medium text-white hover:bg-[#7D8F3B]">Insert at End</button>
            <button onClick={handleInsertPosition} className="rounded-xl bg-[#7D8F3B] px-3 py-2 text-sm font-medium text-white hover:bg-[#F7F1DD]0">Insert at Position</button>
            <button onClick={handleDeleteBeginning} className="rounded-xl border border-[#D8CCA3] bg-[#F7F1DD] px-3 py-2 text-sm font-medium text-[#4B5320] hover:bg-[#F1E8C7]">Delete at Beginning</button>
            <button onClick={handleDeleteEnd} className="rounded-xl border border-[#D8CCA3] bg-[#F7F1DD] px-3 py-2 text-sm font-medium text-[#4B5320] hover:bg-[#F1E8C7]">Delete at End</button>
            <button onClick={handleDeletePosition} className="rounded-xl border border-[#D8CCA3] bg-[#F7F1DD] px-3 py-2 text-sm font-medium text-[#4B5320] hover:bg-[#F1E8C7]">Delete at Position</button>
            <button onClick={handleSearch} className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#F7F1DD]0 px-3 py-2 text-sm font-medium text-white hover:bg-[#9CA763]"><Search className="h-4 w-4" />Search Value</button>
            <button onClick={handleReset} className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#AAB76A] bg-[#F7F1DD] px-3 py-2 text-sm font-medium text-[#7D8F3B] hover:bg-[#F1E8C7]"><RotateCcw className="h-4 w-4" />Reset</button>
          </div>
        </section>

        <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#4B5320]">Doubly Circular Visual Area</h2>
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="rounded-full border border-[#AAB76A] bg-[#F7F1DD] px-3 py-1 text-[#7D8F3B]">HEAD: {headAddress}</span>
              <span className="rounded-full border border-[#AAB76A] bg-[#F7F1DD] px-3 py-1 text-[#7D8F3B]">TAIL: {tailAddress}</span>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] p-4">
            {list.length === 0 ? (
              <div className="text-sm text-[#9CA763]">HEAD -&gt; NULL, TAIL -&gt; NULL</div>
            ) : (
              <div className="min-w-max">
                <motion.div layout className="flex items-center gap-2">
                  <AnimatePresence>
                    {list.map((value, index) => {
                      const isHighlighted = highlightedIndex === index;
                      const prevAddress = index === 0 ? addressOf(list.length - 1) : addressOf(index - 1);
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
                            <div className="flex border-b border-[#D8CCA3] text-center">
                              <div className="border-r border-[#D8CCA3] px-3 py-2">
                                <p className="text-xs text-[#9CA763]">prev</p>
                                <p className="text-sm font-semibold text-[#4B5320]">{prevAddress}</p>
                              </div>
                              <div className="border-r border-[#D8CCA3] px-3 py-2">
                                <p className="text-xs text-[#9CA763]">data</p>
                                <p className="text-sm font-semibold text-[#4B5320]">{value}</p>
                              </div>
                              <div className="px-3 py-2">
                                <p className="text-xs text-[#9CA763]">next</p>
                                <p className="text-sm font-semibold text-[#4B5320]">{nextAddress}</p>
                              </div>
                            </div>
                            <p className="py-1 text-center text-xs text-[#9CA763]">addr: {addressOf(index)}</p>
                          </motion.div>

                          {index < list.length - 1 && <ArrowLeftRight className="h-4 w-4 text-[#D8CCA3]" />}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>

                <motion.div
                  animate={{ rotate: [0, 3, 0, -3, 0] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.7 }}
                  className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#AAB76A] bg-[#F7F1DD] px-3 py-2 text-xs font-medium text-[#7D8F3B]"
                >
                  <span>Forward loop:</span>
                  <span>tail.next = head ({tailAddress} -&gt; {headAddress})</span>
                  <span className="text-base">?</span>
                </motion.div>

                <motion.div
                  animate={{ rotate: [0, -3, 0, 3, 0] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.9 }}
                  className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-[#AAB76A] bg-[#F7F1DD] px-3 py-2 text-xs font-medium text-[#7D8F3B]"
                >
                  <span>Backward loop:</span>
                  <span>head.prev = tail ({headAddress} &lt;- {tailAddress})</span>
                  <span className="text-base">?</span>
                </motion.div>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-[#AAB76A] bg-[#F7F1DD] p-4">
            <p className="text-sm font-semibold text-[#7D8F3B]">Key Concept</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#7D8F3B]">
              <li>Nodes have prev and next pointers.</li>
              <li>Last node points to first node.</li>
              <li>First node points back to last node.</li>
              <li>Traversal possible in both directions.</li>
              <li>No NULL pointers exist in a non-empty doubly circular linked list.</li>
            </ul>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA763]">Final linked list</p>
                <p className="mt-1 font-mono text-[#4B5320]">{explanation.finalList}</p>
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
                <p key={`${line}-${index}`}>{line === "" ? " " : line}</p>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
