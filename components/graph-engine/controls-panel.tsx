import type React from "react";

import { GraphCard } from "./graph-card";

type GraphPanelProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

export function ControlsPanel({ title, subtitle, children, className = "" }: GraphPanelProps) {
  return (
    <GraphCard className={className}>
      <h3 className="text-lg font-semibold text-[#4B5320]">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-[#556B2F]">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </GraphCard>
  );
}
