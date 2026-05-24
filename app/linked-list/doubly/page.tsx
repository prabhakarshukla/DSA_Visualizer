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
const formatList = (list: string[]) => (list.length === 0 ? "HEAD <-> NULL" : `HEAD <-> ${list.join(" <-> ")} <-> NULL`);

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
    "newNode.prev = NULL",
    "newNode.next = head",
    "if head != NULL:",
    "    head.prev = newNode",
    "head = newNode",
  ],
  "insert-end": [
    "newNode = createNode(value)",
    "if head == NULL:",
    "    head = newNode",
    "else:",
    "    temp = head",
    "    while temp.next != NULL:",
    "        temp = temp.next",
    "    temp.next = newNode",
    "    newNode.prev = temp",
  ],
  "insert-position": [
    "newNode = createNode(value)",
    "if position == 0:",
    "    newNode.next = head",
    "    if head != NULL: head.prev = newNode",
    "    head = newNode",
    "else:",
    "    temp = head",
    "    for i = 0 to position - 2:",
    "        temp = temp.next",
    "    newNode.next = temp.next",
    "    newNode.prev = temp",
    "    if temp.next != NULL: temp.next.prev = newNode",
    "    temp.next = newNode",
  ],
  "delete-beginning": [
    "if head == NULL: print \"Empty\"",
    "else:",
    "    temp = head",
    "    head = head.next",
    "    if head != NULL: head.prev = NULL",
    "    delete temp",
  ],
  "delete-end": [
    "if head == NULL: print \"Empty\"",
    "else if head.next == NULL:",
    "    delete head",
    "    head = NULL",
    "else:",
    "    temp = head",
    "    while temp.next != NULL:",
    "        temp = temp.next",
    "    temp.prev.next = NULL",
    "    delete temp",
  ],
  "delete-position": [
    "if head == NULL: print \"Empty\"",
    "else if position == 0:",
    "    temp = head",
    "    head = head.next",
    "    if head != NULL: head.prev = NULL",
    "    delete temp",
    "else:",
    "    temp = head",
    "    for i = 0 to position:",
    "        temp = temp.next",
    "    temp.prev.next = temp.next",
    "    if temp.next != NULL: temp.next.prev = temp.prev",
    "    delete temp",
  ],
  search: [
    "temp = head",
    "position = 0",
    "while temp != NULL:",
    "    if temp.data == value:",
    "        return position",
    "    temp = temp.next",
    "    position = position + 1",
    "return -1",
  ],
  reset: [
    "list = [10, 20, 30]",
    "clear highlight",
    "clear inputs",
    "restore default visualization",
  ],
  idle: ["Select an operation to view detailed pseudocode."],
};

export default function DoublyLinkedListPage() {
  const [list, setList] = useState<string[]>(defaultList);
  const [valueInput, setValueInput] = useState("");
  const [positionInput, setPositionInput] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [activeOperation, setActiveOperation] = useState<OperationKey>("idle");
  const [explanation, setExplanation] = useState<ExplanationData>({
    operation: "Overview",
    concept:
      "Doubly Linked List me har node ke paas do pointers hote hain: prev aur next. Isliye traversal dono directions me possible hota hai.",
    steps: [
      "Head first node ka address store karta hai.",
      "Tail last node hota hai jiska next NULL hota hai.",
      "Middle node me prev aur next dono valid addresses store hote hain.",
    ],
    finalList: formatList(defaultList),
    timeComplexity: "Depends on operation",
    examNote: "Pointer updates correctly explain karna doubly linked list questions me key scoring area hota hai.",
  });

  const pseudocode = useMemo(() => pseudocodeMap[activeOperation], [activeOperation]);
  const headAddress = list.length === 0 ? "NULL" : addressOf(0);
  const tailAddress = list.length === 0 ? "NULL" : addressOf(list.length - 1);

  const setValidationExplanation = (operation: OperationKey, message: string) => {
    setExplanation({
      operation: `${operationLabels[operation]} (Validation)`,
      concept: message,
      steps: [
        "Operation se pehle value/position validate karna zaroori hai.",
        "Invalid input se prev/next pointer links galat ho sakte hain.",
        "Correct input dekar operation phir run karo.",
      ],
      finalList: formatList(list),
      timeComplexity: "N/A (validation step)",
      examNote: "Interviews me edge-case handling clear hona expected hota hai.",
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
        "New node create hota hai, newNode.next old head ko point karta hai, old head.prev new node ko point karta hai, aur head update hota hai.",
      steps: [
        `New node (${value}) beginning par add hua at address ${addressOf(0)}.`,
        list.length === 0
          ? "List empty thi, isliye new node ka prev=NULL aur next=NULL raha."
          : `newNode.next old head address ${addressOf(1)} store karta hai aur old head.prev ${addressOf(0)} ho gaya.`,
        `HEAD update hoke ${addressOf(0)} store karta hai.`,
      ],
      finalList: formatList(nextList),
      timeComplexity: "O(1)",
      examNote: "Beginning insertion me traversal nahi hota, isliye constant-time operation hai.",
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
        "Traversal tail tak hota hai, tail.next new node ko point karta hai, newNode.prev old tail ko point karta hai, aur tail update hota hai.",
      steps: [
        `New node (${value}) create hua with address ${addressOf(nextList.length - 1)}.`,
        list.length === 0 ? "List empty thi, HEAD/TAIL dono new node par set hue." : `Old tail address ${addressOf(list.length - 1)} tak traversal hua.`,
        list.length === 0
          ? "new node ka prev=NULL aur next=NULL raha."
          : `tail.next ${addressOf(nextList.length - 1)} set hua aur newNode.prev ${addressOf(nextList.length - 2)} set hua.`,
      ],
      finalList: formatList(nextList),
      timeComplexity: "O(n)",
      examNote: "Tail pointer optimize kar sakta hai, lekin basic traversal model me O(n) expected hai.",
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
      concept:
        "Position insertion me traversal required hota hai aur prev + next dono links update hote hain.",
      steps: [
        `Position ${position} validate hui (0 se ${list.length}).`,
        `New node (${value}) inserted at address ${addressOf(position)}.`,
        position === 0
          ? "Position 0 case me head update hua aur old head.prev new node par set hua."
          : `Previous node tak traversal ke baad previous.next aur successor.prev dono re-link hue.`,
      ],
      finalList: formatList(nextList),
      timeComplexity: "O(n)",
      examNote: "Doubly list me extra pointer updates likhna bhoolna nahi chahiye in exams.",
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
      concept: "Old head remove hota hai aur new head.prev NULL set hota hai.",
      steps: [
        `Old head (${removed}) remove hua from address ${addressOf(0)}.`,
        nextList.length === 0 ? "List empty ho gayi, HEAD/TAIL NULL ho gaye." : `New head address ${addressOf(0)} bana aur uska prev NULL set hua.`,
        "Remaining nodes ke links sequentially update ho gaye.",
      ],
      finalList: formatList(nextList),
      timeComplexity: "O(1)",
      examNote: "Beginning deletion direct pointer update hai, traversal required nahi hota.",
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
      concept: "Tail remove hota hai aur new tail.next NULL set hota hai.",
      steps: [
        list.length === 1 ? "Single node remove hone par list empty ho gayi." : "Traversal old tail tak kiya gaya.",
        `Tail node (${removed}) delete hua.`,
        nextList.length === 0 ? "HEAD/TAIL dono NULL ho gaye." : `New tail address ${addressOf(nextList.length - 1)} bana aur uska next NULL set hua.`,
      ],
      finalList: formatList(nextList),
      timeComplexity: "O(n)",
      examNote: "Traversal-based implementation me end delete linear hota hai.",
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
      concept: "Previous aur next nodes reconnect hote hain, aur dono prev/next pointers update hote hain.",
      steps: [
        `Position ${position} validate hui.`,
        position === 0
          ? "Position 0 case beginning deletion jaisa handle hua."
          : "Traversal target node tak hua, then previous.next aur next.prev dono update hue.",
        `Target node (${removed}) remove ho gaya.`,
      ],
      finalList: formatList(nextList),
      timeComplexity: "O(n)",
      examNote: "Middle deletion me both-direction links ko sahi update karna mandatory hota hai.",
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
        concept: "Traversal sequentially hota hai; value na mile toh not found result aata hai.",
        steps: [
          `Value ${value} ko head se sequential compare kiya gaya.`,
          "Kisi node me exact match nahi mila.",
          "Traversal NULL par end hua aur not found message show hua.",
        ],
        finalList: formatList(list),
        timeComplexity: "Best: O(1), Worst: O(n)",
        examNote: "Head match best case hai; last/missing node case worst hota hai.",
      });
      return;
    }

    setHighlightedIndex(foundIndex);
    setExplanation({
      operation: "Search Value",
      concept: "Traversal sequentially hota hai aur matching node highlight hota hai.",
      steps: [
        `Value ${value} ke liye head se comparison start hua.`,
        `Match position ${foundIndex} par mila (address ${addressOf(foundIndex)}).`,
        "Matched node highlight hua aur search stop ho gaya.",
      ],
      finalList: formatList(list),
      timeComplexity: "Best: O(1), Worst: O(n)",
      examNote: "Doubly linked list me bhi forward linear search common approach hoti hai.",
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
      concept: "Default list restore hoti hai, highlights clear hote hain, aur input fields reset ho jate hain.",
      steps: [
        "List default nodes [10, 20, 30] par wapas set hui.",
        "Highlighted node clear hua.",
        "Value aur position inputs clear ho gaye.",
      ],
      finalList: formatList(defaultList),
      timeComplexity: "O(n)",
      examNote: "Reset demo state ko stable banata hai for repeated practice.",
    });
  };

  return (
    <main className="min-h-screen bg-[#F1E8C7] px-4 py-10 text-[#4B5320] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <Link href="/linked-list" className="text-[#556B2F] hover:text-[#4B5320]">
            &larr; Back to Linked List overview
          </Link>
          <Link href="/" className="text-[#556B2F] hover:text-[#4B5320]">
            Back to homepage
          </Link>
        </div>

        <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#4B5320] sm:text-4xl">Doubly Linked List Visualizer</h1>
          <p className="mt-3 max-w-3xl text-[#556B2F]">
            Visualize nodes with prev and next pointers, and understand bidirectional linking with address-based flow.
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
            <button onClick={handleReset} className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#AAB76A] bg-[#F7F1DD] px-3 py-2 text-sm font-medium text-[#556B2F] hover:bg-[#F1E8C7]"><RotateCcw className="h-4 w-4" />Reset</button>
          </div>
        </section>

        <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#4B5320]">Doubly Linked List Visual Area</h2>
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="rounded-full border border-[#AAB76A] bg-[#F7F1DD] px-3 py-1 text-[#556B2F]">HEAD: {headAddress}</span>
              <span className="rounded-full border border-[#AAB76A] bg-[#F7F1DD] px-3 py-1 text-[#556B2F]">TAIL: {tailAddress}</span>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] p-4">
            {list.length === 0 ? (
              <div className="text-sm text-[#556B2F]">HEAD -&gt; NULL, TAIL -&gt; NULL</div>
            ) : (
              <motion.div layout className="flex min-w-max items-center gap-2">
                <AnimatePresence>
                  {list.map((value, index) => {
                    const isHighlighted = highlightedIndex === index;
                    const prevAddress = index === 0 ? "NULL" : addressOf(index - 1);
                    const nextAddress = index === list.length - 1 ? "NULL" : addressOf(index + 1);

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
                              <p className="text-xs text-[#556B2F]">prev</p>
                              <p className="text-sm font-semibold text-[#4B5320]">{prevAddress}</p>
                            </div>
                            <div className="border-r border-[#D8CCA3] px-3 py-2">
                              <p className="text-xs text-[#556B2F]">data</p>
                              <p className="text-sm font-semibold text-[#4B5320]">{value}</p>
                            </div>
                            <div className="px-3 py-2">
                              <p className="text-xs text-[#556B2F]">next</p>
                              <p className="text-sm font-semibold text-[#4B5320]">{nextAddress}</p>
                            </div>
                          </div>
                          <p className="py-1 text-center text-xs text-[#556B2F]">addr: {addressOf(index)}</p>
                        </motion.div>

                        {index < list.length - 1 && <ArrowLeftRight className="h-4 w-4 text-[#D8CCA3]" />}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-[#AAB76A] bg-[#F7F1DD] p-4">
            <p className="text-sm font-semibold text-[#556B2F]">Key Concept</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#556B2F]">
              <li>Each node has prev and next pointer.</li>
              <li>Traversal possible in both directions.</li>
              <li>Extra memory required compared to singly linked list.</li>
              <li>Head.prev = NULL</li>
              <li>Tail.next = NULL</li>
            </ul>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Final linked list</p>
                <p className="mt-1 font-mono text-[#4B5320]">{explanation.finalList}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#556B2F]">Time complexity</p>
                <span className="rounded-full border border-[#AAB76A] bg-[#F7F1DD] px-2.5 py-1 text-xs font-semibold text-[#556B2F]">{explanation.timeComplexity}</span>
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
