import { fmt } from "../utils/format";
import type { MonthSummary } from "../types";

type Props = { summary: MonthSummary };

export function SummaryCard({ summary }: Props) {
  return (
    <div
      className="mx-5 p-5 rounded-2xl"
      style={{
        backgroundColor: "var(--app-card)",
        boxShadow: "var(--app-card-shadow)",
      }}
    >
      <p className="text-md font-medium mb-4" style={{ color: "var(--app-muted)" }}>
        Resumo do mês
      </p>

      <div className="text-center mb-5">
        <p
          className="text-md font-semibold uppercase tracking-wider mb-1"
          style={{ color: "var(--app-muted)" }}
        >
          Saldo disponível
        </p>
        <p
          className="font-bold tracking-tight"
          style={{
            fontSize: 36,
            lineHeight: 1.1,
            color: summary.balance >= 0 ? "#34C759" : "#FF3B30",
            transition: "color 0.3s ease",
          }}
        >
          {fmt(summary.balance)}
        </p>
      </div>

      <div className="flex gap-2 mb-2">
        <div
          className="flex-1 rounded-xl p-3 min-w-0"
          style={{ backgroundColor: "rgba(52,199,89,0.08)" }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#34C759" }} />
            <p className="text-sm font-medium truncate" style={{ color: "#34C759" }}>
              Receitas
            </p>
          </div>
          <p className="text-base font-bold" style={{ color: "var(--app-text)" }}>
            {fmt(summary.income)}
          </p>
        </div>
        <div
          className="flex-1 rounded-xl p-3 min-w-0"
          style={{ backgroundColor: "rgba(255,59,48,0.08)" }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#FF3B30" }} />
            <p className="text-sm font-medium truncate" style={{ color: "#FF3B30" }}>
              Despesas
            </p>
          </div>
          <p className="text-base font-bold" style={{ color: "var(--app-text)" }}>
            {fmt(summary.expense)}
          </p>
        </div>
      </div>

      <div
        className="rounded-xl p-3"
        style={{ backgroundColor: "rgba(0,122,255,0.08)" }}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#007AFF" }} />
          <p className="text-sm font-medium" style={{ color: "#007AFF" }}>
            Investido no mês
          </p>
        </div>
        <p className="text-base font-bold" style={{ color: "var(--app-text)" }}>
          {fmt(summary.investment)}
        </p>
      </div>
    </div>
  );
}
