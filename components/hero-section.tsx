"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const arrayValues = [10, 20, 30, 40];
const linkedValues = [10, 20, 30];
const operationLogs = ["create array", "insert(20)", "traverse nodes", "compare values"];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pt-12 pb-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(#AAB76A_1px,transparent_1px)] [background-size:18px_18px] opacity-20" />
      <div className="absolute -top-20 right-0 -z-10 h-64 w-64 rounded-full bg-[#AAB76A]/20 blur-3xl" />

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl font-bold leading-tight tracking-tight text-[#4B5320] sm:text-5xl"
          >
            Learn DSA by watching it move.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-xl text-base leading-7 text-[#9CA763] sm:text-lg"
          >
            Visualize data structure operations step-by-step, observe how values shift over time, and build strong intuition for exams and interviews.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap items-center gap-3"
          >
            <Link
              href="/arrays"
              className="inline-flex items-center gap-2 rounded-xl bg-[#7D8F3B] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#4B5320]"
            >
              Start with Arrays
              <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="inline-flex items-center gap-2 rounded-xl border border-[#AAB76A] bg-[#F7F1DD] px-4 py-2 text-sm font-medium text-[#7D8F3B]">
              <CheckCircle2 className="h-4 w-4" />
              Built for exams + interviews
            </span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.45 }}
          className="rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-5 shadow-[0_10px_30px_rgba(75,83,32,0.08)]"
        >
          <p className="mb-3 text-sm font-semibold text-[#4B5320]">Visualizer Preview</p>

          <div className="rounded-2xl bg-[#F1E8C7] p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9CA763]">Array</p>
            <div className="flex flex-wrap items-center gap-2">
              {arrayValues.map((value, index) => (
                <motion.div
                  key={value}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.08 }}
                  className="rounded-lg border border-[#D8CCA3] bg-[#F7F1DD] px-3 py-2 text-sm font-semibold text-[#4B5320]"
                >
                  [{value}]
                </motion.div>
              ))}
            </div>

            <p className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-[#9CA763]">Linked List</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {linkedValues.map((value, index) => (
                <motion.div key={value} className="flex items-center gap-2">
                  <motion.div
                    animate={{ y: [0, -2, 0] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, delay: index * 0.2 }}
                    className="rounded-xl border border-[#AAB76A] bg-[#F7F1DD] px-4 py-1.5 text-sm font-semibold text-[#4B5320]"
                  >
                    {value}
                  </motion.div>
                  {index < linkedValues.length - 1 && (
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4], x: [0, 2, 0] }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.6 }}
                      className="text-lg font-bold text-[#7D8F3B]"
                    >
                      -&gt;
                    </motion.span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#D8CCA3] bg-[#F1E8C7] p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9CA763]">Operation Log</p>
            <ul className="space-y-1.5 text-sm text-[#4B5320]">
              {operationLogs.map((line, index) => (
                <motion.li
                  key={line}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.28 + index * 0.08 }}
                  className="font-mono"
                >
                  {line}
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
