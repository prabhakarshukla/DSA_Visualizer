"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, GitBranch, Share2, Zap, Network, Route, CheckCircle2, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

type GraphOption = {
  title: string;
  description: string;
  href: string;
  status: "Ready" | "Planned";
  icon: ReactNode;
  preview: string[];
};

const graphOptions: GraphOption[] = [
  {
    title: "Graph Traversal",
    description: "Explore BFS and DFS algorithms to traverse graphs systematically.",
    href: "/graphs/traversal",
    status: "Ready",
    icon: <Route className="h-4 w-4" />,
    preview: ["1 → 2 → 3", "4 → 5 → 6", "(BFS/DFS order)"],
  },
  {
    title: "Topological Sorting",
    description: "Order vertices in a DAG based on dependency relationships.",
    href: "/graphs/topological-sort",
    status: "Planned",
    icon: <TrendingUp className="h-4 w-4" />,
    preview: ["Task ordering", "Dependency graph", "(linear order)"],
  },
  {
    title: "Cycle Detection",
    description: "Identify cycles in directed and undirected graphs.",
    href: "/graphs/cycle-detection",
    status: "Planned",
    icon: <Share2 className="h-4 w-4" />,
    preview: ["A → B → C", "C → A (cycle!)", "(detect loops)"],
  },
  {
    title: "Minimum Spanning Tree",
    description: "Find minimum cost tree connecting all vertices.",
    href: "/graphs/mst",
    status: "Planned",
    icon: <GitBranch className="h-4 w-4" />,
    preview: ["Weighted edges", "Connected tree", "(minimum cost)"],
  },
  {
    title: "Prim's Algorithm",
    description: "Build MST by growing tree from a starting vertex.",
    href: "/graphs/prims",
    status: "Ready",
    icon: <CheckCircle2 className="h-4 w-4" />,
    preview: ["Greedy approach", "Add min edge", "(O(V²) or O(E log V))"],
  },
  {
    title: "Kruskal's Algorithm",
    description: "Build MST by sorting edges and adding with union-find.",
    href: "/graphs/kruskal",
    status: "Planned",
    icon: <Zap className="h-4 w-4" />,
    preview: ["Sort edges first", "Union-find check", "(O(E log E))"],
  },
  {
    title: "Dijkstra's Algorithm",
    description: "Find shortest paths from source to all vertices.",
    href: "/graphs/dijkstra",
    status: "Ready",
    icon: <TrendingUp className="h-4 w-4" />,
    preview: ["Shortest paths", "Non-negative weights", "(O(E log V))"],
  },
  {
    title: "Bellman-Ford Algorithm",
    description: "Compute shortest paths handling negative edge weights.",
    href: "/graphs/bellman-ford",
    status: "Planned",
    icon: <Network className="h-4 w-4" />,
    preview: ["Negative weights OK", "Detect neg cycles", "(O(VE))"],
  },
  {
    title: "Floyd-Warshall Algorithm",
    description: "Find shortest paths between all pairs of vertices.",
    href: "/graphs/floyd-warshall",
    status: "Planned",
    icon: <Share2 className="h-4 w-4" />,
    preview: ["All-pairs shortest", "Dynamic programming", "(O(V³))"],
  },
];

export default function GraphsOverviewPage() {
  return (
    <main className="min-h-screen bg-[#F1E8C7] px-4 py-10 text-[#4B5320] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-[#556B2F] hover:text-[#4B5320]">
          &larr; Back to homepage
        </Link>

        <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#4B5320] sm:text-4xl">Graphs Visualizer</h1>
          <p className="mt-3 max-w-3xl text-[#556B2F]">
            Visualize graph traversal, shortest paths, spanning trees, and graph algorithms interactively.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {graphOptions.map((option, index) => (
            <motion.article
              key={option.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              whileHover={{ y: -5 }}
              className="flex flex-col rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-5 shadow-[0_10px_25px_rgba(15,23,42,0.08)]"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-xl bg-[#4B5320] p-2 text-[#AAB76A]">{option.icon}</span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                    option.status === "Ready"
                      ? "border-[#AAB76A] bg-[#F7F1DD] text-[#556B2F]"
                      : "border-[#D8CCA3] bg-[#F1E8C7] text-[#556B2F]"
                  }`}
                >
                  {option.status}
                </span>
              </div>

              <h2 className="text-lg font-semibold text-[#4B5320]">{option.title}</h2>
              <p className="mt-1 flex-1 text-sm text-[#556B2F]">{option.description}</p>

              <div className="mt-4 rounded-2xl border border-[#D8CCA3] bg-[#F7F1DD]/60 p-3 font-mono text-sm leading-5 text-[#4B5320]">
                {option.preview.map((line) => (
                  <p key={`${option.title}-${line}`}>{line}</p>
                ))}
              </div>

              <Link
                href={option.href}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#556B2F] transition hover:text-[#4B5320]"
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
