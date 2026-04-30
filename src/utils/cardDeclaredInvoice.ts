import type { CardDeclaredInvoicesMap, MonthCursor, Transaction } from "../types";
import { uid } from "./id";
import { sumCardInvoiceItemizedInMonth } from "./monthComputation";

export function adjustmentDescription(cardLabelForDescription: string): string {
  return `Demais gastos — ${cardLabelForDescription}`;
}

function monthCursorFromYm(ym: string): MonthCursor {
  const [ys, ms] = ym.split("-");
  return { year: Number(ys), month: Number(ms) - 1 };
}

/**
 * Garante uma despesa `cardInvoiceAdjustment` por (cartão, mês) quando há total declarado:
 * valor = declarado − soma das demais despesas no cartão naquele mês (mínimo 0).
 */
export function applyDeclaredInvoiceAdjustments(
  transactions: Transaction[],
  declared: CardDeclaredInvoicesMap,
): Transaction[] {
  const declaredPairs = new Set<string>();
  for (const cardId of Object.keys(declared)) {
    const inner = declared[cardId];
    if (!inner) continue;
    for (const ym of Object.keys(inner)) {
      declaredPairs.add(`${cardId}|${ym}`);
    }
  }

  let txs = transactions.filter((t) => {
    if (!t.cardInvoiceAdjustment || t.type !== "expense") return true;
    const ym = t.date.slice(0, 7);
    const cid = t.cardId ?? "";
    return declaredPairs.has(`${cid}|${ym}`);
  });

  const adjSeen = new Set<string>();
  txs = txs.filter((t) => {
    if (!t.cardInvoiceAdjustment || t.type !== "expense") return true;
    const ym = t.date.slice(0, 7);
    const k = `${t.cardId}|${ym}`;
    if (adjSeen.has(k)) return false;
    adjSeen.add(k);
    return true;
  });

  for (const cardId of Object.keys(declared)) {
    const inner = declared[cardId];
    if (!inner) continue;
    for (const ym of Object.keys(inner)) {
      const entry = inner[ym];
      if (!entry || entry.total < 0) continue;

      const itemized = sumCardInvoiceItemizedInMonth(txs, cardId, monthCursorFromYm(ym));

      const gap = Math.max(0, Math.round((entry.total - itemized) * 100) / 100);

      const adjIdx = txs.findIndex(
        (t) =>
          t.cardInvoiceAdjustment &&
          t.type === "expense" &&
          t.cardId === cardId &&
          t.date.startsWith(ym),
      );

      const desc = adjustmentDescription(entry.cardLabelForDescription);

      if (gap <= 0) {
        if (adjIdx >= 0) txs = txs.filter((_, i) => i !== adjIdx);
        continue;
      }

      const baseFields = {
        type: "expense" as const,
        description: desc,
        date: `${ym}-01`,
        category: "outros_d",
        fixed: false,
        paid: true,
        paymentMethod: "card" as const,
        cardId,
        cardInvoiceAdjustment: true as const,
      };

      if (adjIdx >= 0) {
        const cur = txs[adjIdx];
        txs = txs.map((t, i) =>
          i === adjIdx
            ? {
                ...cur,
                ...baseFields,
                amount: gap,
                id: cur.id,
              }
            : t,
        );
      } else {
        txs.push({ ...baseFields, amount: gap, id: uid() });
      }
    }
  }

  return txs;
}
