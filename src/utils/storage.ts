import { STORAGE_KEY } from "../constants";
import type { Transaction, TxType } from "../types";

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
  return { id, type, description, amount, date, category, fixed, paid };
}

export function loadTransactions(): Transaction[] {
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

export function saveTransactions(txs: Transaction[]): void {
  try {
    const serializable = txs.map(({ _fromFixed: _, ...rest }) => rest);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch {
    /* quota ou modo privado */
  }
}
