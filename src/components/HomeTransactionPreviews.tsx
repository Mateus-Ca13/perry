import { Link } from "react-router-dom";
import { useMemo } from "react";
import type { MonthCursor, Transaction } from "../types";
import { sliceThenGroupByDate } from "../utils/monthComputation";
import { TransactionGroupedList } from "./TransactionGroupedList";

const PREVIEW_LIMIT = 3;

type Props = {
  mainTransactions: Transaction[];
  currentMonth: MonthCursor;
  onEdit: (tx: Transaction) => void;
};

export function HomeTransactionPreviews({
  mainTransactions,
  currentMonth,
  onEdit,
}: Props) {
  const entradas = useMemo(
    () => mainTransactions.filter((t) => t.type === "income"),
    [mainTransactions],
  );
  const saidas = useMemo(
    () => mainTransactions.filter((t) => t.type === "expense"),
    [mainTransactions],
  );

  const entradasPreview = sliceThenGroupByDate(entradas, PREVIEW_LIMIT);
  const saidasPreview = sliceThenGroupByDate(saidas, PREVIEW_LIMIT);

  return (
    <div className="px-5 mt-4 space-y-8">
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: "var(--app-muted)" }}>
            Entradas
          </h3>
          {entradas.length > 0 ? (
            <Link
              to="/receitas"
              state={{ month: currentMonth }}
              className="text-sm font-semibold active:opacity-60"
              style={{ color: "var(--app-accent)" }}
            >
              Ver todas
            </Link>
          ) : null}
        </div>
        <TransactionGroupedList
          grouped={entradasPreview}
          onEdit={onEdit}
          emptyText="Nenhuma entrada neste mês"
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: "var(--app-muted)" }}>
            Saídas
          </h3>
          {saidas.length > 0 ? (
            <Link
              to="/despesas"
              state={{ month: currentMonth }}
              className="text-sm font-semibold active:opacity-60"
              style={{ color: "var(--app-accent)" }}
            >
              Ver todas
            </Link>
          ) : null}
        </div>
        <TransactionGroupedList
          grouped={saidasPreview}
          onEdit={onEdit}
          emptyText="Nenhuma saída neste mês"
        />
      </section>
    </div>
  );
}
