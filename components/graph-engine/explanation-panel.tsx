import type React from "react";

import { GraphCard } from "./graph-card";

type ExplanationPanelProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function ExplanationPanel({ title, children, className = "" }: ExplanationPanelProps) {
  return (
    <GraphCard className={className}>
      <h3 className="text-lg font-semibold text-[#4B5320]">{title}</h3>
      <div className="mt-4">{children}</div>
    </GraphCard>
  );
}
