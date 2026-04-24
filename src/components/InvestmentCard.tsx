import { Repeat } from "lucide-react";
import { getCatInfo } from "../utils/categories";
import { fmt, fmtDate } from "../utils/format";
import type { Transaction } from "../types";

type Props = {
  tx: Transaction;
  onTap: () => void;
};

export function InvestmentCard({ tx, onTap }: Props) {
  const cat = getCatInfo(tx.category);
  const CatIcon = cat.Icon;
  const showPaid = tx.paid;

  return (
    <button
      type="button"
      onClick={onTap}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left rounded-2xl active:opacity-90"
      style={{
        backgroundColor: "var(--app-card)",
        boxShadow: "var(--app-card-shadow)",
        transition: "opacity 0.1s ease",
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: "color-mix(in srgb, var(--app-accent) 14%, transparent)" }}
      >
        <CatIcon className="w-[22px] h-[22px]" strokeWidth={2} style={{ color: "var(--app-accent)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--app-text)" }}>
            {tx.description}
          </p>
          {tx.fixed ? (
            <Repeat
              className="w-3.5 h-3.5 shrink-0"
              strokeWidth={2}
              style={{ color: "var(--app-muted)" }}
              aria-label="Transação fixa"
            />
          ) : null}
          {showPaid ? (
            <span
              className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md shrink-0"
              style={{
                backgroundColor: "rgba(52,199,89,0.15)",
                color: "#34C759",
              }}
            >
              Aplicado
            </span>
          ) : (
            <span
              className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md shrink-0"
              style={{
                backgroundColor: "rgba(142,142,147,0.15)",
                color: "var(--app-muted)",
              }}
            >
              Pendente
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5" style={{ color: "var(--app-muted)" }}>
          {cat.label} · {fmtDate(tx.date)}
        </p>
      </div>
      <p className="text-sm font-bold shrink-0" style={{ color: "var(--app-accent)" }}>
        − {fmt(tx.amount)}
      </p>
    </button>
  );
}
