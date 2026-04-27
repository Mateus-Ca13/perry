import { Inbox } from "lucide-react";
import type { Transaction } from "../types";
import { TransactionRow } from "./TransactionRow";

type Props = {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  /** Lista da home: dia na linha de categorias. */
  showDayOnMeta?: boolean;
  /** Se definido e a lista estiver vazia, mostra estado vazio (ícone + texto). */
  emptyText?: string;
};

export function FlatTransactionList({ transactions, onEdit, showDayOnMeta, emptyText }: Props) {
  if (transactions.length === 0) {
    if (!emptyText) return null;
    return (
      <div
        className="text-center py-12 rounded-2xl"
        style={{
          backgroundColor: "var(--app-card)",
          boxShadow: "var(--app-card-shadow)",
        }}
      >
        <div className="flex justify-center mb-3">
          <Inbox className="w-12 h-12" strokeWidth={1.5} style={{ color: "var(--app-handlebar)" }} />
        </div>
        <p className="text-sm font-medium" style={{ color: "var(--app-muted)" }}>
          {emptyText}
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "var(--app-card)",
        boxShadow: "var(--app-card-shadow)",
      }}
    >
      {transactions.map((tx, i) => (
        <TransactionRow
          key={tx.id}
          tx={tx}
          isLast={i === transactions.length - 1}
          showDayOnMeta={showDayOnMeta}
          onTap={() => onEdit(tx)}
        />
      ))}
    </div>
  );
}
