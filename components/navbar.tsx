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
      className="sticky top-0 z-30 border-b border-[#D8CCA3] bg-[#F1E8C7]/90 backdrop-blur"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="rounded-xl bg-[#4B5320] p-2 text-[#F7F1DD] shadow-sm">
            <Binary className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight text-[#4B5320]">DSA Visualizer Lite</p>
            <p className="text-xs text-[#556B2F]">Interactive DSA Playground</p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 rounded-full border border-[#AAB76A] bg-[#F7F1DD] px-3 py-1.5 text-xs font-medium text-[#556B2F] sm:inline-flex">
          <Waypoints className="h-3.5 w-3.5" />
          Visual thinking first
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      </div>
    </motion.header>
  );
}
