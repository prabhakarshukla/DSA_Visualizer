import type React from "react";

import { GraphCard } from "./graph-card";

type GraphPanelProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

export function AlgorithmPanel({ title, subtitle, children, className = "" }: GraphPanelProps) {
  return (
    <GraphCard className={className}>
      <p className="text-xs uppercase tracking-[0.24em] text-[#7A8650]">{subtitle ?? "Live Algorithm Panel"}</p>
      <h3 className="mt-2 text-lg font-semibold text-[#4B5320]">{title}</h3>
      <div className="mt-4">{children}</div>
    </GraphCard>
  );
}
