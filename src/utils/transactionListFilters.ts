import type { Transaction } from "../types";

export type SortMode = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

export function matchesSearch(tx: Transaction, q: string): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  return tx.description.toLowerCase().includes(t);
}

export function matchesCategory(tx: Transaction, categoryId: string): boolean {
  if (categoryId === "all") return true;
  return tx.category === categoryId;
}

function cmpDateDesc(a: Transaction, b: Transaction): number {
  if (b.date !== a.date) return b.date > a.date ? 1 : -1;
  if (b.amount !== a.amount) return b.amount - a.amount;
  return a.id.localeCompare(b.id);
}

function cmpDateAsc(a: Transaction, b: Transaction): number {
  if (a.date !== b.date) return a.date > b.date ? 1 : -1;
  if (a.amount !== b.amount) return a.amount - b.amount;
  return a.id.localeCompare(b.id);
}

export function sortTransactions(txs: Transaction[], mode: SortMode): Transaction[] {
  const copy = [...txs];
  switch (mode) {
    case "date-desc":
      return copy.sort(cmpDateDesc);
    case "date-asc":
      return copy.sort(cmpDateAsc);
    case "amount-desc":
      return copy.sort((a, b) => {
        if (b.amount !== a.amount) return b.amount - a.amount;
        return cmpDateDesc(a, b);
      });
    case "amount-asc":
      return copy.sort((a, b) => {
        if (a.amount !== b.amount) return a.amount - b.amount;
        return cmpDateDesc(a, b);
      });
    default:
      return copy;
  }
}

export function isDateSort(mode: SortMode): boolean {
  return mode === "date-desc" || mode === "date-asc";
}

/** Agrupa por dia mantendo ordem dentro do dia conforme a ordem em `txs`. */
export function groupTransactionsByDate(
  txs: Transaction[],
  dateOrder: "asc" | "desc",
): [string, Transaction[]][] {
  const map: Record<string, Transaction[]> = {};
  for (const t of txs) {
    if (!map[t.date]) map[t.date] = [];
    map[t.date].push(t);
  }
  const entries = Object.entries(map) as [string, Transaction[]][];
  entries.sort(([a], [b]) => {
    if (dateOrder === "desc") return b.localeCompare(a);
    return a.localeCompare(b);
  });
  return entries;
}

export function matchesCardFilter(tx: Transaction, cardId: string | null): boolean {
  if (!cardId) return true;
  return tx.type === "expense" && tx.paymentMethod === "card" && tx.cardId === cardId;
}

export function applyListFilters(
  txs: Transaction[],
  opts: {
    search: string;
    categoryId: string;
    sortMode: SortMode;
    cardId?: string | null;
  },
): Transaction[] {
  const cardF = opts.cardId !== undefined ? opts.cardId : null;
  let out = txs.filter(
    (t) =>
      matchesSearch(t, opts.search) &&
      matchesCategory(t, opts.categoryId) &&
      matchesCardFilter(t, cardF),
  );
  out = sortTransactions(out, opts.sortMode);
  return out;
}
