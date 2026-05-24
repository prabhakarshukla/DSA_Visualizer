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
  Active: "border-[#AAB76A] bg-[#F7F1DD] text-[#7D8F3B]",
  Ready: "border-[#AAB76A] bg-[#F7F1DD] text-[#7D8F3B]",
  Next: "border-[#D8CCA3] bg-[#F7F1DD] text-[#9CA763]",
  Planned: "border-[#D8CCA3] bg-[#F1E8C7] text-[#9CA763]",
};

export function VisualizerCard({ title, subtitle, href, status, icon, featured = false }: VisualizerTileProps) {
  return (
    <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} className="h-full">
      <Link
        href={href}
        className={`group flex h-full flex-col rounded-2xl border p-4 shadow-sm transition ${
          featured
            ? "border-[#AAB76A] bg-gradient-to-br from-[#F7F1DD] to-[#F1E8C7] shadow-[0_12px_30px_rgba(170,183,106,0.18)]"
            : "border-[#D8CCA3] bg-[#F7F1DD] hover:border-[#AAB76A] hover:shadow-md"
        }`}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <span className="rounded-xl bg-[#4B5320] p-2 text-[#F7F1DD]">{icon}</span>
          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeStyles[status]}`}>{status}</span>
        </div>

        <p className="text-base font-semibold text-[#4B5320]">{title}</p>
        <p className="mt-1 flex-1 text-sm text-[#9CA763]">{subtitle}</p>

        <p className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#7D8F3B] group-hover:text-[#4B5320]">
          Enter module
          <ArrowRight className="h-4 w-4" />
        </p>
      </Link>
    </motion.div>
  );
}
