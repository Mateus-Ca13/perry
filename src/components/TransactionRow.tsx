import { useMemo } from "react";
import { Repeat } from "lucide-react";
import { useCards } from "../context/CardsContext";
import { ExpensePaymentGlyph } from "./ExpensePaymentGlyph";
import { getCatInfo } from "../utils/categories";
import { fmt, fmtListDay } from "../utils/format";
import type { Transaction } from "../types";

type Props = {
  tx: Transaction;
  isLast: boolean;
  onTap: () => void;
  /** Lista contínua na home: mostra o dia na linha de meta. */
  showDayOnMeta?: boolean;
};

export function TransactionRow({ tx, isLast, onTap, showDayOnMeta }: Props) {
  const { cards } = useCards();
  const cat = getCatInfo(tx.category);
  const isIncome = tx.type === "income";
  const isInvestment = tx.type === "investment";
  const CatIcon = cat.Icon;

  const iconColor = isIncome ? "#34C759" : isInvestment ? "var(--app-accent)" : "#FF3B30";
  const iconBg = isIncome
    ? "rgba(52,199,89,0.1)"
    : isInvestment
      ? "color-mix(in srgb, var(--app-accent) 14%, transparent)"
      : "rgba(255,59,48,0.1)";

  const dayMetaPrefix = useMemo(() => {
    if (!showDayOnMeta || (tx.type !== "income" && tx.type !== "expense")) return null;
    return fmtListDay(tx.date);
  }, [showDayOnMeta, tx.date, tx.type]);

  const showStatusBadge = tx.type === "expense" || tx.type === "investment";

  return (
    <button
      type="button"
      onClick={onTap}
      className={`w-full flex items-center gap-3 px-4 text-left active:bg-[var(--app-row-active)] ${showDayOnMeta ? "py-4" : "py-3"}`}
      style={{
        borderBottom: isLast ? "none" : "1px solid var(--app-border)",
        transition: "background-color 0.1s ease",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <CatIcon className="w-[22px] h-[22px]" strokeWidth={2} style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--app-text)" }}>
            {tx.description}
          </p>
          {tx.recurrenceRuleId || tx.fixed ? (
            <Repeat
              className="w-3.5 h-3.5 shrink-0"
              strokeWidth={2}
              style={{ color: "var(--app-muted)" }}
              aria-label="Transação fixa"
            />
          ) : null}
          {showStatusBadge ? (
            tx.paid ? (
              <span
                className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md shrink-0"
                style={{
                  backgroundColor: "rgba(52,199,89,0.15)",
                  color: "#34C759",
                }}
              >
                {isInvestment ? "Aplicado" : "Pago"}
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
            )
          ) : null}
        </div>
        <p
          className="text-xs flex items-center gap-2 flex-wrap min-w-0"
          style={{ color: "var(--app-muted)" }}
        >
          {showDayOnMeta && dayMetaPrefix ? (
            <>
              <span>{dayMetaPrefix}</span>
              <span aria-hidden="true">·</span>
            </>
          ) : null}
          {isInvestment ? (
            <span>
              Investimento · {cat.label}
            </span>
          ) : tx.type === "expense" ? (
            <>
              <span>{cat.label}</span>
              <span aria-hidden="true">·</span>
              <ExpensePaymentGlyph tx={tx} cards={cards} />
            </>
          ) : (
            <span>{cat.label}</span>
          )}
        </p>
      </div>
      <p
        className="text-sm font-bold shrink-0"
        style={{ color: isIncome ? "#34C759" : isInvestment ? "var(--app-accent)" : "#FF3B30" }}
      >
        {isIncome ? "+" : "−"} {fmt(tx.amount)}
      </p>
    </button>
  );
}
