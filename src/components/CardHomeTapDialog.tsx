import { useCallback, useState } from "react";
import { Receipt, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import type { MonthCursor, PaymentCard } from "../types";
import { BankLogoMark } from "./BankLogoMark";

type Props = {
  card: PaymentCard;
  displayName: string;
  currentMonth: MonthCursor;
  onClose: () => void;
  onAddExpense: () => void;
};

export function CardHomeTapDialog({
  card,
  displayName,
  currentMonth,
  onClose,
  onAddExpense,
}: Props) {
  const navigate = useNavigate();
  const [closing, setClosing] = useState(false);
  useBodyScrollLock(true);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 180);
  }, [onClose]);

  const viewInvoice = useCallback(() => {
    navigate(`/cartao/${card.id}`, { state: { month: currentMonth } });
    handleClose();
  }, [navigate, card.id, currentMonth, handleClose]);

  const addExpense = useCallback(() => {
    onAddExpense();
  }, [onAddExpense]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center p-4"
      style={{
        backgroundColor: "var(--app-modal-scrim)",
        animation: closing ? "fadeIn 0.2s ease reverse forwards" : "fadeIn 0.2s ease",
      }}
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-labelledby="card-home-choice-title"
        className="w-full max-w-sm rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--app-card)",
          boxShadow: "var(--app-card-shadow)",
          animation: closing ? undefined : "slideUp 0.25s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div className="flex items-center gap-3 mb-5">
          <BankLogoMark bankId={card.bankId} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 id="card-home-choice-title" className="text-lg font-bold truncate" style={{ color: "var(--app-text)" }}>
              {displayName}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--app-muted)" }}>
              O que queres fazer?
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={addExpense}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 text-white active:scale-[0.99]"
            style={{ backgroundColor: "#FF3B30" }}
          >
            <Receipt className="w-[18px] h-[18px] shrink-0" strokeWidth={2.5} />
            Nova despesa neste cartão
          </button>
          <button
            type="button"
            onClick={viewInvoice}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.99]"
            style={{
              backgroundColor: "var(--app-input-bg)",
              color: "var(--app-text)",
              border: "1px solid var(--app-border)",
            }}
          >
            <Wallet className="w-[18px] h-[18px] shrink-0" strokeWidth={2.5} />
            Ver fatura do cartão
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2.5 rounded-xl text-sm font-medium"
            style={{ color: "var(--app-muted)" }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
