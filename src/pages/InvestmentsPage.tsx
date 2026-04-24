import { useMemo, useState } from "react";
import { INVESTMENT_CATS } from "../constants";
import { InvestmentCard } from "../components/InvestmentCard";
import { SubPageLayout } from "../components/SubPageLayout";
import { TransactionListToolbar } from "../components/TransactionListToolbar";
import { useTransactions } from "../context/TransactionsContext";
import { fmt, todayISO } from "../utils/format";
import {
  distinctInvestmentMonthCount,
  listAllInvestmentsSorted,
  totalIncomeAllTime,
  totalInvestedApplied,
} from "../utils/monthComputation";
import { applyListFilters, type SortMode } from "../utils/transactionListFilters";

export function InvestmentsPage() {
  const { transactions, openEdit } = useTransactions();
  const today = todayISO();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("date-desc");

  const allInvestments = useMemo(
    () => listAllInvestmentsSorted(transactions),
    [transactions],
  );

  const filtered = useMemo(
    () => applyListFilters(allInvestments, { search, categoryId: categoryFilter, sortMode }),
    [allInvestments, search, categoryFilter, sortMode],
  );

  const totalIncome = useMemo(() => totalIncomeAllTime(transactions), [transactions]);

  const investedApplied = useMemo(
    () => totalInvestedApplied(transactions, today),
    [transactions, today],
  );

  const pctOfIncome = totalIncome > 0 ? (investedApplied / totalIncome) * 100 : null;

  const monthSpan = useMemo(
    () => distinctInvestmentMonthCount(transactions),
    [transactions],
  );

  const filterEmptyMessage =
    allInvestments.length > 0 && filtered.length === 0
      ? "Nenhum aporte combina com a busca ou a categoria."
      : null;

  return (
    <SubPageLayout title="Investimentos">
      <div
        className="rounded-2xl p-5 mb-6"
        style={{
          backgroundColor: "var(--app-card)",
          boxShadow: "var(--app-card-shadow)",
        }}
      >
        <p
          className="text-[11px] font-semibold tracking-widest uppercase mb-1"
          style={{ color: "var(--app-muted)" }}
        >
          Total investido
        </p>
        <p className="text-3xl font-bold tracking-tight" style={{ color: "var(--app-text)" }}>
          {fmt(investedApplied)}
        </p>
        {monthSpan > 0 ? (
          <p className="text-xs mt-2" style={{ color: "var(--app-muted)" }}>
            Registrado ao longo de{" "}
            <strong style={{ color: "var(--app-text)" }}>
              {monthSpan} {monthSpan === 1 ? "mês" : "meses"}
            </strong>{" "}
            com aportes
          </p>
        ) : null}
        {pctOfIncome != null ? (
          <p className="text-sm mt-3 leading-snug" style={{ color: "var(--app-muted)" }}>
            Representa{" "}
            <strong style={{ color: "var(--app-accent)" }}>
              {pctOfIncome.toLocaleString("pt-BR", {
                maximumFractionDigits: 1,
                minimumFractionDigits: 0,
              })}
              %
            </strong>{" "}
            da renda que entrou no app (todas as receitas registradas).
          </p>
        ) : (
          <p className="text-sm mt-3 leading-snug" style={{ color: "var(--app-muted)" }}>
            Cadastre receitas na home para ver o percentual em relação à sua renda.
          </p>
        )}
        {totalIncome > 0 ? (
          <p
            className="text-xs mt-3 pt-3 border-t border-solid"
            style={{ color: "var(--app-muted)", borderColor: "var(--app-border)" }}
          >
            Renda total registrada: <span style={{ color: "#34C759" }}>{fmt(totalIncome)}</span>
          </p>
        ) : null}
      </div>

      <TransactionListToolbar
        categories={INVESTMENT_CATS}
        categoryFilter={categoryFilter}
        onCategoryFilter={setCategoryFilter}
        sortMode={sortMode}
        onSortMode={setSortMode}
        search={search}
        onSearch={setSearch}
      />

      <div className="flex items-baseline justify-between mb-3 px-0.5">
        <h2 className="text-sm font-semibold" style={{ color: "var(--app-muted)" }}>
          Aportes
        </h2>
        <span className="text-xs font-medium" style={{ color: "var(--app-muted)" }}>
          {allInvestments.length === 0
            ? "0 entradas"
            : filtered.length === allInvestments.length
              ? `${filtered.length} ${filtered.length === 1 ? "entrada" : "entradas"}`
              : `${filtered.length} de ${allInvestments.length} aportes`}
        </span>
      </div>

      {allInvestments.length === 0 ? (
        <div
          className="text-center py-14 rounded-2xl"
          style={{
            backgroundColor: "var(--app-card)",
            boxShadow: "var(--app-card-shadow)",
          }}
        >
          <p className="text-sm font-medium px-6" style={{ color: "var(--app-muted)" }}>
            Nenhum investimento ainda. Use o botão + para registrar um aporte.
          </p>
        </div>
      ) : filterEmptyMessage ? (
        <div
          className="text-center py-12 rounded-2xl"
          style={{
            backgroundColor: "var(--app-card)",
            boxShadow: "var(--app-card-shadow)",
          }}
        >
          <p className="text-sm font-medium px-6" style={{ color: "var(--app-muted)" }}>
            {filterEmptyMessage}
          </p>
        </div>
      ) : (
        <ul className="space-y-3 list-none p-0 m-0">
          {filtered.map((tx) => (
            <li key={tx.id}>
              <InvestmentCard tx={tx} onTap={() => openEdit(tx)} />
            </li>
          ))}
        </ul>
      )}
    </SubPageLayout>
  );
}
