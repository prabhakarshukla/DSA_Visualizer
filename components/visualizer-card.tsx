"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

export type ModuleStatus = "Active" | "Ready" | "Next" | "Planned";

type VisualizerTileProps = {
  title: string;
  subtitle: string;
  href: string;
  status: ModuleStatus;
  icon: ReactNode;
  featured?: boolean;
};

const badgeStyles: Record<ModuleStatus, string> = {
  Active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Ready: "border-cyan-200 bg-cyan-50 text-cyan-700",
  Next: "border-blue-200 bg-blue-50 text-blue-700",
  Planned: "border-slate-200 bg-slate-100 text-slate-600",
};

export function VisualizerCard({ title, subtitle, href, status, icon, featured = false }: VisualizerTileProps) {
  return (
    <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
      <Link
        href={href}
        className={`group block rounded-2xl border p-4 shadow-sm transition ${
          featured
            ? "border-cyan-300 bg-gradient-to-br from-cyan-50 to-white shadow-[0_12px_30px_rgba(8,145,178,0.18)]"
            : "border-slate-200 bg-white hover:border-cyan-200 hover:shadow-md"
        }`}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <span className="rounded-xl bg-slate-900 p-2 text-cyan-300">{icon}</span>
          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeStyles[status]}`}>{status}</span>
        </div>

        <p className="text-base font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>

        <p className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-700 group-hover:text-blue-800">
          Enter module
          <ArrowRight className="h-4 w-4" />
        </p>
      </Link>
    </motion.div>
  );
}
