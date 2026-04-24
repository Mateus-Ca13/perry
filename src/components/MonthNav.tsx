import { ChevronLeft, ChevronRight } from "lucide-react";
import { MONTHS_PT } from "../constants";
import type { MonthCursor } from "../types";

type Props = {
  currentMonth: MonthCursor;
  onPrev: () => void;
  onNext: () => void;
};

export function MonthNav({ currentMonth, onPrev, onNext }: Props) {
  const monthLabel = `${MONTHS_PT[currentMonth.month]} ${currentMonth.year}`;

  return (
    <div className="flex items-center justify-between px-5 py-3">
      <button
        type="button"
        onClick={onPrev}
        className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
        style={{
          backgroundColor: "color-mix(in srgb, var(--app-accent) 12%, transparent)",
          transition: "transform 0.15s cubic-bezier(0.4,0,0.2,1)",
        }}
        aria-label="Mês anterior"
      >
        <ChevronLeft className="w-5 h-5" strokeWidth={2.5} style={{ color: "var(--app-accent)" }} />
      </button>
      <h2 className="text-lg font-semibold" style={{ color: "var(--app-text)" }}>
        {monthLabel}
      </h2>
      <button
        type="button"
        onClick={onNext}
        className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
        style={{
          backgroundColor: "color-mix(in srgb, var(--app-accent) 12%, transparent)",
          transition: "transform 0.15s cubic-bezier(0.4,0,0.2,1)",
        }}
        aria-label="Próximo mês"
      >
        <ChevronRight className="w-5 h-5" strokeWidth={2.5} style={{ color: "var(--app-accent)" }} />
      </button>
    </div>
  );
}
