import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { bankPresetById } from "../data/cardBanks";
import { EXPENSE_CATS, INCOME_CATS } from "../constants";
import { FlatTransactionList } from "../components/FlatTransactionList";
import { RecurringHorizonNotice } from "../components/RecurringHorizonNotice";
import { SubPageLayout } from "../components/SubPageLayout";
import { TransactionListToolbar } from "../components/TransactionListToolbar";
import { useCards } from "../context/CardsContext";
import { useTransactions } from "../context/TransactionsContext";
import type { MonthCursor, TxType } from "../types";
import { todayISO } from "../utils/format";
import {
  selectMonthTransactions,
  transactionsForFullList,
} from "../utils/monthComputation";
import {
  applyListFilters,
  EXPENSE_PAYMENT_PIX_TOKEN,
  type SortMode,
} from "../utils/transactionListFilters";
import { isMonthBeyondRecurringWindow } from "../utils/recurringMaterialize";

const CONFIG: Record<
  "income" | "expense",
  { title: string; types: TxType[]; empty: string }
> = {
  income: {
    title: "Receitas",
    types: ["income"],
    empty: "Nenhuma receita neste mês",
  },
  expense: {
    title: "Despesas",
    types: ["expense"],
    empty: "Nenhuma despesa neste mês",
  },
};

type Props = { mode: "income" | "expense" };

export function FilteredTransactionsPage({ mode }: Props) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { transactions, openEdit } = useTransactions();
  const { cards } = useCards();
  const { title, types, empty } = CONFIG[mode];
  const categories = mode === "income" ? INCOME_CATS : EXPENSE_CATS;

  const [currentMonth, setCurrentMonth] = useState<MonthCursor>(() => {
    const s = location.state as { month?: MonthCursor } | null;
    const d = new Date();
    return s?.month ?? { year: d.getFullYear(), month: d.getMonth() };
  });

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("date-desc");
  const [expensePaymentFilter, setExpensePaymentFilter] = useState<"all" | "pix" | string>("all");

  const filterCardId = mode === "expense" ? searchParams.get("cartao") : null;
  const filterCard =
    filterCardId != null && filterCardId !== "" ? cards.find((c) => c.id === filterCardId) : null;

  const today = todayISO();

  const clearCardFilter = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("cartao");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (mode !== "expense") return;
    const cid = searchParams.get("cartao");
    if (cid) setExpensePaymentFilter(cid);
    else setExpensePaymentFilter((prev) => (prev === "pix" ? "pix" : "all"));
  }, [mode, filterCardId]);

  const expensePaymentToolbarCards = useMemo(() => {
    if (mode !== "expense") return undefined;
    return cards.map((c) => ({
      id: c.id,
      label: c.label || bankPresetById(c.bankId)?.label || "Cartão",
    }));
  }, [mode, cards]);

  const paymentSelectValue =
    filterCardId != null && filterCardId !== "" ? filterCardId : expensePaymentFilter;

  const handleExpensePaymentChange = useCallback(
    (v: string) => {
      const next = new URLSearchParams(searchParams);
      if (v === "all") {
        next.delete("cartao");
        setExpensePaymentFilter("all");
      } else if (v === "pix") {
        next.delete("cartao");
        setExpensePaymentFilter("pix");
      } else {
        next.set("cartao", v);
        setExpensePaymentFilter(v);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const resolvedExpensePayment = useMemo(() => {
    if (mode !== "expense") return undefined;
    if (filterCardId != null && filterCardId !== "") return filterCardId;
    if (expensePaymentFilter === "pix") return EXPENSE_PAYMENT_PIX_TOKEN;
    if (expensePaymentFilter === "all") return null;
    return expensePaymentFilter;
  }, [mode, filterCardId, expensePaymentFilter]);

  const beyondHorizon = useMemo(
    () => isMonthBeyondRecurringWindow(currentMonth, today),
    [currentMonth, today],
  );

  const monthTransactions = useMemo(
    () => selectMonthTransactions(transactions, currentMonth),
    [transactions, currentMonth],
  );

  const forList = useMemo(() => {
    const set = new Set(types);
    return transactionsForFullList(monthTransactions, today).filter((t) => set.has(t.type));
  }, [monthTransactions, today, types]);

  const filtered = useMemo(
    () =>
      applyListFilters(forList, {
        search,
        categoryId: categoryFilter,
        sortMode,
        expensePayment: resolvedExpensePayment ?? undefined,
      }),
    [forList, search, categoryFilter, sortMode, resolvedExpensePayment],
  );

  const emptyText =
    forList.length === 0
      ? empty
      : "Nenhum lançamento combina com a busca, categoria ou pagamento.";

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
    <SubPageLayout
      title={title}
      currentMonth={currentMonth}
      onPrevMonth={prevMonth}
      onNextMonth={nextMonth}
    >
      {beyondHorizon ? (
        <RecurringHorizonNotice />
      ) : (
        <>
          {filterCardId && mode === "expense" ? (
            <div
              className="flex items-center justify-between gap-2 mb-3 px-1 py-2 rounded-xl"
              style={{
                backgroundColor: "var(--app-dock-active)",
                border: "1px solid color-mix(in srgb, var(--app-accent) 20%, transparent)",
              }}
            >
              <p className="text-sm font-medium min-w-0 truncate" style={{ color: "var(--app-text)" }}>
                Fatura:{" "}
                <strong>
                  {filterCard
                    ? filterCard.label || bankPresetById(filterCard.bankId)?.label || "Cartão"
                    : "Cartão"}
                </strong>
              </p>
              <button
                type="button"
                onClick={clearCardFilter}
                className="shrink-0 text-sm font-semibold px-2 py-1 rounded-lg active:opacity-70"
                style={{ color: "var(--app-accent)" }}
              >
                Limpar
              </button>
            </div>
          ) : null}
          <TransactionListToolbar
            categories={categories}
            categoryFilter={categoryFilter}
            onCategoryFilter={setCategoryFilter}
            sortMode={sortMode}
            onSortMode={setSortMode}
            search={search}
            onSearch={setSearch}
            expensePaymentCards={expensePaymentToolbarCards}
            expensePaymentValue={mode === "expense" ? paymentSelectValue : undefined}
            onExpensePaymentFilter={mode === "expense" ? handleExpensePaymentChange : undefined}
          />

          <FlatTransactionList
            transactions={filtered}
            onEdit={openEdit}
            showDayOnMeta
            emptyText={emptyText}
          />
        </>
      )}
    </SubPageLayout>
  );
}
