import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MonthNav } from "./MonthNav";
import type { MonthCursor } from "../types";

type Props = {
  title: string;
  children: ReactNode;
  /** Se omitido, a barra de mês não é exibida. */
  currentMonth?: MonthCursor;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
};

export function SubPageLayout({
  title,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  children,
}: Props) {
  const navigate = useNavigate();
  const showMonth = currentMonth != null && onPrevMonth != null && onNextMonth != null;

  return (
    <div className="min-h-screen pb-36" style={{ backgroundColor: "var(--app-page)" }}>
      <div className="px-5 pt-6 pb-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 active:scale-90"
          style={{
            backgroundColor: "color-mix(in srgb, var(--app-accent) 12%, transparent)",
            transition: "transform 0.15s cubic-bezier(0.4,0,0.2,1)",
          }}
          aria-label="Voltar"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2.5} style={{ color: "var(--app-accent)" }} />
        </button>
        <h1 className="text-xl font-bold tracking-tight flex-1" style={{ color: "var(--app-text)" }}>
          {title}
        </h1>
      </div>

      {showMonth ? (
        <MonthNav currentMonth={currentMonth} onPrev={onPrevMonth} onNext={onNextMonth} />
      ) : null}

      <div className="px-5 mt-2">{children}</div>
    </div>
  );
}
