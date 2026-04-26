import { Info } from "lucide-react";
import { RECURRING_WINDOW_MONTHS } from "../constants";

type Props = { className?: string };

/**
 * Aviso exibido no lugar de resumos/listas quando o mês navegado está além
 * da janela de materialização (hoje + 6 meses, inclusive o mês atual).
 */
export function RecurringHorizonNotice({ className = "" }: Props) {
  const w = RECURRING_WINDOW_MONTHS;
  return (
    <div
      role="status"
      className={`rounded-2xl px-4 py-4 text-sm ${className}`}
      style={{
        backgroundColor: "var(--app-card)",
        boxShadow: "var(--app-card-shadow)",
        border: "1px solid color-mix(in srgb, var(--app-accent) 20%, transparent)",
        color: "var(--app-muted)",
      }}
    >
      <div className="flex flex-col items-center justify-center gap-3">
        <Info className="w-10 h-10 shrink-0 mt-0.5" strokeWidth={2} style={{ color: "var(--app-accent)" }} />
        <p className="font-semibold  text-lg text-center" style={{ color: "var(--app-text)" }}>
          Sem dados disponíves
        </p>
        <p className="text-xs sm:text-sm leading-snug text-center">
          Cálculos de receitas, despesas e investimentos ainda não estão disponíveis para este mês, pois ultrapassam a janela de {w} meses.
          Volte para um mês mais próximo ou use lançamentos avulsos.
        </p>
      </div>
    </div>
  );
}
