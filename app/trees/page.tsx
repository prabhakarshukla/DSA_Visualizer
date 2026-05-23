"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Binary, GitBranch, Scale, TreePine } from "lucide-react";
import type { ReactNode } from "react";

type TreeOption = {
  title: string;
  description: string;
  href: string;
  status: "Ready" | "Planned";
  icon: ReactNode;
  preview: string[];
};

const treeOptions: TreeOption[] = [
  {
    title: "Binary Tree",
    description: "Understand parent-child structure where each node has at most two children.",
    href: "/trees/binary",
    status: "Ready",
    icon: <Binary className="h-4 w-4" />,
    preview: ["   10", "  /  \\", " 5   20"],
  },
  {
    title: "Binary Search Tree",
    description: "Learn ordered insertion/search with rule: left < root < right.",
    href: "/trees/bst",
    status: "Planned",
    icon: <TreePine className="h-4 w-4" />,
    preview: ["left < root < right"],
  },
  {
    title: "AVL Tree",
    description: "See self-balancing rotations that keep height difference controlled.",
    href: "/trees/avl",
    status: "Planned",
    icon: <Scale className="h-4 w-4" />,
    preview: ["   20", "  /  \\", "10   30", "(balanced)"],
  },
  {
    title: "Heap Tree",
    description: "Explore complete binary tree structure used for priority processing.",
    href: "/trees/heap",
    status: "Planned",
    icon: <GitBranch className="h-4 w-4" />,
    preview: ["   50", "  /  \\", "30   40", "(complete tree)"],
  },
];

export default function TreesOverviewPage() {
  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-800">
          &larr; Back to homepage
        </Link>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Trees Visualizer</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Trees hierarchical data structure hote hain jaha nodes parent-child relation me arranged hote hain.
            Niche se apna tree type choose karke visuals ke saath concepts samjho.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {treeOptions.map((option, index) => (
            <motion.article
              key={option.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              whileHover={{ y: -5 }}
              className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-[0_10px_25px_rgba(15,23,42,0.08)]"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-xl bg-slate-900 p-2 text-cyan-300">{option.icon}</span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                    option.status === "Ready"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-100 text-slate-600"
                  }`}
                >
                  {option.status}
                </span>
              </div>

              <h2 className="text-lg font-semibold text-slate-900">{option.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{option.description}</p>

              <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-3 font-mono text-sm leading-5 text-slate-700">
                {option.preview.map((line) => (
                  <p key={`${option.title}-${line}`}>{line}</p>
                ))}
              </div>

              <Link
                href={option.href}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-700 transition hover:text-blue-800"
              >
                Open Visualizer
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.article>
          ))}
        </section>
      </div>
    </main>
  );
}
