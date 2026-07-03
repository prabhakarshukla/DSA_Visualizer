import { GraphCard } from "./graph-card";
import type { GraphLegendItem } from "./types";

type GraphLegendProps = {
  title: string;
  items: GraphLegendItem[];
  className?: string;
};

export function GraphLegend({ title, items, className = "" }: GraphLegendProps) {
  return (
    <GraphCard className={className}>
      <h3 className="text-lg font-semibold text-[#4B5320]">{title}</h3>
      <div className="mt-4 grid gap-3 text-sm text-[#556B2F]">
        {items.map((item) => {
          const indicatorBase = item.indicatorType === "line" ? "h-0.5 w-4" : item.indicatorType === "ring" ? "h-3 w-3 rounded-full ring-2" : "h-3 w-3 rounded-full";

          return (
            <div key={item.label} className="flex items-center gap-3">
              <span className={`${indicatorBase} ${item.indicatorClassName}`} />
              <div>
                <p>{item.label}</p>
                {item.description && <p className="text-xs text-[#7A8650]">{item.description}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </GraphCard>
  );
}
