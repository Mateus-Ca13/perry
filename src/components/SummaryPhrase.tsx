import { fmt } from "../utils/format";
import type { MonthSummary } from "../types";

type Props = { summary: MonthSummary };

export function SummaryPhrase({ summary }: Props) {
  const pct =
    summary.income > 0
      ? Math.round((summary.investment / summary.income) * 1000) / 10
      : 0;

  return (
    <div
      className="mx-5 mt-4 mb-2 px-4 py-3 rounded-xl"
      style={{ backgroundColor: "var(--app-phrase-bg)" }}
    >
      <p className="text-sm" style={{ color: "var(--app-phrase-text)", lineHeight: 1.5 }}>
        Você recebeu <strong style={{ color: "#34C759" }}>{fmt(summary.income)}</strong> este
        mês. Gastou <strong style={{ color: "#FF3B30" }}>{fmt(summary.expense)}</strong>.
        {summary.investment > 0 ? (
          <>
            {" "}
            Separou <strong style={{ color: "var(--app-accent)" }}>{fmt(summary.investment)}</strong>{" "}
            para investir
            {summary.income > 0 ? (
              <>
                {" "}
                (<strong style={{ color: "var(--app-accent)" }}>{pct}%</strong> da renda)
              </>
            ) : null}
            .
          </>
        ) : null}{" "}
        {summary.balance >= 0 ? "Ainda sobra " : "Você está "}
        <strong style={{ color: summary.balance >= 0 ? "#34C759" : "#FF3B30" }}>
          {fmt(Math.abs(summary.balance))}
        </strong>
        {summary.balance < 0 ? " no vermelho." : "."}
      </p>
    </div>
  );
}
