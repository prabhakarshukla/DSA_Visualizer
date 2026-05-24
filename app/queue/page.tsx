"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CircleDot, Layers3, ListOrdered } from "lucide-react";
import type { ReactNode } from "react";

type QueueOption = {
  title: string;
  description: string;
  href: string;
  status: "Ready";
  icon: ReactNode;
  preview: string;
};

const queueOptions: QueueOption[] = [
  {
    title: "Linear Queue",
    description: "FIFO Basics - Basic FIFO queue where enqueue happens at REAR and dequeue at FRONT.",
    href: "/queue/linear",
    status: "Ready",
    icon: <ArrowRight className="h-4 w-4" />,
    preview: "FRONT -> 10 20 30 <- REAR",
  },
  {
    title: "Circular Queue",
    description: "Efficient Memory Usage - Uses wrap-around indexing to reuse empty space efficiently.",
    href: "/queue/circular",
    status: "Ready",
    icon: <CircleDot className="h-4 w-4" />,
    preview: "10 -> 20 -> 30 -> back to 10",
  },
  {
    title: "Double Ended Queue",
    description: "Operations at Both Ends - Insertion and deletion are possible from both FRONT and REAR.",
    href: "/queue/deque",
    status: "Ready",
    icon: <Layers3 className="h-4 w-4" />,
    preview: "Front <-> [ 10 20 30 ] <-> Rear",
  },
  {
    title: "Priority Queue",
    description: "Priority-Based Processing - Elements are served by priority; highest priority processed first.",
    href: "/queue/priority",
    status: "Ready",
    icon: <ListOrdered className="h-4 w-4" />,
    preview: "P1(40) -> P2(20) -> P3(10)",
  },
];

export default function QueueOverviewPage() {
  return (
    <main className="min-h-screen bg-[#F1E8C7] px-4 py-10 text-[#4B5320] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-[#556B2F] hover:text-[#4B5320]">
          &larr; Back to homepage
        </Link>

        <section className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#4B5320] sm:text-4xl">Queue Visualizer</h1>
          <p className="mt-3 max-w-3xl text-[#556B2F]">
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
              className="flex flex-col rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-5 shadow-[0_10px_25px_rgba(15,23,42,0.08)]"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-xl bg-[#4B5320] p-2 text-[#AAB76A]">{option.icon}</span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                    "border-[#AAB76A] bg-[#F7F1DD] text-[#556B2F]"
                  }`}
                >
                  {option.status}
                </span>
              </div>

              <h2 className="text-lg font-semibold text-[#4B5320]">{option.title}</h2>
              <p className="mt-1 flex-1 text-sm text-[#556B2F]">{option.description}</p>

              <div className="mt-4 rounded-2xl border border-[#D8CCA3] bg-[#F7F1DD]/60 p-3 font-mono text-sm text-[#4B5320]">
                {option.preview}
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
