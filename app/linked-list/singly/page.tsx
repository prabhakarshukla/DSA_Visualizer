"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, RotateCcw, Search } from "lucide-react";
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
const formatList = (list: string[]) => (list.length === 0 ? "HEAD -> NULL" : `HEAD -> ${list.join(" -> ")} -> NULL`);

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
  "insert-beginning": ["newNode = createNode(value)", "newNode.next = head", "head = newNode"],
  "insert-end": [
    "newNode = createNode(value)",
    "if head == NULL:",
    "    head = newNode",
    "else:",
    "    temp = head",
    "    while temp.next != NULL:",
    "        temp = temp.next",
    "    temp.next = newNode",
  ],
  "insert-position": [
    "newNode = createNode(value)",
    "",
    "if position == 0:",
    "    newNode.next = head",
    "    head = newNode",
    "else:",
    "    temp = head",
    "    for i = 0 to position - 2:",
    "        temp = temp.next",
    "",
    "    newNode.next = temp.next",
    "    temp.next = newNode",
  ],
  "delete-beginning": [
    "if head == NULL:",
    "    print \"Empty list\"",
    "else:",
    "    temp = head",
    "    head = head.next",
    "    delete temp",
  ],
  "delete-end": [
    "if head == NULL:",
    "    print \"Empty list\"",
    "else if head.next == NULL:",
    "    delete head",
    "    head = NULL",
    "else:",
    "    temp = head",
    "    while temp.next.next != NULL:",
    "        temp = temp.next",
    "    delete temp.next",
    "    temp.next = NULL",
  ],
  "delete-position": [
    "if head == NULL:",
    "    print \"Empty list\"",
    "else if position == 0:",
    "    temp = head",
    "    head = head.next",
    "    delete temp",
    "else:",
    "    temp = head",
    "    for i = 0 to position - 2:",
    "        temp = temp.next",
    "",
    "    nodeToDelete = temp.next",
    "    temp.next = nodeToDelete.next",
    "    delete nodeToDelete",
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
  reset: ["list = [10, 20, 30]", "clear highlighted node", "clear value input", "clear position input"],
  idle: ["Select operation to view linked list pseudocode."],
};

export default function LinkedListPage() {
  const [linkedList, setLinkedList] = useState<string[]>(defaultList);
  const [valueInput, setValueInput] = useState("");
  const [positionInput, setPositionInput] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [activeOperation, setActiveOperation] = useState<OperationKey>("idle");
  const [explanation, setExplanation] = useState<ExplanationData>({
    operation: "Overview",
    concept:
      "Linked List me elements memory me continuous nahi hote. Har node ke paas data aur next pointer hota hai jo next node ka address store karta hai.",
    steps: [
      "Head first node ka address store karta hai.",
      "Har node ka next field next node ka address store karta hai.",
      "Last node ka next NULL hota hai.",
    ],
    finalList: formatList(defaultList),
    timeComplexity: "Depends on operation",
    examNote: "Pointer link understanding interviews me bahut important hoti hai.",
  });

  const pseudocode = useMemo(() => pseudocodeMap[activeOperation], [activeOperation]);
  const headAddress = linkedList.length === 0 ? "NULL" : addressOf(0);

  const setValidationExplanation = (operation: OperationKey, message: string) => {
    setExplanation({
      operation: `${operationLabels[operation]} (Validation)`,
      concept: message,
      steps: [
        "Operation se pehle input validation zaroori hai.",
        "Invalid value/position se pointer linking concept clear nahi hota.",
        "Correct input do aur operation phir try karo.",
      ],
      finalList: formatList(linkedList),
      timeComplexity: "N/A (validation step)",
      examNote: "Boundary conditions explain karna exams/interviews me plus point hai.",
    });
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

  const requireValue = (operation: OperationKey) => {
    if (valueInput.trim() === "") {
      setValidationExplanation(operation, "Please enter a value first.");
      return null;
    }
    return valueInput.trim();
  };

  const clearHighlight = () => setHighlightedIndex(null);

  const handleInsertBeginning = () => {
    setActiveOperation("insert-beginning");
    const value = requireValue("insert-beginning");
    if (value === null) return;

    clearHighlight();
    const nextList = [value, ...linkedList];
    setLinkedList(nextList);
    setExplanation({
      operation: "Insert at Beginning",
      concept:
        "New node with address 100 new HEAD ban jata hai. Is node ka next field old first node ka address store karta hai.",
      steps: [
        `New node (${value}) insert hua at position 0 with address ${addressOf(0)}.`,
        linkedList.length === 0
          ? "List empty thi, isliye new node ka next NULL raha."
          : `new node ka next old first node ka address ${addressOf(1)} store karta hai.`,
        `HEAD ab ${addressOf(0)} store karta hai.`,
      ],
      finalList: formatList(nextList),
      timeComplexity: "O(1)",
      examNote: "Beginning insertion me traversal nahi hota, isliye constant time hota hai.",
    });
  };

  const handleInsertEnd = () => {
    setActiveOperation("insert-end");
    const value = requireValue("insert-end");
    if (value === null) return;

    clearHighlight();
    const nextList = [...linkedList, value];
    setLinkedList(nextList);
    setExplanation({
      operation: "Insert at End",
      concept:
        "Traversal last node tak hota hai, phir last node ka next NULL se update hoke new node ka address store karta hai.",
      steps: [
        `New node (${value}) create hua with address ${addressOf(nextList.length - 1)} and next = NULL.`,
        "Head se traverse karke last node tak gaye.",
        linkedList.length === 0
          ? `HEAD ne direct ${addressOf(0)} store kiya.`
          : `Previous last node ka next NULL se ${addressOf(nextList.length - 1)} par update hua.`,
      ],
      finalList: formatList(nextList),
      timeComplexity: "O(n)",
      examNote: "Tail pointer na ho toh end insert ke liye traversal mandatory hota hai.",
    });
  };

  const handleInsertPosition = () => {
    setActiveOperation("insert-position");
    const value = requireValue("insert-position");
    if (value === null) return;

    const position = parsePosition("insert-position");
    if (position === null) return;

    if (position < 0 || position > linkedList.length) {
      setValidationExplanation("insert-position", "Invalid position for insertion.");
      return;
    }

    clearHighlight();
    const nextList = [...linkedList.slice(0, position), value, ...linkedList.slice(position)];
    setLinkedList(nextList);
    setExplanation({
      operation: "Insert at Position",
      concept:
        "Given position validate hoti hai. Position 0 par insertion beginning jaisa hota hai, otherwise previous node tak traversal karke address links update karte hain.",
      steps: [
        `Position ${position} valid hai (0 se ${linkedList.length}).`,
        `New node (${value}) inserted at address ${addressOf(position)}.`,
        position === 0
          ? "HEAD new node ka address store karta hai aur new node ka next old head address store karta hai."
          : `Previous node (position ${position - 1}) ka next new address ${addressOf(position)} store karta hai; new node ka next old successor address store karta hai.`,
      ],
      finalList: formatList(nextList),
      timeComplexity: "O(n)",
      examNote: "Middle insertion me pointer rewiring ka logic likhna exam me important hota hai.",
    });
  };

  const handleDeleteBeginning = () => {
    setActiveOperation("delete-beginning");
    if (linkedList.length === 0) {
      setValidationExplanation("delete-beginning", "Linked list is already empty.");
      return;
    }

    clearHighlight();
    const removed = linkedList[0];
    const nextList = linkedList.slice(1);
    setLinkedList(nextList);
    setExplanation({
      operation: "Delete at Beginning",
      concept: "Head node remove hota hai aur HEAD ko next node ke address par move kiya jata hai.",
      steps: [
        `Head node (${removed}) remove hua from address ${addressOf(0)}.`,
        nextList.length === 0 ? "List empty ho gayi, HEAD -> NULL." : `HEAD ab ${addressOf(0)} (new first node) store karta hai.`,
        "Pointer chain automatically next nodes ke through continue hoti hai.",
      ],
      finalList: formatList(nextList),
      timeComplexity: "O(1)",
      examNote: "Head update operation fast hota hai kyunki direct pointer change hai.",
    });
  };

  const handleDeleteEnd = () => {
    setActiveOperation("delete-end");
    if (linkedList.length === 0) {
      setValidationExplanation("delete-end", "Linked list is already empty.");
      return;
    }

    clearHighlight();
    const removed = linkedList[linkedList.length - 1];
    const nextList = linkedList.slice(0, -1);
    setLinkedList(nextList);
    setExplanation({
      operation: "Delete at End",
      concept:
        "Second last node tak traversal karte hain, last node remove hota hai, aur second last node ka next field NULL set hota hai.",
      steps: [
        linkedList.length === 1 ? "Single node remove hone par HEAD -> NULL." : "Traversal second last node tak gaya.",
        `Last node (${removed}) remove hua.`,
        linkedList.length === 1
          ? "List empty ho gayi."
          : `Second last node ka next field update hoke NULL ho gaya.`,
      ],
      finalList: formatList(nextList),
      timeComplexity: "O(n)",
      examNote: "End deletion me traversal cost dominant hoti hai jab tail pointer absent ho.",
    });
  };

  const handleDeletePosition = () => {
    setActiveOperation("delete-position");
    if (linkedList.length === 0) {
      setValidationExplanation("delete-position", "Linked list is already empty.");
      return;
    }

    const position = parsePosition("delete-position");
    if (position === null) return;

    if (position < 0 || position >= linkedList.length) {
      setValidationExplanation("delete-position", "Invalid position for deletion.");
      return;
    }

    clearHighlight();
    const removed = linkedList[position];
    const nextList = [...linkedList.slice(0, position), ...linkedList.slice(position + 1)];
    setLinkedList(nextList);
    setExplanation({
      operation: "Delete at Position",
      concept:
        "Given position validate hoti hai. Position 0 par deletion beginning jaisa hota hai; otherwise previous node ka next, deleted node ke next wale address ko store karta hai.",
      steps: [
        `Position ${position} validate hui.`,
        position === 0
          ? (nextList.length === 0 ? "HEAD -> NULL set hua." : `HEAD ne new first node ka address ${addressOf(0)} store kiya.`)
          : `Previous node (position ${position - 1}) ka next pointer deleted node ko skip karke next node ke address par set hua.`,
        `Target node (${removed}) remove ho gaya.`,
      ],
      finalList: formatList(nextList),
      timeComplexity: "O(n)",
      examNote: "Pointer relinking step ko diagram ke saath explain karna scoring hota hai.",
    });
  };

  const handleSearch = () => {
    setActiveOperation("search");
    const value = requireValue("search");
    if (value === null) return;

    const foundIndex = linkedList.findIndex((node) => node === value);
    if (foundIndex === -1) {
      setHighlightedIndex(null);
      setExplanation({
        operation: "Search Value",
        concept:
          "Traversal head se start hota hai, har node ka data compare hota hai; value na mile toh not found message show hota hai.",
        steps: [
          `Value ${value} ke liye head se sequential scan hua.`,
          "Har node compare hua but exact match nahi mila.",
          "Traversal NULL par end hua.",
        ],
        finalList: formatList(linkedList),
        timeComplexity: "Best: O(1), Worst: O(n)",
        examNote: "Linked list me random access nahi hota, isliye linear search hi use hoti hai.",
      });
      return;
    }

    setHighlightedIndex(foundIndex);
    setExplanation({
      operation: "Search Value",
      concept:
        "Traversal head se start hota hai, har node ka data compare hota hai, aur value milte hi us node ka address identify ho jata hai.",
      steps: [
        `Value ${value} ko node by node compare kiya gaya.`,
        `Match position ${foundIndex} par mila with address ${addressOf(foundIndex)}.`,
        "Matched node highlight hua aur traversal stop ho gaya.",
      ],
      finalList: formatList(linkedList),
      timeComplexity: "Best: O(1), Worst: O(n)",
      examNote: "Best case head match hai; worst case full traversal till NULL hota hai.",
    });
  };

  const handleReset = () => {
    setActiveOperation("reset");
    setLinkedList(defaultList);
    setValueInput("");
    setPositionInput("");
    setHighlightedIndex(null);
    setExplanation({
      operation: "Reset",
      concept: "Linked list default nodes par reset hoti hai, highlighted node clear hota hai, aur inputs clear ho jate hain.",
      steps: [
        "Linked list default values [10, 20, 30] par reset hui with addresses 100, 101, 102.",
        "Highlighted node clear ho gaya.",
        "Value aur position input fields clear ho gaye.",
      ],
      finalList: formatList(defaultList),
      timeComplexity: "O(n)",
      examNote: "Reset se aap same scenario ko baar-baar practice kar sakte ho.",
    });
  };

  return (
    <main className="min-h-screen bg-[#F1E8C7] px-4 py-10 text-[#4B5320] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-[#7D8F3B] hover:text-[#4B5320]">
          &larr; Back to homepage
        </Link>

        <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#4B5320] sm:text-4xl">Singly Linked List Visualizer</h1>
          <p className="mt-3 max-w-3xl text-[#9CA763]">
            Understand HEAD updates, next pointer changes, and node address linking step by step.
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
          <h2 className="text-lg font-semibold text-[#4B5320]">Linked List Visual Area</h2>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] p-4">
            {linkedList.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-[#9CA763]">
                <span className="rounded-full border border-[#AAB76A] bg-[#F7F1DD] px-2 py-0.5 text-[#7D8F3B]">HEAD stores NULL</span>
                <ArrowRight className="h-4 w-4 text-[#D8CCA3]" />
                <span>NULL</span>
              </div>
            ) : (
              <div className="min-w-max">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[#7D8F3B]">
                  <span className="rounded-full border border-[#AAB76A] bg-[#F7F1DD] px-2 py-0.5">HEAD stores {headAddress}</span>
                  <ArrowRight className="h-4 w-4 text-[#7D8F3B]" />
                </div>

                <motion.div layout className="flex items-center gap-2">
                  <AnimatePresence>
                    {linkedList.map((value, index) => {
                      const isHighlighted = highlightedIndex === index;
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
                            <div className="flex border-b border-[#D8CCA3]">
                              <div className="border-r border-[#D8CCA3] px-4 py-2 text-center">
                                <p className="text-xs text-[#9CA763]">data</p>
                                <p className="text-sm font-semibold text-[#4B5320]">{value}</p>
                              </div>
                              <div className="px-4 py-2 text-center">
                                <p className="text-xs text-[#9CA763]">next</p>
                                <p className="text-sm font-semibold text-[#4B5320]">{index === linkedList.length - 1 ? "NULL" : addressOf(index + 1)}</p>
                              </div>
                            </div>
                            <div className="py-1 text-center text-xs text-[#9CA763]">
                              <p>addr: {addressOf(index)}</p>
                              <p>pos: {index}</p>
                            </div>
                          </motion.div>

                          <ArrowRight className="h-4 w-4 text-[#D8CCA3]" />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  <span className="rounded-full border border-[#D8CCA3] bg-[#F7F1DD] px-2 py-0.5 text-xs font-medium text-[#9CA763]">NULL</span>
                </motion.div>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-[#AAB76A] bg-[#F7F1DD] p-4">
            <p className="text-sm font-semibold text-[#7D8F3B]">Key Concept</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#7D8F3B]">
              <li>Each node has data and next pointer.</li>
              <li>Next pointer stores the address of the next node.</li>
              <li>The last node stores NULL in next field.</li>
              <li>HEAD stores the address of the first node.</li>
              <li>Nodes are not stored in continuous memory.</li>
              <li>Position-based operations usually require traversal.</li>
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
              {pseudocode.map((line, idx) => (
                <p key={`${line}-${idx}`}>{line === "" ? " " : line}</p>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
