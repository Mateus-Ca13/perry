import {
  RECURRING_MIGRATION_V1_KEY,
  RECURRING_RULES_KEY,
  STORAGE_KEY,
} from "../constants";
import type { RecurringRule, Transaction, TxType } from "../types";
import { todayISO } from "./format";
import {
  buildMissingOccurrences,
  migrateLegacyFixedToRules,
  normalizeRecurringRule,
  pruneInactiveRecurrenceTxs,
} from "./recurringMaterialize";

function normalizeTransaction(raw: unknown): Transaction | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : "";
  const typeRaw = o.type;
  const type: TxType | null =
    typeRaw === "income" || typeRaw === "expense" || typeRaw === "investment" ? typeRaw : null;
  const description = typeof o.description === "string" ? o.description : "";
  const amount = typeof o.amount === "number" && !Number.isNaN(o.amount) ? o.amount : NaN;
  const date = typeof o.date === "string" ? o.date : "";
  const category = typeof o.category === "string" ? o.category : "";
  const fixed = Boolean(o.fixed);
  let paid = true;
  if (type === "expense" || type === "investment") {
    paid = typeof o.paid === "boolean" ? o.paid : false;
  }
  if (!id || !type || !date || !Number.isFinite(amount)) return null;
  const rid = o.recurrenceRuleId;
  const recurrenceRuleId =
    typeof rid === "string" && rid.length > 0 ? rid : undefined;
  return { id, type, description, amount, date, category, fixed, paid, recurrenceRuleId };
}

export function loadTransactions(): Transaction[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null || raw === "") return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: Transaction[] = [];
    for (const item of parsed) {
      const tx = normalizeTransaction(item);
      if (tx) out.push(tx);
    }
    return out;
  } catch {
    return [];
  }
}

export function loadRecurringRules(): RecurringRule[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECURRING_RULES_KEY);
    if (raw == null || raw === "") return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: RecurringRule[] = [];
    for (const item of parsed) {
      const r = normalizeRecurringRule(item);
      if (r) out.push(r);
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Carga única: migra `fixed` legado, materializa a janela (6 meses) e grava.
 */
export function loadPersistedAppState(): { transactions: Transaction[]; rules: RecurringRule[] } {
  if (typeof localStorage === "undefined") {
    return { transactions: [], rules: [] };
  }
  const today = todayISO();
  let transactions = loadTransactions();
  let rules = loadRecurringRules();

  if (localStorage.getItem(RECURRING_MIGRATION_V1_KEY) !== "1") {
    const m = migrateLegacyFixedToRules(transactions, rules);
    transactions = m.transactions;
    rules = m.rules;
    localStorage.setItem(RECURRING_MIGRATION_V1_KEY, "1");
  }

  transactions = pruneInactiveRecurrenceTxs(rules, transactions, today);

  const more = buildMissingOccurrences(rules, transactions, today);
  if (more.length) {
    transactions = [...transactions, ...more];
  }
  saveTransactions(transactions);
  saveRecurringRules(rules);
  return { transactions, rules };
}

export function saveTransactions(txs: Transaction[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    const serializable = txs.map(({ _fromFixed: _, ...rest }) => rest);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch {
    /* quota ou modo privado */
  }
}

export function saveRecurringRules(rules: RecurringRule[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(RECURRING_RULES_KEY, JSON.stringify(rules));
  } catch {
    /* quota */
  }
}

/**
 * Apaga transações, regras de recorrência e flag de migração. Não altera o tema.
 */
export function clearAllAppDataStorage(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(RECURRING_RULES_KEY);
    localStorage.removeItem(RECURRING_MIGRATION_V1_KEY);
  } catch {
    /* privado, quota, etc. */
  }
}
