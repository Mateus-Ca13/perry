import { useCallback, useEffect, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { CurrencyField } from "./CurrencyField";

type Props = {
  displayName: string;
  initialValue: string;
  onClose: () => void;
  /** Guarda o fechamento no banco (valor ≥ 0). */
  onApply: (total: number) => void;
  /** Se já existe fechamento, não permitir campo vazio ao guardar. */
  hadExistingDeclared: boolean;
};

export function InvoiceClosingDialog({
  displayName,
  initialValue,
  onClose,
  onApply,
  hadExistingDeclared,
}: Props) {
  const [closing, setClosing] = useState(false);
  const [input, setInput] = useState(initialValue);
  useBodyScrollLock(true);

  useEffect(() => {
    setInput(initialValue);
  }, [initialValue]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 180);
  }, [onClose]);

  const parseAmount = useCallback((): number | null => {
    const raw = input.trim().replace(",", ".");
    if (raw === "") return null;
    const n = parseFloat(raw);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.round(n * 100) / 100;
  }, [input]);

  const apply = useCallback(() => {
    const raw = input.trim().replace(",", ".");
    if (raw === "") {
      if (hadExistingDeclared) return;
      handleClose();
      return;
    }
    const v = parseAmount();
    if (v === null) return;
    onApply(v);
    handleClose();
  }, [input, hadExistingDeclared, parseAmount, onApply, handleClose]);

  return (
    <div
      className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center p-4"
      style={{
        backgroundColor: "var(--app-modal-scrim)",
        animation: closing ? "fadeIn 0.2s ease reverse forwards" : "fadeIn 0.2s ease",
      }}
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-labelledby="invoice-closing-title"
        className="w-full max-w-sm rounded-2xl p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--app-card)",
          boxShadow: "var(--app-card-shadow)",
        }}
      >
        <h2 id="invoice-closing-title" className="text-lg font-bold mb-1" style={{ color: "var(--app-text)" }}>
          Fechamento no banco
        </h2>
        <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--app-muted)" }}>
          Valor da fatura fechada no banco para «{displayName}». O app compara com os lançamentos e
          ajusta «Demais gastos» ou mostra gastos previstos.
        </p>

        <details className="mb-4 rounded-xl overflow-hidden border border-solid" style={{ borderColor: "var(--app-border)" }}>
          <summary
            className="px-3 py-2 text-xs font-semibold cursor-pointer select-none list-none flex items-center justify-between [&::-webkit-details-marker]:hidden"
            style={{ backgroundColor: "var(--app-input-bg)", color: "var(--app-text)" }}
          >
            <span>Como funciona</span>
            <span className="text-[10px] opacity-60">▾</span>
          </summary>
          <div
            className="px-3 py-2.5 text-[11px] leading-relaxed border-t border-solid"
            style={{ borderColor: "var(--app-border)", color: "var(--app-muted)" }}
          >
            Fechamento <strong style={{ color: "var(--app-text)" }}>maior</strong> que os lançamentos
            sem ajuste → cria/atualiza «Demais gastos — {displayName}».{" "}
            <strong style={{ color: "var(--app-text)" }}>Menor</strong> → diferença aparece como gastos
            previstos.
          </div>
        </details>

        <label htmlFor="invoice-closing-input" className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider block mb-2" style={{ color: "var(--app-muted)" }}>
            Valor da fatura (fechamento)
          </span>
          <CurrencyField id="invoice-closing-input" value={input} onChange={setInput} placeholder="0,00" />
        </label>

        <div className="flex gap-2 mt-5">
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
            onClick={apply}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 active:scale-[0.98]"
            style={{ backgroundColor: "var(--app-accent)" }}
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" strokeWidth={2.5} />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
