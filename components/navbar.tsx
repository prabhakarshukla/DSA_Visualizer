"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Binary, Sparkles, Waypoints } from "lucide-react";

export function Navbar() {
  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="sticky top-0 z-30 border-b border-slate-200/70 bg-[#f7fafc]/90 backdrop-blur"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="rounded-xl bg-slate-900 p-2 text-cyan-300 shadow-sm">
            <Binary className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight text-slate-900">DSA Visualizer Lite</p>
            <p className="text-xs text-slate-600">Interactive DSA Playground</p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-800 sm:inline-flex">
          <Waypoints className="h-3.5 w-3.5" />
          Visual thinking first
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      </div>
    </motion.header>
  );
}
