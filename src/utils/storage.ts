import {
  CARD_DECLARED_INVOICES_KEY,
  CLOSED_MONTHS_KEY,
  PAYMENT_CARDS_KEY,
  RECURRING_MIGRATION_V1_KEY,
  RECURRING_RULES_KEY,
  STORAGE_KEY,
} from "../constants";
import type {
  CardBankId,
  CardDeclaredInvoiceEntry,
  CardDeclaredInvoicesMap,
  PaymentCard,
  PaymentMethod,
  RecurringRule,
  Transaction,
  TxType,
} from "../types";
import { todayISO } from "./format";
import {
  buildMissingOccurrences,
  migrateLegacyFixedToRules,
  normalizeRecurringRule,
  pruneInactiveRecurrenceTxs,
} from "./recurringMaterialize";

export function normalizeTransaction(raw: unknown): Transaction | null {
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
  let paymentMethod: PaymentMethod | undefined;
  const pm = o.paymentMethod;
  if (pm === "pix" || pm === "card") {
    paymentMethod = pm;
  }
  const cid = o.cardId;
  const cardId = typeof cid === "string" && cid.length > 0 ? cid : undefined;
  const tx: Transaction = {
    id,
    type,
    description,
    amount,
    date,
    category,
    fixed,
    paid,
    recurrenceRuleId,
  };
  if (type === "expense") {
    if (cardId && !paymentMethod) {
      paymentMethod = "card";
    }
    if (paymentMethod) tx.paymentMethod = paymentMethod;
    if (cardId) tx.cardId = cardId;
    if (o.cardInvoiceAdjustment === true) tx.cardInvoiceAdjustment = true;
  }
  return tx;
}

const YM_RE_STORAGE = /^\d{4}-\d{2}$/;

export function normalizeCardDeclaredInvoices(raw: unknown): CardDeclaredInvoicesMap {
  if (!raw || typeof raw !== "object") return {};
  const out: CardDeclaredInvoicesMap = {};
  for (const [cardId, innerRaw] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof cardId !== "string" || cardId === "" || !innerRaw || typeof innerRaw !== "object") continue;
    const inner: Record<string, CardDeclaredInvoiceEntry> = {};
    for (const [ym, entryRaw] of Object.entries(innerRaw as Record<string, unknown>)) {
      if (!YM_RE_STORAGE.test(ym) || !entryRaw || typeof entryRaw !== "object") continue;
      const er = entryRaw as Record<string, unknown>;
      const total = typeof er.total === "number" && Number.isFinite(er.total) ? er.total : NaN;
      const cardLabelForDescription =
        typeof er.cardLabelForDescription === "string" ? er.cardLabelForDescription.trim() : "";
      if (!Number.isFinite(total) || total < 0 || !cardLabelForDescription) continue;
      inner[ym] = { total, cardLabelForDescription };
    }
    if (Object.keys(inner).length > 0) out[cardId] = inner;
  }
  return out;
}

export function loadCardDeclaredInvoices(): CardDeclaredInvoicesMap {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(CARD_DECLARED_INVOICES_KEY);
    if (raw == null || raw === "") return {};
    const parsed = JSON.parse(raw) as unknown;
    return normalizeCardDeclaredInvoices(parsed);
  } catch {
    return {};
  }
}

export function saveCardDeclaredInvoices(map: CardDeclaredInvoicesMap): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(CARD_DECLARED_INVOICES_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
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
    localStorage.removeItem(CLOSED_MONTHS_KEY);
    localStorage.removeItem(PAYMENT_CARDS_KEY);
    localStorage.removeItem(CARD_DECLARED_INVOICES_KEY);
  } catch {
    /* privado, quota, etc. */
  }
}

const CARD_BANK_IDS = new Set<CardBankId>(["nubank", "mercado_pago", "picpay"]);

function normalizePaymentCard(raw: unknown): PaymentCard | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : "";
  const bankRaw = o.bankId;
  const bankId = CARD_BANK_IDS.has(bankRaw as CardBankId) ? (bankRaw as CardBankId) : null;
  const label = typeof o.label === "string" ? o.label.trim() : "";
  if (!id || !bankId) return null;
  return { id, bankId, label };
}

export function loadPaymentCards(): PaymentCard[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(PAYMENT_CARDS_KEY);
    if (raw == null || raw === "") return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: PaymentCard[] = [];
    for (const item of parsed) {
      const c = normalizePaymentCard(item);
      if (c) out.push(c);
    }
    return out;
  } catch {
    return [];
  }
}

export function savePaymentCards(cards: PaymentCard[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PAYMENT_CARDS_KEY, JSON.stringify(cards));
  } catch {
    /* quota */
  }
}

const YM_RE = /^\d{4}-\d{2}$/;

/** Lista de YYYY-MM já “concluídos” (registo da sobra no mês seguinte). */
export function loadClosedMonths(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(CLOSED_MONTHS_KEY);
    if (raw == null || raw === "") return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string" && YM_RE.test(x));
  } catch {
    return [];
  }
}

export function appendClosedMonth(ym: string): void {
  if (typeof localStorage === "undefined" || !YM_RE.test(ym)) return;
  try {
    const list = loadClosedMonths();
    if (list.includes(ym)) return;
    localStorage.setItem(CLOSED_MONTHS_KEY, JSON.stringify([...list, ym]));
  } catch {
    /* quota */
  }
}

/** Substitui a lista de meses concluídos (ex.: restauração de backup). */
export function saveClosedMonthsList(months: string[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    const valid = months.filter((m) => YM_RE.test(m));
    localStorage.setItem(CLOSED_MONTHS_KEY, JSON.stringify([...new Set(valid)].sort()));
  } catch {
    /* quota */
  }
}
