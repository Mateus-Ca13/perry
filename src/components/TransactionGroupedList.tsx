import { CalendarClock, Inbox } from "lucide-react";
import { groupLabel } from "../utils/format";
import type { Transaction } from "../types";
import { TransactionRow } from "./TransactionRow";

type EmptyVariant = "default" | "future";

type Props = {
  grouped: [string, Transaction[]][];
  onEdit: (tx: Transaction) => void;
  emptyVariant?: EmptyVariant;
  emptyText: string;
};

export function TransactionGroupedList({
  grouped,
  onEdit,
  emptyVariant = "default",
  emptyText,
}: Props) {
  if (grouped.length === 0) {
    const EmptyIcon = emptyVariant === "future" ? CalendarClock : Inbox;
    return (
      <div
        className="text-center py-12 rounded-2xl"
        style={{
          backgroundColor: "var(--app-card)",
          boxShadow: "var(--app-card-shadow)",
        }}
      >
        <div className="flex justify-center mb-3">
          <EmptyIcon className="w-12 h-12" strokeWidth={1.5} style={{ color: "var(--app-handlebar)" }} />
        </div>
        <p className="text-sm font-medium" style={{ color: "var(--app-muted)" }}>
          {emptyText}
        </p>
      </div>
    );
  }

  return (
    <>
      {grouped.map(([date, txs]) => (
        <div key={date} className="mb-4">
          <p className="text-sm font-semibold mb-2 px-1" style={{ color: "var(--app-muted)" }}>
            {groupLabel(date)}
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "var(--app-card)",
              boxShadow: "var(--app-card-shadow)",
            }}
          >
            {txs.map((tx, i) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                isLast={i === txs.length - 1}
                onTap={() => onEdit(tx)}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
