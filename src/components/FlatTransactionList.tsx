import type { Transaction } from "../types";
import { TransactionRow } from "./TransactionRow";

type Props = {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
};

export function FlatTransactionList({ transactions, onEdit }: Props) {
  if (transactions.length === 0) return null;

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
          onTap={() => onEdit(tx)}
        />
      ))}
    </div>
  );
}
