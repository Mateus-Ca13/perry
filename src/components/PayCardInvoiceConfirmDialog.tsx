import { useCallback, useState } from "react";
import { CircleCheck } from "lucide-react";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

type Props = {
  pendingCount: number;
  monthLabel: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function PayCardInvoiceConfirmDialog({
  pendingCount,
  monthLabel,
  onClose,
  onConfirm,
}: Props) {
  const [closing, setClosing] = useState(false);
  useBodyScrollLock(true);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 180);
  }, [onClose]);

  const confirm = useCallback(() => {
    onConfirm();
    handleClose();
  }, [onConfirm, handleClose]);

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-5"
      style={{
        backgroundColor: "var(--app-modal-scrim)",
        animation: closing ? "fadeIn 0.2s ease reverse forwards" : "fadeIn 0.2s ease",
      }}
      onClick={handleClose}
    >
      <div
        role="alertdialog"
        aria-labelledby="pay-invoice-title"
        aria-describedby="pay-invoice-desc"
        className="w-full max-w-sm rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--app-card)",
          boxShadow: "var(--app-card-shadow)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(52, 199, 89, 0.15)" }}
          >
            <CircleCheck className="w-5 h-5" strokeWidth={2.5} style={{ color: "#34C759" }} />
          </div>
          <h2 id="pay-invoice-title" className="text-lg font-bold leading-tight" style={{ color: "var(--app-text)" }}>
            Pagar fatura?
          </h2>
        </div>
        <p id="pay-invoice-desc" className="text-sm leading-relaxed mb-5" style={{ color: "var(--app-muted)" }}>
          Vão ser marcadas como <strong style={{ color: "var(--app-text)" }}>pagas</strong> no app as{" "}
          <strong style={{ color: "var(--app-text)" }}>
            {pendingCount} despesa{pendingCount === 1 ? "" : "s"} pendente{pendingCount === 1 ? "" : "s"}
          </strong>{" "}
          deste cartão em <strong style={{ color: "var(--app-text)" }}>{monthLabel}</strong> que já
          venceram até hoje. Isto só altera o estado de quitação dos lançamentos (Pago / Pendente), não
          os valores nem o total da fatura.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: "var(--app-input-bg)", color: "var(--app-text)" }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirm}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: "#34C759" }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
