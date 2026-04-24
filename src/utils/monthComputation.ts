import type { MonthCursor, MonthSummary, Transaction } from "../types";

export function nowMonthCursor(): MonthCursor {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function selectMonthTransactions(
  transactions: Transaction[],
  currentMonth: MonthCursor,
): Transaction[] {
  const { year, month } = currentMonth;
  const pad = (n: number) => String(n).padStart(2, "0");
  const prefix = `${year}-${pad(month + 1)}`;

  const direct = transactions.filter((t) => t.date.startsWith(prefix));
  const directIds = new Set(direct.map((t) => t.id));

  const fixed = transactions.filter((t) => {
    if (!t.fixed || directIds.has(t.id)) return false;
    const [ty, tm] = t.date.split("-").map(Number);
    const txMonth = ty * 12 + (tm - 1);
    const curMonth = year * 12 + month;
    return txMonth <= curMonth;
  });

  const fixedMapped = fixed.map((t) => {
    const day = t.date.split("-")[2];
    return { ...t, date: `${year}-${pad(month + 1)}-${day}`, _fromFixed: true };
  });

  return [...direct, ...fixedMapped].sort((a, b) =>
    b.date > a.date ? 1 : b.date < a.date ? -1 : 0,
  );
}

/** Receitas entram sempre; despesas/investimentos futuros só entram se já quitados/alocados. */
export function transactionCountsInSummary(t: Transaction, todayISO: string): boolean {
  if (t.type === "income") return true;
  if (t.date <= todayISO) return true;
  return t.paid;
}

export function computeSummary(monthTransactions: Transaction[], todayISO: string): MonthSummary {
  let income = 0;
  let expense = 0;
  let investment = 0;
  for (const t of monthTransactions) {
    if (!transactionCountsInSummary(t, todayISO)) continue;
    if (t.type === "income") income += t.amount;
    else if (t.type === "investment") investment += t.amount;
    else expense += t.amount;
  }
  return { income, expense, investment, balance: income - expense - investment };
}

export function groupByDate(
  monthTransactions: Transaction[],
): [string, Transaction[]][] {
  const map: Record<string, Transaction[]> = {};
  for (const t of monthTransactions) {
    if (!map[t.date]) map[t.date] = [];
    map[t.date].push(t);
  }
  return Object.entries(map).sort(([a], [b]) => (b > a ? 1 : b < a ? -1 : 0));
}

/** Despesas com data posterior a hoje (no fuso local). */
export function isFutureExpense(t: Transaction, todayISO: string): boolean {
  return t.type === "expense" && t.date > todayISO;
}

export function partitionMonthForHome(
  monthTxs: Transaction[],
  todayISO: string,
): { main: Transaction[]; futureExpenses: Transaction[] } {
  const main: Transaction[] = [];
  const future: Transaction[] = [];
  for (const t of monthTxs) {
    if (t.type === "investment") continue;
    if (isFutureExpense(t, todayISO)) future.push(t);
    else main.push(t);
  }
  const byDateDesc = (a: Transaction, b: Transaction) =>
    b.date > a.date ? 1 : b.date < a.date ? -1 : 0;
  main.sort(byDateDesc);
  future.sort(byDateDesc);
  return { main, futureExpenses: future };
}

/** Aportes do mês na timeline (exclui investimento futuro não quitado), mais recentes primeiro. */
export function listInvestmentsMonth(monthTxs: Transaction[], todayISO: string): Transaction[] {
  return monthTxs
    .filter((t) => t.type === "investment" && isVisibleInTimeline(t, todayISO))
    .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
}

export function sliceThenGroupByDate(
  transactions: Transaction[],
  maxItems: number,
): [string, Transaction[]][] {
  const sorted = [...transactions].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  return groupByDate(sorted.slice(0, maxItems));
}

export function prevMonthCursor(c: MonthCursor): MonthCursor {
  if (c.month === 0) return { year: c.year - 1, month: 11 };
  return { year: c.year, month: c.month - 1 };
}

export function nextMonthCursor(c: MonthCursor): MonthCursor {
  if (c.month === 11) return { year: c.year + 1, month: 0 };
  return { year: c.year, month: c.month + 1 };
}

export function firstDayOfMonthISO(c: MonthCursor): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${c.year}-${pad(c.month + 1)}-01`;
}

/** Itens que aparecem em listas cronológicas (exclui despesa/investimento futuros não quitados). */
export function isVisibleInTimeline(t: Transaction, todayISO: string): boolean {
  if (t.type === "income") return true;
  if (t.date <= todayISO) return true;
  return t.paid;
}

/** Lista para "todas as transações": receitas, despesas e investimentos do mês na timeline. */
export function transactionsForFullList(monthTxs: Transaction[], todayISO: string): Transaction[] {
  return monthTxs
    .filter((t) => isVisibleInTimeline(t, todayISO))
    .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
}

/** Todos os lançamentos de investimento (armazenados), mais recentes primeiro. */
export function listAllInvestmentsSorted(transactions: Transaction[]): Transaction[] {
  return transactions
    .filter((t) => t.type === "investment")
    .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
}

export function totalIncomeAllTime(transactions: Transaction[]): number {
  return transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
}

/** Soma de aportes já aplicados / visíveis na linha do tempo (exclui futuro não quitado). */
export function totalInvestedApplied(transactions: Transaction[], todayISO: string): number {
  return transactions
    .filter((t) => t.type === "investment" && isVisibleInTimeline(t, todayISO))
    .reduce((s, t) => s + t.amount, 0);
}

/** Quantidade de meses distintos (YYYY-MM) com pelo menos um aporte registrado. */
export function distinctInvestmentMonthCount(transactions: Transaction[]): number {
  const months = new Set<string>();
  for (const t of transactions) {
    if (t.type !== "investment") continue;
    months.add(t.date.slice(0, 7));
  }
  return months.size;
}
