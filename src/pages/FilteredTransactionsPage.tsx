import { useCallback, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { EXPENSE_CATS, INCOME_CATS } from "../constants";
import { FlatTransactionList } from "../components/FlatTransactionList";
import { SubPageLayout } from "../components/SubPageLayout";
import { TransactionGroupedList } from "../components/TransactionGroupedList";
import { TransactionListToolbar } from "../components/TransactionListToolbar";
import { useTransactions } from "../context/TransactionsContext";
import type { MonthCursor, TxType } from "../types";
import { todayISO } from "../utils/format";
import {
  selectMonthTransactions,
  transactionsForFullList,
} from "../utils/monthComputation";
import {
  applyListFilters,
  groupTransactionsByDate,
  isDateSort,
  type SortMode,
} from "../utils/transactionListFilters";

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
  const { transactions, openEdit } = useTransactions();
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

  const today = todayISO();

  const monthTransactions = useMemo(
    () => selectMonthTransactions(transactions, currentMonth),
    [transactions, currentMonth],
  );

  const forList = useMemo(() => {
    const set = new Set(types);
    return transactionsForFullList(monthTransactions, today).filter((t) => set.has(t.type));
  }, [monthTransactions, today, types]);

  const filtered = useMemo(
    () => applyListFilters(forList, { search, categoryId: categoryFilter, sortMode }),
    [forList, search, categoryFilter, sortMode],
  );

  const grouped = useMemo(() => {
    if (!isDateSort(sortMode)) return [];
    return groupTransactionsByDate(filtered, sortMode === "date-desc" ? "desc" : "asc");
  }, [filtered, sortMode]);

  const emptyText =
    forList.length === 0 ? empty : "Nenhum lançamento combina com a busca ou a categoria.";

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
      <TransactionListToolbar
        categories={categories}
        categoryFilter={categoryFilter}
        onCategoryFilter={setCategoryFilter}
        sortMode={sortMode}
        onSortMode={setSortMode}
        search={search}
        onSearch={setSearch}
      />

      {isDateSort(sortMode) ? (
        <TransactionGroupedList grouped={grouped} onEdit={openEdit} emptyText={emptyText} />
      ) : filtered.length === 0 ? (
        <TransactionGroupedList grouped={[]} onEdit={openEdit} emptyText={emptyText} />
      ) : (
        <FlatTransactionList transactions={filtered} onEdit={openEdit} />
      )}
    </SubPageLayout>
  );
}
