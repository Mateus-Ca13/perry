import { useState, useEffect, useCallback } from "react";
import { EXPENSE_CATS, INCOME_CATS, INVESTMENT_CATS } from "../constants";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import type { SaveTransactionPayload, Transaction, TxType } from "../types";
import { todayISO } from "../utils/format";
import { CurrencyField } from "./CurrencyField";

export type DeleteRecurrenceScope = "single" | "allFuture";

type Props = {
  editing: Transaction | null;
  onSave: (tx: SaveTransactionPayload) => void;
  onDelete: ((scope: DeleteRecurrenceScope) => void) | null;
  onClose: () => void;
};

export function TransactionModal({ editing, onSave, onDelete, onClose }: Props) {
  const [type, setType] = useState<TxType>(editing?.type ?? "expense");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [date, setDate] = useState(editing?.date ?? todayISO());
  const defaultCat = (): string => {
    if (editing?.type === "income") return editing.category;
    if (editing?.type === "investment") return editing.category;
    if (editing?.type === "expense") return editing.category;
    return "alimentacao";
  };
  const [category, setCategory] = useState(
    editing ? defaultCat() : "alimentacao",
  );
  const [fixed, setFixed] = useState(!!(editing?.recurrenceRuleId || editing?.fixed));
  const [paid, setPaid] = useState(
    editing ? (editing.type === "income" ? true : editing.paid) : false,
  );
  const [closing, setClosing] = useState(false);
  const [deleteScopeOpen, setDeleteScopeOpen] = useState(false);
  const [recurrenceScopeOpen, setRecurrenceScopeOpen] = useState(false);

  useBodyScrollLock(true);

  useEffect(() => {
    if (editing) {
      setType(editing.type);
      setDescription(editing.description);
      setAmount(String(editing.amount));
      setDate(editing.date);
      setCategory(
        editing.type === "expense" ? editing.category
        : editing.type === "income" ? editing.category
        : editing.type === "investment" ? editing.category
        : "alimentacao",
      );
      setFixed(!!(editing.recurrenceRuleId || editing.fixed));
      setPaid(editing.type === "income" ? true : editing.paid);
    } else {
      setType("expense");
      setDescription("");
      setAmount("");
      setDate(todayISO());
      setCategory("alimentacao");
      setFixed(false);
      setPaid(false);
    }
  }, [editing]);

  useEffect(() => {
    setDeleteScopeOpen(false);
    setRecurrenceScopeOpen(false);
  }, [editing]);

  const cats =
    type === "expense" ? EXPENSE_CATS : type === "income" ? INCOME_CATS : INVESTMENT_CATS;

  useEffect(() => {
    if (!editing) {
      if (type === "expense") setCategory("alimentacao");
      else if (type === "income") setCategory("salario");
      else setCategory("inv_rf");
    }
  }, [type, editing]);

  useEffect(() => {
    if (type === "income") setPaid(true);
    else if (!editing) setPaid(false);
    else setPaid(editing.paid);
  }, [type, editing]);

  const handleClose = useCallback(() => {
    setDeleteScopeOpen(false);
    setRecurrenceScopeOpen(false);
    setClosing(true);
    setTimeout(onClose, 250);
  }, [onClose]);

  const requestDelete = useCallback(() => {
    if (!onDelete) return;
    if (editing?.recurrenceRuleId) {
      setDeleteScopeOpen(true);
    } else {
      onDelete("single");
    }
  }, [editing, onDelete]);

  const confirmDelete = useCallback((scope: DeleteRecurrenceScope) => {
    onDelete?.(scope);
    setDeleteScopeOpen(false);
  }, [onDelete]);

  const confirmRecurrenceFieldScope = useCallback(
    (scope: DeleteRecurrenceScope) => {
      if (!editing?.recurrenceRuleId) return;
      const val = parseFloat(String(amount).replace(",", "."));
      if (!description.trim() || Number.isNaN(val) || val <= 0) return;
      const amt = Math.round(val * 100) / 100;
      const pay = editing.type === "income" ? true : paid;
      onSave({
        type: editing.type,
        description: description.trim(),
        amount: amt,
        date,
        category: editing.category,
        fixed: false,
        paid: pay,
        id: editing.id,
        recurrenceRuleId: editing.recurrenceRuleId,
        dateChangeScope: scope,
        previousDate: editing.date,
      });
      setRecurrenceScopeOpen(false);
    },
    [editing, amount, description, date, paid, onSave],
  );

  const handleSave = useCallback(() => {
    const val = parseFloat(String(amount).replace(",", "."));
    if (!description.trim() || Number.isNaN(val) || val <= 0) return;
    const amt = Math.round(val * 100) / 100;
    if (editing) {
      const pay = editing.type === "income" ? true : paid;
      const wasRecurring = !!(editing.recurrenceRuleId || editing.fixed);
      if (wasRecurring && !fixed) {
        onSave({
          type: editing.type,
          description: description.trim(),
          amount: amt,
          date,
          category: editing.category,
          fixed: false,
          paid: pay,
          id: editing.id,
          recurrenceRuleId: editing.recurrenceRuleId,
          endRecurrence: true,
        });
        return;
      }
      const amountChanged = Math.abs(amt - editing.amount) > 0.000_01;
      if (editing.recurrenceRuleId && (date !== editing.date || amountChanged)) {
        setRecurrenceScopeOpen(true);
        return;
      }
      onSave({
        type: editing.type,
        description: description.trim(),
        amount: amt,
        date,
        category: editing.category,
        fixed: false,
        paid: pay,
        id: editing.id,
        recurrenceRuleId: editing.recurrenceRuleId,
      });
      return;
    }
    const payNew = type === "income" ? true : paid;
    onSave({
      type,
      description: description.trim(),
      amount: amt,
      date,
      category,
      fixed: false,
      paid: payNew,
      isNewRecurring: fixed,
    });
  }, [editing, type, description, amount, date, category, fixed, paid, onSave]);

  const effectiveType: TxType = editing ? editing.type : type;
  const chipAccent =
    effectiveType === "expense" ? "#FF3B30" : effectiveType === "income" ? "#34C759" : "var(--app-accent)";
  const chipBgActive =
    effectiveType === "expense"
      ? "rgba(255,59,48,0.12)"
      : effectiveType === "income"
        ? "rgba(52,199,89,0.12)"
        : "rgba(0,122,255,0.12)";
  const chipBorderActive =
    effectiveType === "expense"
      ? "rgba(255,59,48,0.3)"
      : effectiveType === "income"
        ? "rgba(52,199,89,0.3)"
        : "rgba(0,122,255,0.3)";

  const descriptionPlaceholder =
    effectiveType === "expense"
      ? "Ex.: mercado, aluguel, assinaturas"
      : effectiveType === "income"
        ? "Ex.: salário, 13º, renda extra"
        : "Ex.: aporte Tesouro, compra de cotas";

  const categoryRowCats =
    effectiveType === "expense" ? EXPENSE_CATS : effectiveType === "income" ? INCOME_CATS : INVESTMENT_CATS;
  const readOnlyCategory = editing ? categoryRowCats.find((c) => c.id === editing.category) : null;
  const ReadOnlyIcon = readOnlyCategory?.Icon;

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
        className="relative w-full min-w-0 max-w-lg overflow-x-hidden rounded-t-3xl px-5 pt-3 pb-8 z-10"
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

        <h2 className="text-xl font-bold mb-5" style={{ color: "var(--app-text)" }}>
          {editing ? "Editar lançamento" : "Novo lançamento"}
        </h2>

        {editing ? null : (
          <div
            className="grid grid-cols-3 gap-1 rounded-xl p-1 mb-5"
            style={{ backgroundColor: "var(--app-input-bg)" }}
          >
            {(["expense", "income", "investment"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className="py-2.5 rounded-lg text-xs font-semibold leading-tight"
                style={{
                  backgroundColor: type === t ? "var(--app-card)" : "transparent",
                  color:
                    type === t
                      ? t === "expense"
                        ? "#FF3B30"
                        : t === "income"
                          ? "#34C759"
                          : "var(--app-accent)"
                      : "var(--app-muted)",
                  boxShadow: type === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {t === "expense" ? "Despesa" : t === "income" ? "Receita" : "Invest."}
              </button>
            ))}
          </div>
        )}

        <label className="block mb-4">
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
            placeholder={descriptionPlaceholder}
            className="w-full px-4 py-3 rounded-xl text-base outline-none"
            style={{
              backgroundColor: "var(--app-input-bg)",
              color: "var(--app-text)",
              border: "none",
            }}
          />
        </label>

        <label className="block mb-4">
          <span
            className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
            style={{ color: "var(--app-muted)" }}
          >
            Valor
          </span>
          <CurrencyField value={amount} onChange={setAmount} placeholder="0,00" />
        </label>

        <label className="block mb-4 w-full min-w-0 max-w-full">
          <span
            className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
            style={{ color: "var(--app-muted)" }}
          >
            Data
          </span>
          <div
            className="w-full min-w-0 max-w-full overflow-hidden rounded-xl"
            style={{ backgroundColor: "var(--app-input-bg)" }}
          >
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="box-border block w-full min-w-0 max-w-full px-4 py-3 rounded-xl text-base outline-none"
              style={{
                color: "var(--app-text)",
                border: "none",
                backgroundColor: "transparent",
                minWidth: 0,
                maxWidth: "100%",
                width: "100%",
              }}
            />
          </div>
        </label>

        <div className="mb-4">
          <span
            className="text-xs font-semibold uppercase tracking-wider mb-2 block"
            style={{ color: "var(--app-muted)" }}
          >
            Categoria
          </span>
          {editing && readOnlyCategory && ReadOnlyIcon ? (
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-full w-fit"
              style={{
                backgroundColor: chipBgActive,
                color: chipAccent,
                fontWeight: 600,
                fontSize: 13,
                border: `1.5px solid ${chipBorderActive}`,
              }}
            >
              <ReadOnlyIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
              <span>{readOnlyCategory.label}</span>
            </div>
          ) : (
            <div
              className="flex gap-2 overflow-x-auto pb-2"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {cats.map((c) => {
                const active = category === c.id;
                const ChipIcon = c.Icon;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap shrink-0 active:scale-95"
                    style={{
                      backgroundColor: active ? chipBgActive : "var(--app-chip-inactive-bg)",
                      color: active ? chipAccent : "var(--app-text-soft)",
                      fontWeight: active ? 600 : 500,
                      fontSize: 13,
                      border: active ? `1.5px solid ${chipBorderActive}` : "1.5px solid transparent",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <ChipIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {effectiveType === "expense" || effectiveType === "investment" ? (
          <div className="flex items-center justify-between mb-4 px-1">
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--app-text)" }}>
                {effectiveType === "investment" ? "Já aplicado" : "Pago"}
              </p>
              <p className="text-xs" style={{ color: "var(--app-muted)" }}>
                {effectiveType === "investment"
                  ? "Marque quando o aporte já foi enviado"
                  : "Marque quando a despesa já foi quitada"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPaid((p) => !p)}
              className="relative w-12 h-7 rounded-full shrink-0"
              style={{
                backgroundColor: paid ? "#34C759" : "var(--app-toggle-off)",
                transition: "background-color 0.25s ease",
              }}
            >
              <div
                className="absolute top-0.5 w-6 h-6 rounded-full bg-white"
                style={{
                  left: paid ? 22 : 2,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  transition: "left 0.25s cubic-bezier(0.16,1,0.3,1)",
                }}
              />
            </button>
          </div>
        ) : null}

        <div className="flex items-center justify-between mb-6 px-1">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--app-text)" }}>
              Lançamento fixo
            </p>
            <p className="text-xs" style={{ color: "var(--app-muted)" }}>
              {editing?.recurrenceRuleId
                ? "Desligar encerra a série: este mês fica como último, os seguintes somem; nada de novo é gerado."
                : "Repete automaticamente todo mês"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFixed((f) => !f)}
            className="relative w-12 h-7 rounded-full shrink-0"
            style={{
              backgroundColor: fixed ? "#34C759" : "var(--app-toggle-off)",
              transition: "background-color 0.25s ease",
            }}
          >
            <div
              className="absolute top-0.5 w-6 h-6 rounded-full bg-white"
              style={{
                left: fixed ? 22 : 2,
                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                transition: "left 0.25s cubic-bezier(0.16,1,0.3,1)",
              }}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3.5 rounded-2xl text-base font-semibold text-white active:scale-[0.98]"
          style={{
            backgroundColor: "var(--app-accent)",
            transition: "transform 0.15s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {editing ? "Salvar alterações" : "Adicionar"}
        </button>

        {editing && onDelete ? (
          <button
            type="button"
            onClick={requestDelete}
            className="w-full py-3 mt-2 rounded-2xl text-sm font-semibold active:scale-[0.98]"
            style={{
              color: "#FF3B30",
              backgroundColor: "rgba(255,59,48,0.08)",
              transition: "transform 0.15s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            Excluir
          </button>
        ) : null}
      </div>

      {deleteScopeOpen && onDelete ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center p-4"
          style={{ backgroundColor: "var(--app-modal-scrim)" }}
          onClick={() => setDeleteScopeOpen(false)}
        >
          <div
            role="alertdialog"
            aria-labelledby="delete-scope-title"
            className="w-full max-w-sm rounded-2xl p-5"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: "var(--app-card)", boxShadow: "var(--app-card-shadow)" }}
          >
            <h2 id="delete-scope-title" className="text-lg font-bold mb-2" style={{ color: "var(--app-text)" }}>
              Excluir recorrência
            </h2>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--app-muted)" }}>
              Só este mês, ou este e os meses seguintes desta série (enquanto existirem)?
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => confirmDelete("single")}
                className="w-full py-3 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: "var(--app-input-bg)", color: "var(--app-text)" }}
              >
                Só este mês
              </button>
              <button
                type="button"
                onClick={() => confirmDelete("allFuture")}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: "#FF3B30" }}
              >
                Este e os meses à frente
              </button>
              <button
                type="button"
                onClick={() => setDeleteScopeOpen(false)}
                className="w-full py-2.5 rounded-xl text-sm font-medium"
                style={{ color: "var(--app-muted)" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {recurrenceScopeOpen && editing?.recurrenceRuleId ? (
        <div
          className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center p-4"
          style={{ backgroundColor: "var(--app-modal-scrim)" }}
          onClick={() => setRecurrenceScopeOpen(false)}
        >
          <div
            role="alertdialog"
            aria-labelledby="recurrence-field-scope-title"
            className="w-full max-w-sm rounded-2xl p-5"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: "var(--app-card)", boxShadow: "var(--app-card-shadow)" }}
          >
            <h2
              id="recurrence-field-scope-title"
              className="text-lg font-bold mb-2"
              style={{ color: "var(--app-text)" }}
            >
              Data ou valor
            </h2>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--app-muted)" }}>
              Aplicar a alteração de data e/ou valor só a esta ocorrência, ou a esta e a todas as
              seguintes? O nome do lançamento continua a ser o mesmo em toda a série. O horizonte
              de 6 meses reutiliza a regra.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => confirmRecurrenceFieldScope("single")}
                className="w-full py-3 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: "var(--app-input-bg)", color: "var(--app-text)" }}
              >
                Só esta ocorrência
              </button>
              <button
                type="button"
                onClick={() => confirmRecurrenceFieldScope("allFuture")}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: "var(--app-accent)" }}
              >
                Esta e as seguintes
              </button>
              <button
                type="button"
                onClick={() => setRecurrenceScopeOpen(false)}
                className="w-full py-2.5 rounded-xl text-sm font-medium"
                style={{ color: "var(--app-muted)" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
