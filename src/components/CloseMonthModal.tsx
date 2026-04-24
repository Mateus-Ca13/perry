import { useState, useEffect, useCallback } from "react";
import { MONTHS_PT } from "../constants";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import type { MonthCursor, Transaction } from "../types";
import { fmt } from "../utils/format";
import { firstDayOfMonthISO, nextMonthCursor } from "../utils/monthComputation";
import { CurrencyField } from "./CurrencyField";

type Props = {
  /** Mês que você está encerrando (ex.: abril) — a sobra é o saldo deste mês. */
  viewedMonth: MonthCursor;
  suggestedBalance: number;
  onSave: (tx: Omit<Transaction, "id">) => void;
  onClose: () => void;
};

export function CloseMonthModal({ viewedMonth, suggestedBalance, onSave, onClose }: Props) {
  const target = nextMonthCursor(viewedMonth);
  const [amount, setAmount] = useState(
    suggestedBalance > 0 ? String(suggestedBalance) : "",
  );
  const [description, setDescription] = useState(`Sobra de ${MONTHS_PT[viewedMonth.month]}`);
  const [closing, setClosing] = useState(false);

  useBodyScrollLock(true);

  useEffect(() => {
    setAmount(suggestedBalance > 0 ? String(suggestedBalance) : "");
    setDescription(`Sobra de ${MONTHS_PT[viewedMonth.month]}`);
  }, [suggestedBalance, viewedMonth.month, viewedMonth.year]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 250);
  }, [onClose]);

  const handleSubmit = useCallback(() => {
    const val = parseFloat(String(amount).replace(",", "."));
    if (!description.trim() || Number.isNaN(val) || val <= 0) return;
    onSave({
      type: "income",
      description: description.trim(),
      amount: Math.round(val * 100) / 100,
      date: firstDayOfMonthISO(target),
      category: "extra",
      fixed: false,
      paid: true,
    });
  }, [amount, description, target, onSave]);

  const canSubmit = suggestedBalance > 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center" style={{ touchAction: "none" }}>
      <div
        className="absolute inset-0"
        onClick={handleClose}
        style={{
          backgroundColor: "var(--app-modal-scrim)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          animation: closing ? "fadeIn 0.25s ease reverse forwards" : "fadeIn 0.25s ease",
          touchAction: "none",
        }}
      />

      <div
        className="relative w-full max-w-lg rounded-t-3xl px-5 pt-3 pb-8 z-10"
        style={{
          backgroundColor: "var(--app-card)",
          maxHeight: "92vh",
          overflowY: "auto",
          touchAction: "auto",
          WebkitOverflowScrolling: "touch",
          animation: closing
            ? "slideUp 0.25s cubic-bezier(0.4,0,1,1) reverse forwards"
            : "slideUp 0.35s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div className="flex justify-center mb-4">
          <div className="w-9 h-1 rounded-full" style={{ backgroundColor: "var(--app-handlebar)" }} />
        </div>

        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--app-text)" }}>
          Concluir mês
        </h2>
        <p className="text-sm mb-5" style={{ color: "var(--app-muted)", lineHeight: 1.45 }}>
          Levar para <strong style={{ color: "var(--app-text)" }}>{MONTHS_PT[target.month]}</strong> a
          sobra do saldo de{" "}
          <strong style={{ color: "var(--app-text)" }}>{MONTHS_PT[viewedMonth.month]}</strong> como{" "}
          <strong style={{ color: "#34C759" }}>Renda extra</strong> (lançamento no dia{" "}
          <strong style={{ color: "var(--app-text)" }}>1º</strong> de {MONTHS_PT[target.month]}).
        </p>

        {suggestedBalance <= 0 ? (
          <div
            className="mb-5 px-3 py-3 rounded-xl text-sm"
            style={{ backgroundColor: "var(--app-input-bg)", color: "var(--app-muted)" }}
          >
            Em {MONTHS_PT[viewedMonth.month]} não há saldo positivo ({fmt(suggestedBalance)}). Nada a
            carregar para o mês seguinte.
          </div>
        ) : (
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--app-muted)" }}>
            Saldo sugerido ({MONTHS_PT[viewedMonth.month]}):{" "}
            <span style={{ color: "#34C759" }}>{fmt(suggestedBalance)}</span>
          </p>
        )}

        <label className="block mb-4">
          <span
            className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
            style={{ color: "var(--app-muted)" }}
          >
            Valor
          </span>
          <CurrencyField
            value={amount}
            onChange={setAmount}
            disabled={!canSubmit}
            placeholder="0,00"
          />
        </label>

        <label className="block mb-6">
          <span
            className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
            style={{ color: "var(--app-muted)" }}
          >
            Descrição
          </span>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!canSubmit}
            className="w-full px-4 py-3 rounded-xl text-base outline-none disabled:opacity-50"
            style={{
              backgroundColor: "var(--app-input-bg)",
              color: "var(--app-text)",
              border: "none",
            }}
          />
        </label>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-3.5 rounded-2xl text-base font-semibold text-white active:scale-[0.98] disabled:opacity-40"
          style={{
            backgroundColor: "var(--app-accent)",
            transition: "transform 0.15s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          Adicionar renda extra em {MONTHS_PT[target.month]}
        </button>

        <button
          type="button"
          onClick={handleClose}
          className="w-full py-3 mt-2 rounded-2xl text-sm font-semibold"
          style={{ color: "var(--app-accent)" }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
