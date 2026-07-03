import type React from "react";

type GraphCardProps = {
  children: React.ReactNode;
  className?: string;
};

const baseClassName = "rounded-3xl border border-[#D8CCA3] bg-[#F7F1DD]/90 p-6 shadow-[0_10px_30px_rgba(75,83,32,0.08)]";

export function GraphCard({ children, className = "" }: GraphCardProps) {
  return <div className={`${baseClassName} ${className}`.trim()}>{children}</div>;
}
