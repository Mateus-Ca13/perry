import { RECURRING_WINDOW_MONTHS } from "../constants";
import type { MonthCursor, PaymentMethod, RecurringRule, Transaction, TxType } from "../types";
import { uid } from "./id";

function monthCursorToYm(c: MonthCursor): string {
  return `${c.year}-${String(c.month + 1).padStart(2, "0")}`;
}

/**
 * Mês visto depois do último da janela (hoje + 5 meses); a recorrência ainda não
 * materializou; resumo e saldo não acompanham como nos meses cobertos.
 */
export function isMonthBeyondRecurringWindow(viewed: MonthCursor, todayIso: string): boolean {
  const viewedYm = monthCursorToYm(viewed);
  const todayYm = todayIso.slice(0, 7);
  const lastInWindow = addCalendarMonths(todayYm, RECURRING_WINDOW_MONTHS - 1);
  return viewedYm > lastInWindow;
}

export function addCalendarMonths(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Mês de hoje (YYYY-MM) e os (RECURRING_WINDOW_MONTHS - 1) seguintes. */
function monthWindowFromToday(todayIso: string): string[] {
  const ym = todayIso.slice(0, 7);
  const out: string[] = [];
  for (let i = 0; i < RECURRING_WINDOW_MONTHS; i++) {
    out.push(i === 0 ? ym : addCalendarMonths(ym, i));
  }
  return out;
}

function lastDayOfMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

/** Gera YYYY-MM-DD com dia limitado ao último do mês. */
export function isoDateInMonth(ym: string, dayOfMonth: number): string {
  const [y, m] = ym.split("-").map(Number);
  const cap = lastDayOfMonth(y, m - 1);
  const d = Math.min(Math.max(1, dayOfMonth), cap);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function monthGte(a: string, b: string): boolean {
  return a >= b;
}

/**
 * Remove ocorrências de regras inativas: após o mês final (`endAfterMonth`), ou, em
 * regras inativas legadas sem `endAfterMonth`, tudo com data &gt; hoje.
 */
export function pruneInactiveRecurrenceTxs(
  rules: RecurringRule[],
  transactions: Transaction[],
  todayIso: string,
): Transaction[] {
  return transactions.filter((t) => {
    if (!t.recurrenceRuleId) return true;
    const r = rules.find((x) => x.id === t.recurrenceRuleId);
    if (!r) return true;
    if (r.active) return true;
    if (r.endAfterMonth) {
      return t.date.slice(0, 7) <= r.endAfterMonth;
    }
    return t.date <= todayIso;
  });
}

/**
 * Cria ocorrências faltantes na janela, sem duplicar o que já existe (por regra e YYYY-MM).
 */
export function buildMissingOccurrences(
  rules: RecurringRule[],
  transactions: Transaction[],
  todayIso: string,
): Transaction[] {
  const window = monthWindowFromToday(todayIso);
  const out: Transaction[] = [];

  const hasOccurrence = (ruleId: string, ym: string) =>
    transactions.some(
      (t) => t.recurrenceRuleId === ruleId && t.date.slice(0, 7) === ym,
    );
  const hasInBatch = (ruleId: string, ym: string) =>
    out.some((t) => t.recurrenceRuleId === ruleId && t.date.slice(0, 7) === ym);

  for (const rule of rules) {
    if (!rule.active) continue;
    for (const ym of window) {
      if (!monthGte(ym, rule.startMonth)) continue;
      if (rule.excludedMonths.includes(ym)) continue;
      if (hasOccurrence(rule.id, ym) || hasInBatch(rule.id, ym)) continue;

      out.push({
        id: uid(),
        type: rule.type,
        description: rule.description,
        amount: rule.defaultAmount,
        date: isoDateInMonth(ym, rule.dayOfMonth),
        category: rule.category,
        fixed: false,
        paid: rule.type === "income" ? true : rule.defaultPaid,
        recurrenceRuleId: rule.id,
        ...(rule.type === "expense"
          ? expensePaymentFieldsFromRule(rule)
          : {}),
      });
    }
  }
  return out;
}

export function dayOfMonthFromIso(iso: string): number {
  const d = Number(iso.split("-")[2]);
  return Number.isFinite(d) && d > 0 ? d : 1;
}

function expensePaymentFieldsFromRule(
  rule: RecurringRule,
): Pick<Transaction, "paymentMethod" | "cardId"> {
  const pm = rule.defaultPaymentMethod ?? "pix";
  if (pm === "pix") return { paymentMethod: "pix" };
  if (rule.defaultCardId) return { paymentMethod: "card", cardId: rule.defaultCardId };
  return { paymentMethod: "pix" };
}

/** Cria regra a partir de um lançamento novo (ainda sem id no form). */
export function newRecurringRuleFromForm(
  p: {
    type: Transaction["type"];
    date: string;
    description: string;
    category: string;
    amount: number;
    paid: boolean;
    paymentMethod?: PaymentMethod;
    cardId?: string;
  },
  ruleId: string,
): RecurringRule {
  const rule: RecurringRule = {
    id: ruleId,
    type: p.type,
    dayOfMonth: dayOfMonthFromIso(p.date),
    startMonth: p.date.slice(0, 7),
    description: p.description,
    category: p.category,
    defaultAmount: p.amount,
    defaultPaid: p.type === "income" ? true : p.paid,
    active: true,
    excludedMonths: [],
  };
  if (p.type === "expense") {
    const pm = p.paymentMethod === "card" ? "card" : "pix";
    rule.defaultPaymentMethod = pm;
    if (pm === "card" && p.cardId) rule.defaultCardId = p.cardId;
  }
  return rule;
}

export function createRecurringRuleFromTransaction(t: Transaction, ruleId: string): RecurringRule {
  const rule: RecurringRule = {
    id: ruleId,
    type: t.type,
    dayOfMonth: dayOfMonthFromIso(t.date),
    startMonth: t.date.slice(0, 7),
    description: t.description,
    category: t.category,
    defaultAmount: t.amount,
    defaultPaid: t.type === "income" ? true : t.paid,
    active: true,
    excludedMonths: [],
  };
  if (t.type === "expense") {
    const pm = t.paymentMethod === "card" ? "card" : "pix";
    rule.defaultPaymentMethod = pm;
    if (pm === "card" && t.cardId) rule.defaultCardId = t.cardId;
  }
  return rule;
}

/**
 * Uma vez: leva `fixed: true` legado a `RecurringRule` + `recurrenceRuleId` no lançamento.
 * Não gera ocorrências (isso fica a cargo de `buildMissingOccurrences` no app).
 */
export function migrateLegacyFixedToRules(
  transactions: Transaction[],
  existingRules: RecurringRule[],
): { transactions: Transaction[]; rules: RecurringRule[] } {
  const toAdd: RecurringRule[] = [];
  const updated = transactions.map((t) => {
    if (!t.fixed || t.recurrenceRuleId) return t;
    const ruleId = uid();
    toAdd.push(createRecurringRuleFromTransaction(t, ruleId));
    return { ...t, fixed: false, recurrenceRuleId: ruleId };
  });
  return { transactions: updated, rules: [...existingRules, ...toAdd] };
}

export function normalizeRecurringRule(raw: unknown): RecurringRule | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : "";
  const typeRaw = o.type;
  const type: TxType | null =
    typeRaw === "income" || typeRaw === "expense" || typeRaw === "investment" ? typeRaw : null;
  const day = typeof o.dayOfMonth === "number" && o.dayOfMonth >= 1 && o.dayOfMonth <= 31 ? o.dayOfMonth : NaN;
  const startMonth = typeof o.startMonth === "string" && /^\d{4}-\d{2}$/.test(o.startMonth) ? o.startMonth : "";
  const description = typeof o.description === "string" ? o.description : "";
  const category = typeof o.category === "string" ? o.category : "";
  const defaultAmount = typeof o.defaultAmount === "number" && !Number.isNaN(o.defaultAmount) ? o.defaultAmount : NaN;
  const defaultPaid = Boolean(o.defaultPaid);
  const active = o.active !== false;
  const ex = o.excludedMonths;
  const excludedMonths: string[] = Array.isArray(ex)
    ? (ex as unknown[]).filter(
        (x): x is string => typeof x === "string" && /^\d{4}-\d{2}$/.test(x),
      )
    : [];
  const eam = o.endAfterMonth;
  const endAfterMonth =
    typeof eam === "string" && /^\d{4}-\d{2}$/.test(eam) ? eam : undefined;
  if (!id || !type || !Number.isFinite(defaultAmount) || !Number.isFinite(day)) return null;
  if (!startMonth) return null;
  const rule: RecurringRule = {
    id,
    type,
    dayOfMonth: day,
    startMonth,
    description,
    category,
    defaultAmount,
    defaultPaid,
    active,
    endAfterMonth,
    excludedMonths,
  };
  if (type === "expense") {
    const pm = o.defaultPaymentMethod;
    if (pm === "pix" || pm === "card") {
      rule.defaultPaymentMethod = pm;
      if (pm === "card") {
        const dc = o.defaultCardId;
        if (typeof dc === "string" && dc.length > 0) rule.defaultCardId = dc;
      }
    }
  }
  return rule;
}
