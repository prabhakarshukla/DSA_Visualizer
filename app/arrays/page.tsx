"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";

type OperationKey =
  | "insert-beginning"
  | "insert-end"
  | "insert-index"
  | "delete-beginning"
  | "delete-end"
  | "delete-index"
  | "search"
  | "reset"
  | "idle";

type ExplanationData = {
  operation: string;
  concept: string;
  steps: string[];
  finalArray: string;
  timeComplexity: string;
  examNote: string;
};

const defaultArray = ["10", "20", "30"];

const operationLabels: Record<OperationKey, string> = {
  "insert-beginning": "Insert at Beginning",
  "insert-end": "Insert at End",
  "insert-index": "Insert at Index",
  "delete-beginning": "Delete at Beginning",
  "delete-end": "Delete at End",
  "delete-index": "Delete at Index",
  search: "Search Value",
  reset: "Reset",
  idle: "Overview",
};

const pseudocodeMap: Record<OperationKey, string[]> = {
  "insert-beginning": [
    "Input: arr, n, value",
    "for i = n - 1 down to 0",
    "    arr[i + 1] = arr[i]   // right shift",
    "arr[0] = value",
    "n = n + 1",
    "return arr",
  ],
  "insert-end": [
    "Input: arr, n, value",
    "arr[n] = value",
    "n = n + 1",
    "return arr",
  ],
  "insert-index": [
    "Input: arr, n, value, index",
    "if index < 0 or index > n: invalid",
    "for i = n - 1 down to index",
    "    arr[i + 1] = arr[i]   // right shift",
    "arr[index] = value",
    "n = n + 1",
    "return arr",
  ],
  "delete-beginning": [
    "Input: arr, n",
    "if n == 0: underflow",
    "for i = 1 to n - 1",
    "    arr[i - 1] = arr[i]   // left shift",
    "n = n - 1",
    "return arr",
  ],
  "delete-end": [
    "Input: arr, n",
    "if n == 0: underflow",
    "n = n - 1",
    "return arr",
  ],
  "delete-index": [
    "Input: arr, n, index",
    "if index < 0 or index >= n: invalid",
    "for i = index + 1 to n - 1",
    "    arr[i - 1] = arr[i]   // left shift",
    "n = n - 1",
    "return arr",
  ],
  search: [
    "Input: arr, n, value",
    "for i = 0 to n - 1",
    "    if arr[i] == value",
    "        return i",
    "return -1",
  ],
  reset: [
    "arr = [10, 20, 30]",
    "clear value input",
    "clear index input",
    "clear highlighted index",
    "show default state",
  ],
  idle: ["Select operation to view detailed pseudocode."],
};

const formatArray = (arr: string[]) => `[${arr.map((value) => `"${value}"`).join(", ")}]`;

export default function ArraysPage() {
  const [array, setArray] = useState<string[]>(defaultArray);
  const [valueInput, setValueInput] = useState("");
  const [indexInput, setIndexInput] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [activeOperation, setActiveOperation] = useState<OperationKey>("idle");
  const [explanation, setExplanation] = useState<ExplanationData>({
    operation: "Overview",
    concept:
      "Array me elements contiguous memory locations me store hote hain, aur index 0 se start hota hai.",
    steps: [
      "Koi bhi operation choose karo: insert, delete, search ya reset.",
      "Visualizer me shifting aur index update clearly show hoga.",
      "Exam perspective se complexity observe karna important hai.",
    ],
    finalArray: formatArray(defaultArray),
    timeComplexity: "Depends on operation",
    examNote:
      "Insertion/deletion beginning ya middle me generally O(n) hota hai, while end operations often O(1) hoti hain.",
  });

  const pseudocode = useMemo(() => pseudocodeMap[activeOperation], [activeOperation]);

  const setValidationExplanation = (operation: OperationKey, message: string) => {
    setExplanation({
      operation: `${operationLabels[operation]} (Validation)`,
      concept: message,
      steps: [
        "Input validate karna compulsory hai before array operation.",
        "Galat input se shifting/index calculation incorrect ho sakti hai.",
        "Sahi value/index do, phir operation dobara run karo.",
      ],
      finalArray: formatArray(array),
      timeComplexity: "N/A (validation step)",
      examNote: "Interviews me edge-case handling clearly explain karna strong point hota hai.",
    });
  };

  const parseIndex = () => {
    if (indexInput.trim() === "") {
      setValidationExplanation("insert-index", "Please enter an index first.");
      return null;
    }
    const parsed = Number(indexInput);
    if (!Number.isInteger(parsed)) {
      setValidationExplanation("insert-index", "Please enter an index first.");
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

  const clearSearchHighlight = () => setHighlightedIndex(null);

  const handleInsertBeginning = () => {
    setActiveOperation("insert-beginning");
    const value = requireValue("insert-beginning");
    if (value === null) return;

    clearSearchHighlight();
    const nextArray = [value, ...array];
    setArray(nextArray);
    setExplanation({
      operation: "Insert at Beginning",
      concept:
        "Array me beginning insertion ka matlab new value index 0 par place karna. Iske liye existing elements ko one position right shift karna padta hai.",
      steps: [
        `Value ${value} ko index 0 par insert kiya gaya.`,
        "Pehle ke saare elements right shift hue, taki overwrite na ho.",
        "Shifting ke baad indexes update hue: old index i, new index i+1.",
      ],
      finalArray: formatArray(nextArray),
      timeComplexity: "O(n)",
      examNote:
        "Beginning insertion expensive hoti hai kyunki almost har element move hota hai. Isliye large arrays me cost badh jati hai.",
    });
  };

  const handleInsertEnd = () => {
    setActiveOperation("insert-end");
    const value = requireValue("insert-end");
    if (value === null) return;

    clearSearchHighlight();
    const nextArray = [...array, value];
    setArray(nextArray);
    setExplanation({
      operation: "Insert at End",
      concept:
        "End insertion me value last position par append hoti hai. Is operation me existing elements ko shift karne ki need nahi hoti.",
      steps: [
        `Value ${value} ko last index par add kiya gaya.`,
        "Array ke pehle ke elements unchanged rahe.",
        "New element ka index previous length ke equal hota hai.",
      ],
      finalArray: formatArray(nextArray),
      timeComplexity: "O(1)",
      examNote:
        "Static array model me end insertion constant-time maana jata hai, kyunki shifting nahi hoti.",
    });
  };

  const handleInsertIndex = () => {
    setActiveOperation("insert-index");
    const value = requireValue("insert-index");
    if (value === null) return;

    if (indexInput.trim() === "") {
      setValidationExplanation("insert-index", "Please enter an index first.");
      return;
    }

    const index = Number(indexInput);
    if (!Number.isInteger(index)) {
      setValidationExplanation("insert-index", "Please enter an index first.");
      return;
    }

    if (index < 0 || index > array.length) {
      setValidationExplanation("insert-index", "Invalid index for insertion.");
      return;
    }

    clearSearchHighlight();
    const nextArray = [...array.slice(0, index), value, ...array.slice(index)];
    setArray(nextArray);
    setExplanation({
      operation: "Insert at Index",
      concept:
        "Index-based insertion me pehle index validate hota hai, phir given index se last tak elements right shift hote hain aur new value selected index par place hoti hai.",
      steps: [
        `Index ${index} valid mila (0 se ${array.length} ke beech).`,
        `Index ${index} se end tak elements right shift hue.`,
        `Value ${value} ko exactly index ${index} par insert kiya gaya.`,
      ],
      finalArray: formatArray(nextArray),
      timeComplexity: "O(n)",
      examNote:
        "Middle insertion ka cost shift count par depend karta hai. Worst case me almost poora array shift hota hai.",
    });
  };

  const handleDeleteBeginning = () => {
    setActiveOperation("delete-beginning");
    if (array.length === 0) {
      setValidationExplanation("delete-beginning", "Array is already empty.");
      return;
    }

    clearSearchHighlight();
    const removedValue = array[0];
    const nextArray = array.slice(1);
    setArray(nextArray);
    setExplanation({
      operation: "Delete at Beginning",
      concept:
        "Beginning deletion me index 0 ka element remove hota hai. Baaki elements ko one position left shift karna padta hai aur indexes update hote hain.",
      steps: [
        `Index 0 ka element (${removedValue}) remove kiya gaya.`,
        "Remaining elements left shift hue: old index i, new index i-1.",
        "Array compact ban gaya aur indexes sequentially update hue.",
      ],
      finalArray: formatArray(nextArray),
      timeComplexity: "O(n)",
      examNote:
        "Deletion at beginning frequently costly hoti hai because shifting unavoidable hai.",
    });
  };

  const handleDeleteEnd = () => {
    setActiveOperation("delete-end");
    if (array.length === 0) {
      setValidationExplanation("delete-end", "Array is already empty.");
      return;
    }

    clearSearchHighlight();
    const removedValue = array[array.length - 1];
    const nextArray = array.slice(0, -1);
    setArray(nextArray);
    setExplanation({
      operation: "Delete at End",
      concept:
        "End deletion me sirf last element remove hota hai. Is process me shifting required nahi hoti.",
      steps: [
        `Last element (${removedValue}) remove kiya gaya.`,
        "Baaki elements ke indexes same rahe.",
        "Array size ek se kam ho gaya.",
      ],
      finalArray: formatArray(nextArray),
      timeComplexity: "O(1)",
      examNote:
        "End deletion generally efficient hoti hai kyunki movement cost zero hoti hai.",
    });
  };

  const handleDeleteIndex = () => {
    setActiveOperation("delete-index");
    if (array.length === 0) {
      setValidationExplanation("delete-index", "Array is already empty.");
      return;
    }

    if (indexInput.trim() === "") {
      setValidationExplanation("delete-index", "Please enter an index first.");
      return;
    }

    const index = Number(indexInput);
    if (!Number.isInteger(index)) {
      setValidationExplanation("delete-index", "Please enter an index first.");
      return;
    }

    if (index < 0 || index >= array.length) {
      setValidationExplanation("delete-index", "Invalid index for deletion.");
      return;
    }

    clearSearchHighlight();
    const removedValue = array[index];
    const nextArray = [...array.slice(0, index), ...array.slice(index + 1)];
    setArray(nextArray);
    setExplanation({
      operation: "Delete at Index",
      concept:
        "Selected index ka element remove hota hai. Uske baad wale elements left shift hote hain aur indexes dobara align hote hain.",
      steps: [
        `Index ${index} ka element (${removedValue}) delete hua.`,
        `Index ${index + 1} se end tak elements left shift hue.`,
        "Naye contiguous indexes recreate hue, gap remove ho gaya.",
      ],
      finalArray: formatArray(nextArray),
      timeComplexity: "O(n)",
      examNote:
        "Middle deletion ka impact insertion jaisa hi hota hai, because shifting is the dominant cost.",
    });
  };

  const handleSearch = () => {
    setActiveOperation("search");
    const value = requireValue("search");
    if (value === null) return;

    const foundIndex = array.findIndex((item) => item === value);
    if (foundIndex === -1) {
      setHighlightedIndex(null);
      setExplanation({
        operation: "Search Value",
        concept:
          "Linear search left to right chalti hai. Har element compare hota hai, aur match na mile toh not found result aata hai.",
        steps: [
          `Value ${value} ko index 0 se sequentially compare kiya gaya.`,
          "Kisi bhi position par exact match nahi mila.",
          "Operation terminate hua with not found outcome.",
        ],
        finalArray: formatArray(array),
        timeComplexity: "Best: O(1), Worst: O(n)",
        examNote:
          "Agar target first index par mile toh best case O(1). Agar last par ya missing ho toh traversal O(n) tak jata hai.",
      });
      return;
    }

    setHighlightedIndex(foundIndex);
    setExplanation({
      operation: "Search Value",
      concept:
        "Linear search me traversal left to right hota hai. Each element compare karke match milte hi index return hota hai.",
      steps: [
        `Value ${value} ko sequentially compare kiya gaya.`,
        `Match index ${foundIndex} par mila, isi liye traversal yahin stop hua.`,
        `Found index ${foundIndex} highlight kar diya gaya for clarity.`,
      ],
      finalArray: formatArray(array),
      timeComplexity: "Best: O(1), Worst: O(n)",
      examNote:
        "Linear search sorted aur unsorted dono arrays me use hoti hai, lekin worst case me full scan karna padta hai.",
    });
  };

  const handleReset = () => {
    setActiveOperation("reset");
    setArray(defaultArray);
    setValueInput("");
    setIndexInput("");
    setHighlightedIndex(null);
    setExplanation({
      operation: "Reset",
      concept:
        "Reset operation visualizer ko initial learning state me le aata hai, taki practice clean slate se restart ho sake.",
      steps: [
        "Array default values [10, 20, 30] par reset hua.",
        "Search highlight state clear ho gayi.",
        "Value aur index inputs dono clear kar diye gaye.",
      ],
      finalArray: formatArray(defaultArray),
      timeComplexity: "O(n)",
      examNote:
        "Reset demos me useful hota hai jab aapko same example baar-baar practice karna ho.",
    });
  };

  return (
    <main className="min-h-screen bg-[#F1E8C7] px-4 py-10 text-[#4B5320] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-[#7D8F3B] hover:text-[#4B5320]">
          &larr; Back to homepage
        </Link>

        <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)] sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#4B5320] sm:text-4xl">Arrays Visualizer</h1>
          <p className="mt-3 max-w-3xl text-[#9CA763]">
            Perform array operations interactively and watch how values shift across indexes in real time.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              type="text"
              value={valueInput}
              onChange={(event) => setValueInput(event.target.value)}
              placeholder="Enter value"
              className="w-full rounded-xl border border-[#D8CCA3] bg-[#F1E8C7] px-4 py-2.5 text-sm text-[#4B5320] outline-none ring-[#AAB76A] transition focus:ring"
            />
            <input
              type="number"
              value={indexInput}
              onChange={(event) => setIndexInput(event.target.value)}
              placeholder="Enter index"
              className="w-full rounded-xl border border-[#D8CCA3] bg-[#F1E8C7] px-4 py-2.5 text-sm text-[#4B5320] outline-none ring-[#AAB76A] transition focus:ring"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <button onClick={handleInsertBeginning} className="rounded-xl bg-[#7D8F3B] px-3 py-2 text-sm font-medium text-white hover:bg-[#4B5320]">
              Insert at Beginning
            </button>
            <button onClick={handleInsertEnd} className="rounded-xl bg-[#7D8F3B] px-3 py-2 text-sm font-medium text-white hover:bg-[#4B5320]">
              Insert at End
            </button>
            <button onClick={handleInsertIndex} className="rounded-xl bg-[#9CA763] px-3 py-2 text-sm font-medium text-white hover:bg-[#7D8F3B]">
              Insert at Index
            </button>
            <button onClick={handleDeleteBeginning} className="rounded-xl border border-[#D8CCA3] bg-[#F1E8C7] px-3 py-2 text-sm font-medium text-[#4B5320] hover:bg-[#F7F1DD]">
              Delete at Beginning
            </button>
            <button onClick={handleDeleteEnd} className="rounded-xl border border-[#D8CCA3] bg-[#F1E8C7] px-3 py-2 text-sm font-medium text-[#4B5320] hover:bg-[#F7F1DD]">
              Delete at End
            </button>
            <button onClick={handleDeleteIndex} className="rounded-xl border border-[#D8CCA3] bg-[#F1E8C7] px-3 py-2 text-sm font-medium text-[#4B5320] hover:bg-[#F7F1DD]">
              Delete at Index
            </button>
            <button onClick={handleSearch} className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#AAB76A] px-3 py-2 text-sm font-medium text-white hover:bg-[#9CA763]">
              <Search className="h-4 w-4" />
              Search Value
            </button>
            <button onClick={handleReset} className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#AAB76A] bg-[#F7F1DD] px-3 py-2 text-sm font-medium text-[#7D8F3B] hover:bg-[#F1E8C7]">
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#4B5320]">Array Visual Area</h2>
            <div className="rounded-full border border-[#AAB76A] bg-[#F1E8C7] px-3 py-1 text-xs font-medium text-[#7D8F3B]">
              Current length: {array.length}
            </div>
          </div>

          <div className="mt-4 min-h-28 rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] p-4">
            {array.length === 0 ? (
              <p className="text-sm text-[#9CA763]">Array is empty.</p>
            ) : (
              <motion.div layout className="flex flex-wrap items-end gap-3">
                <AnimatePresence>
                  {array.map((value, index) => {
                    const isHighlighted = highlightedIndex === index;
                    return (
                      <motion.div
                        key={`${value}-${index}`}
                        layout
                        initial={{ opacity: 0, y: 14, scale: 0.92 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          backgroundColor: isHighlighted ? "#AAB76A" : "#F7F1DD",
                          borderColor: isHighlighted ? "#7D8F3B" : "#D8CCA3",
                        }}
                        exit={{ opacity: 0, y: -12, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 340, damping: 26 }}
                        className="rounded-xl border px-4 py-3 text-center shadow-sm"
                      >
                        <p className="text-sm font-semibold text-[#4B5320]">{value}</p>
                        <p className="mt-1 text-xs text-[#9CA763]">index {index}</p>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-[#AAB76A] bg-[#F1E8C7] p-4">
            <p className="text-sm font-semibold text-[#7D8F3B]">Key Concept</p>
            <p className="mt-1 text-sm text-[#9CA763]">
              Arrays contiguous memory locations me store hote hain, aur indexing 0 se start hoti hai. Isliye insert/delete
              middle ya beginning me karte time shifting ka cost aata hai.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]">
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
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA763]">Final array</p>
                <p className="mt-1 font-mono text-[#4B5320]">{explanation.finalArray}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA763]">Time complexity</p>
                <span className="rounded-full border border-[#AAB76A] bg-[#F1E8C7] px-2.5 py-1 text-xs font-semibold text-[#7D8F3B]">
                  {explanation.timeComplexity}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA763]">Exam note</p>
                <p className="mt-1 leading-6 text-[#4B5320]">{explanation.examNote}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#D8CCA3] bg-[#4B5320] p-6 text-[#F7F1DD] shadow-[0_10px_30px_rgba(75,83,32,0.2)]">
            <h3 className="text-lg font-semibold text-[#AAB76A]">Pseudocode</h3>
            <div className="mt-3 space-y-1 font-mono text-sm leading-6 text-[#F7F1DD]/95">
              {pseudocode.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
