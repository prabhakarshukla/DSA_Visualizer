import { GraphCard } from "./graph-card";
import type { GraphStatisticItem } from "./types";

type StatisticsCardsProps = {
  title: string;
  items: GraphStatisticItem[];
  className?: string;
};

const toneClasses: Record<NonNullable<GraphStatisticItem["tone"]>, string> = {
  default: "bg-[#F1E8C7] text-[#4B5320]",
  accent: "bg-gradient-to-r from-[#7D8F3B] to-[#556B2F] text-white",
  warning: "bg-gradient-to-r from-[#FED66A] to-[#AAB76A] text-white",
  success: "bg-gradient-to-r from-[#AAB76A] to-[#7D8F3B] text-white",
};

export function StatisticsCards({ title, items, className = "" }: StatisticsCardsProps) {
  return (
    <GraphCard className={className}>
      <h3 className="text-lg font-semibold text-[#4B5320]">{title}</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className={`rounded-2xl border border-[#D8CCA3] p-3 text-sm font-semibold ${toneClasses[item.tone ?? "default"]}`}>
            <p className="text-xs uppercase tracking-wide opacity-80">{item.label}</p>
            <div className="mt-2 font-mono text-lg">{item.value}</div>
          </div>
        ))}
      </div>
    </GraphCard>
  );
}
