import { useCallback, useMemo, useState } from "react";
import { AppHeader } from "../components/AppHeader";
import { CloseMonthModal } from "../components/CloseMonthModal";
import { HomeTransactionPreviews } from "../components/HomeTransactionPreviews";
import { InvestmentSection } from "../components/InvestmentSection";
import { MonthNav } from "../components/MonthNav";
import { SummaryCard } from "../components/SummaryCard";
import { useTransactions } from "../context/TransactionsContext";
import type { MonthCursor } from "../types";
import { todayISO } from "../utils/format";
import {
  computeSummary,
  listInvestmentsMonth,
  nowMonthCursor,
  partitionMonthForHome,
  selectMonthTransactions,
} from "../utils/monthComputation";
import { CalendarCheck } from "lucide-react";

export function HomePage() {
  const { transactions, openEdit, addTransaction } = useTransactions();
  const [currentMonth, setCurrentMonth] = useState<MonthCursor>(nowMonthCursor);
  const [showCloseMonth, setShowCloseMonth] = useState(false);

  const today = todayISO();

  const monthTransactions = useMemo(
    () => selectMonthTransactions(transactions, currentMonth),
    [transactions, currentMonth],
  );

  const { main } = useMemo(
    () => partitionMonthForHome(monthTransactions, today),
    [monthTransactions, today],
  );

  const investments = useMemo(
    () => listInvestmentsMonth(monthTransactions, today),
    [monthTransactions, today],
  );

  const summary = useMemo(
    () => computeSummary(monthTransactions, today),
    [monthTransactions, today],
  );

  const prevMonth = useCallback(() => {
    setCurrentMonth((p) => {
      if (p.month === 0) return { year: p.year - 1, month: 11 };
      return { ...p, month: p.month - 1 };
    });
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentMonth((p) => {
      if (p.month === 11) return { year: p.year + 1, month: 0 };
      return { ...p, month: p.month + 1 };
    });
  }, []);

  return (
    <div className="min-h-screen pb-36" style={{ backgroundColor: "var(--app-page)" }}>
      <AppHeader />
      <MonthNav currentMonth={currentMonth} onPrev={prevMonth} onNext={nextMonth} />
      <SummaryCard summary={summary} />

      <div className="px-5 mt-3">
        <button
          type="button"
          onClick={() => setShowCloseMonth(true)}
          className="w-full py-3 rounded-2xl text-md font-semibold active:scale-[0.99]"
          style={{
            backgroundColor: "var(--app-card)",
            color: "var(--app-accent)",
            boxShadow: "var(--app-card-shadow)",
            border: "1px solid color-mix(in srgb, var(--app-accent) 25%, transparent)",
          }}
        >
          <div className="flex items-center gap-2 justify-center">
          <CalendarCheck className="w-4 h-4" strokeWidth={2.5} style={{ color: "var(--app-accent)" }} />
          Concluir mês — Registrar sobra
          </div>
        </button>
      </div>


      <HomeTransactionPreviews
        mainTransactions={main}
        currentMonth={currentMonth}
        onEdit={openEdit}
      />

      {showCloseMonth ? (
        <CloseMonthModal
        viewedMonth={currentMonth}
        suggestedBalance={summary.balance}
        onSave={(tx) => {
          addTransaction(tx);
          setShowCloseMonth(false);
        }}
        onClose={() => setShowCloseMonth(false)}
        />
      ) : null}

      <InvestmentSection
        investments={investments}
        currentMonth={currentMonth}
        onEdit={openEdit}
      />
    </div>
  );
}
