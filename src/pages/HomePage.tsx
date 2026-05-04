import { useCallback, useEffect, useMemo, useState } from "react";
import { AppHeader } from "../components/AppHeader";
import { CloseMonthModal } from "../components/CloseMonthModal";
import { RecurringHorizonNotice } from "../components/RecurringHorizonNotice";
import { HomeTransactionPreviews } from "../components/HomeTransactionPreviews";
import { InvestmentSection } from "../components/InvestmentSection";
import { MonthNav } from "../components/MonthNav";
import { SummaryCard } from "../components/SummaryCard";
import { HomeCardsCarousel } from "../components/HomeCardsCarousel";
import { useCards } from "../context/CardsContext";
import { useTransactions } from "../context/TransactionsContext";
import type { MonthCursor } from "../types";
import { todayISO } from "../utils/format";
import {
  computeSummary,
  isViewedMonthBeforeCurrentMonth,
  listInvestmentsMonth,
  monthCursorToYm,
  nowMonthCursor,
  partitionMonthForHome,
  selectMonthTransactions,
} from "../utils/monthComputation";
import { appendClosedMonth, loadClosedMonths } from "../utils/storage";
import { isMonthBeyondRecurringWindow } from "../utils/recurringMaterialize";
import { CalendarCheck } from "lucide-react";

export function HomePage() {
  const { transactions, openEdit, addTransaction, declaredCardInvoices, openNewExpenseWithPayment } =
    useTransactions();
  const { cards } = useCards();
  const [currentMonth, setCurrentMonth] = useState<MonthCursor>(nowMonthCursor);
  const [showCloseMonth, setShowCloseMonth] = useState(false);
  const [closedMonths, setClosedMonths] = useState<string[]>(loadClosedMonths);

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
    () => listInvestmentsMonth(monthTransactions, today, currentMonth),
    [monthTransactions, today, currentMonth],
  );

  const summary = useMemo(
    () => computeSummary(monthTransactions, today),
    [monthTransactions, today],
  );

  const beyondHorizon = useMemo(
    () => isMonthBeyondRecurringWindow(currentMonth, today),
    [currentMonth, today],
  );

  const showConcludeMonth = useMemo(
    () => isViewedMonthBeforeCurrentMonth(currentMonth, today),
    [currentMonth, today],
  );

  const viewedYm = useMemo(() => monthCursorToYm(currentMonth), [currentMonth]);
  const monthAlreadyConcluded = useMemo(
    () => closedMonths.includes(viewedYm),
    [closedMonths, viewedYm],
  );

  useEffect(() => {
    if (!showConcludeMonth) setShowCloseMonth(false);
  }, [showConcludeMonth]);

  useEffect(() => {
    if (monthAlreadyConcluded) setShowCloseMonth(false);
  }, [monthAlreadyConcluded]);

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
      {beyondHorizon ? (
        <div className="px-5 mt-3">
          <RecurringHorizonNotice />
        </div>
      ) : (
        <>
          <SummaryCard summary={summary} />

          {showConcludeMonth ? (
            <div className="px-5 mt-3">
              {monthAlreadyConcluded ? (
                <div
                  className="w-full py-3 rounded-2xl text-sm font-medium text-center"
                  style={{
                    backgroundColor: "var(--app-card)",
                    color: "var(--app-muted)",
                    boxShadow: "var(--app-card-shadow)",
                    border: "1px solid color-mix(in srgb, var(--app-text) 8%, transparent)",
                  }}
                >
                  Mês já concluído — a sobra deste mês já foi registrada
                </div>
              ) : (
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
                    <CalendarCheck
                      className="w-4 h-4"
                      strokeWidth={2.5}
                      style={{ color: "var(--app-accent)" }}
                    />
                    Concluir mês — Registrar sobra
                  </div>
                </button>
              )}
            </div>
          ) : null}

          <HomeCardsCarousel
            cards={cards}
            transactions={transactions}
            currentMonth={currentMonth}
            declaredCardInvoices={declaredCardInvoices}
            onOpenExpenseForCard={(cardId) =>
              openNewExpenseWithPayment({ paymentMethod: "card", cardId })
            }
          />

          <HomeTransactionPreviews
            mainTransactions={main}
            currentMonth={currentMonth}
            onEdit={openEdit}
          />

          {showCloseMonth && !monthAlreadyConcluded ? (
            <CloseMonthModal
              viewedMonth={currentMonth}
              suggestedBalance={summary.balance}
              onSave={(tx) => {
                addTransaction(tx);
                appendClosedMonth(viewedYm);
                setClosedMonths((prev) =>
                  prev.includes(viewedYm) ? prev : [...prev, viewedYm],
                );
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
        </>
      )}
    </div>
  );
}
