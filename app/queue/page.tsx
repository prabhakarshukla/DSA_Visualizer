"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CircleDot, Layers3, ListOrdered } from "lucide-react";
import type { ReactNode } from "react";

type QueueOption = {
  title: string;
  description: string;
  href: string;
  status: "Ready" | "Coming Soon";
  icon: ReactNode;
  preview: string;
};

const queueOptions: QueueOption[] = [
  {
    title: "Linear Queue",
    description: "Basic FIFO queue where enqueue happens at REAR and dequeue at FRONT.",
    href: "/queue/linear",
    status: "Ready",
    icon: <ArrowRight className="h-4 w-4" />,
    preview: "FRONT -> 10 20 30 <- REAR",
  },
  {
    title: "Circular Queue",
    description: "Uses wrap-around indexing to reuse empty space efficiently.",
    href: "/queue/circular",
    status: "Coming Soon",
    icon: <CircleDot className="h-4 w-4" />,
    preview: "10 -> 20 -> 30 -> back to 10",
  },
  {
    title: "Double Ended Queue",
    description: "A queue where insertion and deletion are possible from both FRONT and REAR.",
    href: "/queue/deque",
    status: "Coming Soon",
    icon: <Layers3 className="h-4 w-4" />,
    preview: "Front <-> [ 10 20 30 ] <-> Rear",
  },
  {
    title: "Priority Queue",
    description: "Elements are served by priority; highest priority processed first.",
    href: "/queue/priority",
    status: "Coming Soon",
    icon: <ListOrdered className="h-4 w-4" />,
    preview: "P1(40) -> P2(20) -> P3(10)",
  },
];

export default function QueueOverviewPage() {
  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-800">
          &larr; Back to homepage
        </Link>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Queue Visualizer</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Queues follow FIFO (First In First Out), where elements leave in the same order they entered.
            Choose a queue type below to start learning.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {queueOptions.map((option, index) => (
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
                      : "border-blue-200 bg-blue-50 text-blue-700"
                  }`}
                >
                  {option.status}
                </span>
              </div>

              <h2 className="text-lg font-semibold text-slate-900">{option.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{option.description}</p>

              <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-3 font-mono text-sm text-slate-700">
                {option.preview}
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
