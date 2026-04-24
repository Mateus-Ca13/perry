import { Link } from "react-router-dom";
import type { MonthCursor, Transaction } from "../types";
import { fmt } from "../utils/format";
import { sliceThenGroupByDate } from "../utils/monthComputation";
import { TransactionGroupedList } from "./TransactionGroupedList";

const PREVIEW_LIMIT = 3;

type Props = {
  investments: Transaction[];
  currentMonth: MonthCursor;
  onEdit: (tx: Transaction) => void;
};

export function InvestmentSection({ investments, currentMonth, onEdit }: Props) {
  const groupedPreview = sliceThenGroupByDate(investments, PREVIEW_LIMIT);
  const total = investments.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="px-5 mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--app-muted)" }}>
          Investimentos no mês
        </h3>
        <Link
          to="/investimentos"
          state={{ month: currentMonth }}
          className="text-sm font-semibold active:opacity-60"
          style={{ color: "var(--app-accent)" }}
        >
          Ver todos
        </Link>
      </div>
      <TransactionGroupedList
        grouped={groupedPreview}
        onEdit={onEdit}
        emptyText="Nenhum aporte neste mês — toque em + para registrar"
      />
      {investments.length > 0 ? (
        <p className="text-xs mt-2 px-1" style={{ color: "var(--app-muted)" }}>
          Total aportado:{" "}
          <strong style={{ color: "var(--app-accent)" }}>{fmt(total)}</strong>
        </p>
      ) : null}
    </div>
  );
}
