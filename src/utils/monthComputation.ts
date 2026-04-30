import type { MonthCursor, MonthSummary, Transaction } from "../types";

/** Despesa ligada a cartão: campo explícito ou legado só com `cardId`. */
export function expenseUsesCard(t: Transaction): boolean {
  if (t.type !== "expense") return false;
  if (t.paymentMethod === "card") return true;
  return typeof t.cardId === "string" && t.cardId.length > 0;
}

export function nowMonthCursor(): MonthCursor {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function monthCursorToYm(c: MonthCursor): string {
  return `${c.year}-${String(c.month + 1).padStart(2, "0")}`;
}

/** Soma das despesas do mês lançadas neste cartão (fatura do mês visto), inclui linha de ajuste da fatura se existir. */
export function sumCardInvoiceInMonth(
  transactions: Transaction[],
  cardId: string,
  month: MonthCursor,
): number {
  const ym = monthCursorToYm(month);
  return transactions
    .filter(
      (t) =>
        expenseUsesCard(t) &&
        t.date.startsWith(ym) &&
        t.cardId === cardId,
    )
    .reduce((s, t) => s + t.amount, 0);
}

/** Igual a `sumCardInvoiceInMonth` mas sem a despesa automática de fecho da fatura declarada. */
export function sumCardInvoiceItemizedInMonth(
  transactions: Transaction[],
  cardId: string,
  month: MonthCursor,
): number {
  const ym = monthCursorToYm(month);
  return transactions
    .filter(
      (t) =>
        expenseUsesCard(t) &&
        !t.cardInvoiceAdjustment &&
        t.date.startsWith(ym) &&
        t.cardId === cardId,
    )
    .reduce((s, t) => s + t.amount, 0);
}

/**
 * Mês visto (YYYY-MM) estritamente antes do mês de hoje — ex. concluir abril só
 * depois de 1 de maio.
 */
export function isViewedMonthBeforeCurrentMonth(viewed: MonthCursor, todayIso: string): boolean {
  const viewedYm = `${viewed.year}-${String(viewed.month + 1).padStart(2, "0")}`;
  return viewedYm < todayIso.slice(0, 7);
}

export function selectMonthTransactions(
  transactions: Transaction[],
  currentMonth: MonthCursor,
): Transaction[] {
  const { year, month } = currentMonth;
  const pad = (n: number) => String(n).padStart(2, "0");
  const prefix = `${year}-${pad(month + 1)}`;

  const inMonth = transactions.filter((t) => t.date.startsWith(prefix));
  return inMonth.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
}

/**
 * O que entra no resumo do mês (saldo, receitas/despesas/invest. do card).
 * Ocorrências de série (recurrenceRuleId) valem no mês em que estão, mesmo com
 * data “no futuro” em relação a hoje — ex.: Navegando em abril com hoje ainda
 * em março, o salário de abril (materializado) entra; senão a linha some do total.
 * Receitas manuais futuras: seguem a regra t.date <= hoje.
 * Aportes (invest.): entram sempre no mês — o saldo desconta o comprometido, mesmo
 * antes de “Aplicado”; a tela de Investimentos e totais “aplicados” usam só `paid` à parte.
 * Despesas: qualquer lançamento já filtrado pelo mês visível entra no total (PIX/cartão, data futura ou não).
 * Série materializada cai no ramo com recurrenceRuleId.
 */
export function transactionCountsInSummary(t: Transaction, todayISO: string): boolean {
  if (t.recurrenceRuleId) {
    return true;
  }
  if (t.type === "income") return t.date <= todayISO;
  if (t.type === "investment") return true;
  if (t.type === "expense") return true;
  return false;
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

/**
 * Mantido por compatibilidade: a home não separa mais despesas “futuras”; tudo vai ao fluxo principal.
 */
export function isFutureExpense(_t: Transaction, _todayISO: string): boolean {
  return false;
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

/**
 * Aportes do mês na aba início: todos do mês selecionado (compromissos daquele mês,
 * incluindo recorrentes ainda a vencer). A rota /investmentists continua com histórico
 * `date <= hoje` em listAllInvestmentsSorted.
 */
export function listInvestmentsMonth(
  monthTxs: Transaction[],
  _todayISO: string,
  _viewedMonth: MonthCursor,
): Transaction[] {
  return monthTxs
    .filter((t) => t.type === "investment")
    .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
}

export function sliceThenGroupByDate(
  transactions: Transaction[],
  maxItems: number,
): [string, Transaction[]][] {
  const sorted = [...transactions].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  return groupByDate(sorted.slice(0, maxItems));
}

/** Últimos N lançamentos por data (mais recente primeiro), sem agrupar. */
export function sliceLatestTransactions(transactions: Transaction[], maxItems: number): Transaction[] {
  return [...transactions]
    .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0))
    .slice(0, maxItems);
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

/** Itens que aparecem em listas do mês: todas as despesas do mês; investimento futuro não quitado continua oculto. */
export function isVisibleInTimeline(t: Transaction, todayISO: string): boolean {
  if (t.type === "income") return true;
  if (t.type === "expense") return true;
  if (t.date <= todayISO) return true;
  return t.paid;
}

/** Lista para "todas as transações": receitas, despesas e investimentos do mês na timeline. */
export function transactionsForFullList(monthTxs: Transaction[], todayISO: string): Transaction[] {
  return monthTxs
    .filter((t) => isVisibleInTimeline(t, todayISO))
    .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
}

/**
 * Aportes para a listagem (histórico), mais recentes primeiro.
 * Exclui datas futuras (ex.: ocorrências materializadas longe) para a lista não poluir.
 */
export function listAllInvestmentsSorted(transactions: Transaction[], todayISO: string): Transaction[] {
  return transactions
    .filter((t) => t.type === "investment" && t.date <= todayISO)
    .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
}

/** Soma de todas as receitas (inclui datas futuras se houver). */
export function totalIncomeAllTime(transactions: Transaction[]): number {
  return transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
}

/** Receitas com data ≤ hoje — base para % e textos “renda que já entrou”. */
export function totalIncomeUpToToday(transactions: Transaction[], todayISO: string): number {
  return transactions
    .filter((t) => t.type === "income" && t.date <= todayISO)
    .reduce((s, t) => s + t.amount, 0);
}

/** Soma só de aportes com status “aplicado” (`paid`). */
export function totalInvestedApplied(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === "investment" && t.paid)
    .reduce((s, t) => s + t.amount, 0);
}

/** Meses distintos (YYYY-MM) com pelo menos um aporte aplicado. */
export function distinctInvestmentMonthCount(transactions: Transaction[]): number {
  const months = new Set<string>();
  for (const t of transactions) {
    if (t.type !== "investment" || !t.paid) continue;
    months.add(t.date.slice(0, 7));
  }
  return months.size;
}
