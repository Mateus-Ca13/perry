import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileSpreadsheet, Receipt, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import type { CardDeclaredInvoiceEntry, CardBankId, MonthCursor, PaymentCard } from "../types";
import { fmt } from "../utils/format";
import { cardInvoiceHomeDisplay, monthCursorToYm } from "../utils/monthComputation";
import { BankLogoMark } from "./BankLogoMark";
import { CurrencyField } from "./CurrencyField";

type Props = {
  card: PaymentCard;
  displayName: string;
  invoiceTotal: number;
  itemizedSum: number;
  declaredEntry: CardDeclaredInvoiceEntry | undefined;
  currentMonth: MonthCursor;
  bankId: CardBankId;
  onClose: () => void;
  onAddExpense: () => void;
  onSaveDeclaredInvoice: (entry: CardDeclaredInvoiceEntry | null) => void;
};

export function CardQuickActionDialog({
  card,
  displayName,
  invoiceTotal,
  itemizedSum,
  declaredEntry,
  currentMonth,
  bankId,
  onClose,
  onAddExpense,
  onSaveDeclaredInvoice,
}: Props) {
  const navigate = useNavigate();
  useBodyScrollLock(true);

  const [closing, setClosing] = useState(false);
  const [invoiceHelpOpen, setInvoiceHelpOpen] = useState(false);
  const invoiceHelpRef = useRef<HTMLDivElement>(null);
  const [invoiceInput, setInvoiceInput] = useState(() =>
    declaredEntry != null ? declaredEntry.total.toFixed(2) : "",
  );

  const ym = useMemo(() => monthCursorToYm(currentMonth), [currentMonth]);

  /** Valor válido no campo, para validação em tempo real (sem duplicar parseFloat na UI). */
  const liveParsedDeclared = useMemo((): number | null => {
    const raw = invoiceInput.trim().replace(",", ".");
    if (raw === "") return null;
    const n = parseFloat(raw);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.round(n * 100) / 100;
  }, [invoiceInput]);

  const effectiveDeclaredTotal = useMemo((): number | null => {
    if (liveParsedDeclared !== null) return liveParsedDeclared;
    if (declaredEntry != null) return declaredEntry.total;
    return null;
  }, [liveParsedDeclared, declaredEntry]);

  const { gastosPrevistos: previewGastosPrevistos } = useMemo(
    () =>
      cardInvoiceHomeDisplay({
        declaredTotal: effectiveDeclaredTotal,
        itemizedSum,
        invoiceComputed: invoiceTotal,
      }),
    [effectiveDeclaredTotal, itemizedSum, invoiceTotal],
  );

  useEffect(() => {
    if (!invoiceHelpOpen) return;
    const close = (e: MouseEvent | TouchEvent) => {
      const el = invoiceHelpRef.current;
      if (el && !el.contains(e.target as Node)) setInvoiceHelpOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close, { passive: true });
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [invoiceHelpOpen]);

  useEffect(() => {
    setInvoiceInput(declaredEntry != null ? declaredEntry.total.toFixed(2) : "");
  }, [declaredEntry, card.id, ym]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 200);
  }, [onClose]);

  const goInvoice = useCallback(() => {
    navigate(`/despesas?cartao=${card.id}`, { state: { month: currentMonth } });
    handleClose();
  }, [navigate, card.id, currentMonth, handleClose]);

  const addExpense = useCallback(() => {
    onClose();
    queueMicrotask(() => {
      onAddExpense();
    });
  }, [onClose, onAddExpense]);

  const parseInvoiceAmount = useCallback((): number | null => {
    const raw = invoiceInput.trim().replace(",", ".");
    if (raw === "") return null;
    const n = parseFloat(raw);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.round(n * 100) / 100;
  }, [invoiceInput]);

  const saveDeclared = useCallback(() => {
    const raw = invoiceInput.trim().replace(",", ".");
    if (raw === "") {
      onSaveDeclaredInvoice(null);
      handleClose();
      return;
    }
    const v = parseInvoiceAmount();
    if (v === null) return;
    onSaveDeclaredInvoice({
      total: v,
      cardLabelForDescription: displayName,
    });
    handleClose();
  }, [invoiceInput, parseInvoiceAmount, onSaveDeclaredInvoice, displayName, handleClose]);

  const clearDeclared = useCallback(() => {
    setInvoiceInput("");
    onSaveDeclaredInvoice(null);
    handleClose();
  }, [onSaveDeclaredInvoice, handleClose]);

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
        aria-labelledby="card-actions-title"
        className="w-full max-w-sm rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--app-card)",
          boxShadow: "var(--app-card-shadow)",
          animation: closing ? undefined : "slideUp 0.25s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <BankLogoMark bankId={bankId} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 id="card-actions-title" className="text-lg font-bold truncate" style={{ color: "var(--app-text)" }}>
              {displayName}
            </h2>
            <p className="text-xs mt-0.5 leading-snug" style={{ color: "var(--app-muted)" }}>
              Total no cartão neste mês ({ym}):{" "}
              <span className="font-semibold" style={{ color: "var(--app-text)" }}>
                {fmt(invoiceTotal)}
              </span>
              {effectiveDeclaredTotal !== null ? (
                <>
                  {" "}
                  · fechamento no banco{" "}
                  <span className="font-semibold" style={{ color: "var(--app-text)" }}>
                    {fmt(effectiveDeclaredTotal)}
                  </span>
                </>
              ) : null}
            </p>
            <p className="text-[11px] mt-1 leading-snug" style={{ color: "var(--app-muted)" }}>
              Lançamentos (sem linha de ajuste):{" "}
              <span className="font-medium" style={{ color: "var(--app-text)" }}>
                {fmt(itemizedSum)}
              </span>
              {previewGastosPrevistos != null ? (
                <>
                  {" "}
                  · gastos previstos{" "}
                  <span className="font-medium" style={{ color: "var(--app-text)" }}>
                    {fmt(previewGastosPrevistos)}
                  </span>
                </>
              ) : null}
            </p>
          </div>
        </div>

        <div ref={invoiceHelpRef} className="rounded-xl p-3 mb-4 relative" style={{ backgroundColor: "var(--app-input-bg)" }}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <label htmlFor="declared-invoice-total" className="block min-w-0 flex-1">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--app-muted)" }}>
                Valor total da fatura (fechamento)
              </span>
            </label>
            <button
              type="button"
              aria-expanded={invoiceHelpOpen}
              aria-controls="invoice-declared-help"
              aria-label="Como funciona a fatura declarada"
              onClick={() => setInvoiceHelpOpen((o) => !o)}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold leading-none active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-accent)] focus-visible:ring-offset-2"
              style={{
                backgroundColor: "var(--app-card)",
                color: "var(--app-muted)",
                border: "1px solid var(--app-border)",
              }}
            >
              ?
            </button>
          </div>
          {invoiceHelpOpen ? (
            <div
              id="invoice-declared-help"
              role="tooltip"
              className="mb-2 rounded-lg px-3 py-2.5 text-[11px] leading-relaxed"
              style={{
                backgroundColor: "var(--app-card)",
                color: "var(--app-muted)",
                border: "1px solid var(--app-border)",
                boxShadow: "var(--app-card-shadow)",
              }}
            >
              Se o fechamento for maior que os lançamentos sem ajuste, o app cria ou atualiza a despesa “Demais gastos — {displayName}” até esse total.
              Se for menor, não há linha extra: a diferença aparece como “gastos previstos” no cartão da página inicial (lançamentos além do que já fechou no banco).
              Ao alterar o valor ou as despesas no cartão, o ajuste e os previstos atualizam automaticamente.
              Deixe o campo vazio e toque em «Aplicar fatura» para limpar o fechamento neste mês.
            </div>
          ) : null}
          <CurrencyField
            id="declared-invoice-total"
            value={invoiceInput}
            onChange={setInvoiceInput}
            placeholder="0,00"
          />
          {previewGastosPrevistos != null && effectiveDeclaredTotal !== null ? (
            <div
              className="mt-2 rounded-lg px-3 py-2 text-[11px] leading-relaxed"
              style={{
                backgroundColor: "var(--app-card)",
                color: "var(--app-muted)",
                border: "1px solid var(--app-border)",
              }}
            >
              <span className="font-semibold" style={{ color: "var(--app-text)" }}>
                Gastos previstos:
              </span>{" "}
              <span className="tabular-nums font-semibold" style={{ color: "var(--app-text)" }}>
                {fmt(previewGastosPrevistos)}
              </span>
              {" — "}
              soma dos lançamentos acima do fechamento no banco (
              <span className="tabular-nums">{fmt(itemizedSum)}</span>
              {" − "}
              <span className="tabular-nums">{fmt(effectiveDeclaredTotal)}</span>
              ).
            </div>
          ) : null}
          <button
            type="button"
            onClick={saveDeclared}
            className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98]"
            style={{
              backgroundColor: "var(--app-accent)",
              color: "#fff",
            }}
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" strokeWidth={2.5} />
            Aplicar fatura
          </button>
          {declaredEntry != null ? (
            <button
              type="button"
              onClick={clearDeclared}
              className="w-full mt-2 py-2 rounded-xl text-xs font-medium"
              style={{ color: "var(--app-muted)" }}
            >
              Limpar total declarado e remover ajuste deste mês
            </button>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={addExpense}
            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 text-white active:scale-[0.98]"
            style={{ backgroundColor: "#FF3B30" }}
          >
            <Receipt className="w-4 h-4 shrink-0" strokeWidth={2.5} />
            Adicionar despesa
          </button>
          <button
            type="button"
            onClick={goInvoice}
            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98]"
            style={{
              backgroundColor: "var(--app-input-bg)",
              color: "var(--app-text)",
            }}
          >
            <Wallet className="w-4 h-4 shrink-0" strokeWidth={2.5} />
            Ver fatura
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
