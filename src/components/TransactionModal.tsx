import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { EXPENSE_CATS, INCOME_CATS, INVESTMENT_CATS } from "../constants";
import { bankPresetById } from "../data/cardBanks";
import { useCards } from "../context/CardsContext";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import type { PaymentMethod, SaveTransactionPayload, Transaction, TxType } from "../types";
import { isValidIsoDateString, todayISO } from "../utils/format";
import { expenseUsesCard } from "../utils/monthComputation";
import { BankLogoMark } from "./BankLogoMark";
import { CurrencyField } from "./CurrencyField";

export type DeleteRecurrenceScope = "single" | "allFuture";

export type ExpensePrefill = { paymentMethod: PaymentMethod; cardId?: string };

type Props = {
  editing: Transaction | null;
  expensePrefill?: ExpensePrefill | null;
  onSave: (tx: SaveTransactionPayload) => void;
  onDelete: ((scope: DeleteRecurrenceScope) => void) | null;
  onClose: () => void;
};

export function TransactionModal({ editing, expensePrefill = null, onSave, onDelete, onClose }: Props) {
  const { cards } = useCards();
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [cardPickerOpen, setCardPickerOpen] = useState(false);
  const cardPickerRef = useRef<HTMLDivElement>(null);
  const [sheetDragY, setSheetDragY] = useState(0);
  const [sheetDragging, setSheetDragging] = useState(false);
  const [sheetEnterDone, setSheetEnterDone] = useState(false);
  const sheetDragActiveRef = useRef(false);
  const sheetDragStartY = useRef(0);

  useBodyScrollLock(true);

  useEffect(() => {
    const t = window.setTimeout(() => setSheetEnterDone(true), 450);
    return () => window.clearTimeout(t);
  }, []);

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
    if (editing) {
      if (editing.type === "expense") {
        setPaymentMethod(expenseUsesCard(editing) ? "card" : "pix");
        setSelectedCardId(editing.cardId ?? "");
      }
      return;
    }
    if (type === "expense" && expensePrefill) {
      setPaymentMethod(expensePrefill.paymentMethod);
      setSelectedCardId(expensePrefill.cardId ?? "");
    } else if (!editing && type === "expense") {
      setPaymentMethod("pix");
      setSelectedCardId("");
    }
  }, [editing, type, expensePrefill]);

  useEffect(() => {
    setDeleteScopeOpen(false);
    setRecurrenceScopeOpen(false);
    setSheetDragY(0);
    setSheetDragging(false);
    sheetDragActiveRef.current = false;
  }, [editing]);

  useEffect(() => {
    if (paymentMethod !== "card") setCardPickerOpen(false);
  }, [paymentMethod]);

  useEffect(() => {
    if (!cardPickerOpen) return;
    const close = (e: MouseEvent | TouchEvent) => {
      const el = cardPickerRef.current;
      if (el && !el.contains(e.target as Node)) setCardPickerOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close, { passive: true });
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [cardPickerOpen]);

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

  const effectiveType: TxType = editing ? editing.type : type;

  const hideTypeAndPayment =
    !editing &&
    expensePrefill != null &&
    expensePrefill.paymentMethod === "card" &&
    expensePrefill.cardId != null &&
    expensePrefill.cardId !== "";

  const selectedPaymentCard = useMemo(
    () => (selectedCardId ? cards.find((c) => c.id === selectedCardId) : undefined),
    [cards, selectedCardId],
  );

  const expensePayPart = useMemo((): Pick<SaveTransactionPayload, "paymentMethod" | "cardId"> | Record<string, never> => {
    if (effectiveType !== "expense") return {};
    if (paymentMethod === "card" && selectedCardId) {
      return { paymentMethod: "card", cardId: selectedCardId };
    }
    return { paymentMethod: "pix" };
  }, [effectiveType, paymentMethod, selectedCardId]);

  const cardPayInvalid =
    effectiveType === "expense" &&
    paymentMethod === "card" &&
    (!selectedCardId || cards.length === 0);

  const paymentChangedFromEditing = useMemo(() => {
    if (!editing || editing.type !== "expense") return false;
    if (!("paymentMethod" in expensePayPart)) return false;
    const curPm = expenseUsesCard(editing) ? "card" : "pix";
    const curCid = editing.cardId ?? "";
    const nextPm = expensePayPart.paymentMethod === "card" ? "card" : "pix";
    const nextCid =
      expensePayPart.paymentMethod === "card" && "cardId" in expensePayPart && expensePayPart.cardId
        ? expensePayPart.cardId
        : "";
    return curPm !== nextPm || curCid !== nextCid;
  }, [editing, expensePayPart]);

  const handleClose = useCallback(() => {
    setDeleteScopeOpen(false);
    setRecurrenceScopeOpen(false);
    setCardPickerOpen(false);
    setSheetDragY(0);
    setSheetDragging(false);
    sheetDragActiveRef.current = false;
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
      if (cardPayInvalid) return;
      if (!isValidIsoDateString(date)) return;
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
        previousAmount: editing.amount,
        ...expensePayPart,
      });
      setRecurrenceScopeOpen(false);
    },
    [editing, amount, description, date, paid, onSave, expensePayPart, cardPayInvalid],
  );

  const handleSave = useCallback(() => {
    const val = parseFloat(String(amount).replace(",", "."));
    if (!description.trim() || Number.isNaN(val) || val <= 0) return;
    if (!isValidIsoDateString(date)) return;
    if (cardPayInvalid) return;
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
          ...expensePayPart,
        });
        return;
      }
      const amountChanged = Math.abs(amt - editing.amount) > 0.000_01;
      if (
        editing.recurrenceRuleId &&
        (date !== editing.date || amountChanged || paymentChangedFromEditing)
      ) {
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
        ...expensePayPart,
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
      ...expensePayPart,
    });
  }, [editing, type, description, amount, date, category, fixed, paid, onSave, expensePayPart, cardPayInvalid, paymentChangedFromEditing]);

  const onSheetPanelAnimationEnd = useCallback(
    (e: React.AnimationEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return;
      if (e.animationName !== "slideUp") return;
      if (closing) return;
      setSheetEnterDone(true);
    },
    [closing],
  );

  const onSheetHandlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (closing) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      sheetDragActiveRef.current = true;
      setSheetDragging(true);
      sheetDragStartY.current = e.clientY;
    },
    [closing],
  );

  const onSheetHandlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!sheetDragActiveRef.current) return;
    const d = e.clientY - sheetDragStartY.current;
    setSheetDragY(Math.max(0, d));
  }, []);

  const onSheetHandlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!sheetDragActiveRef.current) return;
      sheetDragActiveRef.current = false;
      setSheetDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* liberado */
      }
      const d = e.clientY - sheetDragStartY.current;
      setSheetDragY(0);
      if (d > 100) handleClose();
    },
    [handleClose],
  );

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

  const isCardInvoiceAdjustment =
    !!(editing?.type === "expense" && editing.cardInvoiceAdjustment);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center" style={{ touchAction: "none" }}>
      <button
        type="button"
        tabIndex={-1}
        className="absolute inset-0 cursor-pointer border-0 p-0"
        aria-label="Fechar"
        style={{
          backgroundColor: "var(--app-modal-scrim)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          animation: closing ? "fadeIn 0.25s ease reverse forwards" : "fadeIn 0.25s ease",
          touchAction: "none",
          zIndex: 0,
        }}
        onClick={() => {
          if (!closing) handleClose();
        }}
      />

      <div
        className="relative z-10 flex w-full min-w-0 max-w-lg flex-col overflow-hidden rounded-t-3xl shadow-lg"
        style={{
          backgroundColor: "var(--app-card)",
          maxHeight: "min(88vh, 640px)",
          touchAction: "none",
          transform: `translateY(${sheetDragY}px)`,
          transition: sheetDragging
            ? "none"
            : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          animation: closing
            ? "slideUp 0.25s cubic-bezier(0.4,0,1,1) reverse forwards"
            : sheetEnterDone
              ? "none"
              : "slideUp 0.35s cubic-bezier(0.16,1,0.3,1) forwards",
        }}
        onAnimationEnd={onSheetPanelAnimationEnd}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div
            className="flex shrink-0 cursor-grab touch-none select-none justify-center pt-3 pb-2 active:cursor-grabbing"
            style={{ touchAction: "none" }}
            onPointerDown={onSheetHandlePointerDown}
            onPointerMove={onSheetHandlePointerMove}
            onPointerUp={onSheetHandlePointerUp}
            onPointerCancel={onSheetHandlePointerUp}
          >
            <div className="w-9 h-1 rounded-full" style={{ backgroundColor: "var(--app-handlebar)" }} />
          </div>

          <div
            className="min-h-0 flex-1 scroll-smooth overflow-x-hidden overflow-y-auto overscroll-y-contain px-5 pb-8"
            style={{
              WebkitOverflowScrolling: "touch",
              touchAction: "pan-y",
              scrollBehavior: "smooth",
            }}
          >

        <h2 className="text-xl font-bold mb-5" style={{ color: "var(--app-text)" }}>
          {editing
            ? isCardInvoiceAdjustment
              ? "Ajuste da fatura no cartão"
              : "Editar lançamento"
            : hideTypeAndPayment
              ? "Nova despesa"
              : "Novo lançamento"}
        </h2>

        {isCardInvoiceAdjustment ? (
          <div
            className="mb-5 rounded-xl p-3 text-sm leading-relaxed"
            style={{ backgroundColor: "var(--app-input-bg)", color: "var(--app-muted)" }}
          >
            O valor é calculado automaticamente com base no total da fatura que indicou ao tocar no cartão na página inicial e nas demais despesas deste cartão no mês. Para alterar o total, use outra vez essa opção no cartão; para remover o vínculo, exclua este lançamento.
          </div>
        ) : null}

        {editing ? null : hideTypeAndPayment ? null : (
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
            disabled={isCardInvoiceAdjustment}
            readOnly={isCardInvoiceAdjustment}
            className="w-full px-4 py-3 rounded-xl text-base outline-none"
            style={{
              backgroundColor: "var(--app-input-bg)",
              color: "var(--app-text)",
              border: "none",
              opacity: isCardInvoiceAdjustment ? 0.85 : 1,
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
          <CurrencyField
            value={amount}
            onChange={setAmount}
            placeholder="0,00"
            disabled={isCardInvoiceAdjustment}
          />
        </label>

        {effectiveType === "expense" && !hideTypeAndPayment && !isCardInvoiceAdjustment ? (
          <div className="mb-4">
            <span
              className="text-xs font-semibold uppercase tracking-wider mb-2 block"
              style={{ color: "var(--app-muted)" }}
            >
              Forma de pagamento
            </span>
            <div
              className="grid grid-cols-2 gap-2 rounded-xl p-1 mb-3"
              style={{ backgroundColor: "var(--app-input-bg)" }}
            >
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("pix");
                  setSelectedCardId("");
                }}
                className="py-2.5 rounded-lg text-sm font-semibold"
                style={{
                  backgroundColor: paymentMethod === "pix" ? "var(--app-card)" : "transparent",
                  color: paymentMethod === "pix" ? "var(--app-text)" : "var(--app-muted)",
                  boxShadow: paymentMethod === "pix" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
              >
                PIX
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className="py-2.5 rounded-lg text-sm font-semibold"
                style={{
                  backgroundColor: paymentMethod === "card" ? "var(--app-card)" : "transparent",
                  color: paymentMethod === "card" ? "var(--app-text)" : "var(--app-muted)",
                  boxShadow: paymentMethod === "card" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
              >
                Cartão
              </button>
            </div>
            {paymentMethod === "card" ? (
              cards.length === 0 ? (
                <p className="text-xs leading-relaxed" style={{ color: "var(--app-muted)" }}>
                  Adicione um cartão em Menu → Gerenciar cartões.
                </p>
              ) : (
                <div className="relative" ref={cardPickerRef}>
                  <button
                    type="button"
                    id="transaction-card-picker"
                    aria-haspopup="listbox"
                    aria-expanded={cardPickerOpen}
                    onClick={() => setCardPickerOpen((o) => !o)}
                    className="flex w-full items-center gap-3 rounded-xl border border-solid py-3 px-3 text-left text-sm font-medium outline-none active:opacity-90"
                    style={{
                      backgroundColor: "var(--app-input-bg)",
                      color: "var(--app-text)",
                      borderColor: "var(--app-border)",
                    }}
                  >
                    {selectedPaymentCard ? (
                      <>
                        <BankLogoMark bankId={selectedPaymentCard.bankId} size="xs" />
                        <span className="min-w-0 flex-1 truncate">
                          {selectedPaymentCard.label ||
                            bankPresetById(selectedPaymentCard.bankId)?.label ||
                            selectedPaymentCard.bankId}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="h-8 w-8 shrink-0" aria-hidden />
                        <span className="min-w-0 flex-1 truncate font-medium" style={{ color: "var(--app-muted)" }}>
                          Escolher cartão…
                        </span>
                      </>
                    )}
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform ${cardPickerOpen ? "rotate-180" : ""}`}
                      strokeWidth={2}
                      style={{ color: "var(--app-muted)" }}
                      aria-hidden
                    />
                  </button>
                  {cardPickerOpen ? (
                    <ul
                      className="absolute left-0 right-0 z-[100] mt-1 max-h-48 overflow-y-auto rounded-xl border border-solid py-1 shadow-lg"
                      role="listbox"
                      aria-labelledby="transaction-card-picker"
                      style={{
                        backgroundColor: "var(--app-card)",
                        borderColor: "var(--app-border)",
                        boxShadow: "var(--app-card-shadow)",
                      }}
                    >
                      <li role="presentation">
                        <button
                          type="button"
                          role="option"
                          aria-selected={selectedCardId === ""}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm active:opacity-85"
                          style={{
                            backgroundColor: selectedCardId === "" ? "var(--app-row-active)" : "transparent",
                            color: "var(--app-muted)",
                          }}
                          onClick={() => {
                            setSelectedCardId("");
                            setCardPickerOpen(false);
                          }}
                        >
                          <span className="h-8 w-8 shrink-0" aria-hidden />
                          <span className="font-medium">Escolher cartão…</span>
                        </button>
                      </li>
                      {cards.map((c) => {
                        const name = c.label || bankPresetById(c.bankId)?.label || c.bankId;
                        const sel = c.id === selectedCardId;
                        return (
                          <li key={c.id} role="presentation">
                            <button
                              type="button"
                              role="option"
                              aria-selected={sel}
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm active:opacity-85"
                              style={{
                                backgroundColor: sel ? "var(--app-row-active)" : "transparent",
                                color: "var(--app-text)",
                              }}
                              onClick={() => {
                                setSelectedCardId(c.id);
                                setCardPickerOpen(false);
                              }}
                            >
                              <BankLogoMark bankId={c.bankId} size="xs" />
                              <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              )
            ) : null}
            {cardPayInvalid ? (
              <p className="text-xs mt-2" style={{ color: "#FF3B30" }}>
                Selecione um cartão para continuar.
              </p>
            ) : null}
          </div>
        ) : null}

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
              disabled={isCardInvoiceAdjustment}
              className="box-border block w-full min-w-0 max-w-full px-4 py-3 rounded-xl text-base outline-none"
              style={{
                color: "var(--app-text)",
                border: "none",
                backgroundColor: "transparent",
                minWidth: 0,
                maxWidth: "100%",
                width: "100%",
                opacity: isCardInvoiceAdjustment ? 0.85 : 1,
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

        {(effectiveType === "expense" || effectiveType === "investment") &&
        !(effectiveType === "expense" && isCardInvoiceAdjustment) ? (
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

        {!isCardInvoiceAdjustment ? (
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
        ) : null}

        {isCardInvoiceAdjustment ? (
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-3.5 rounded-2xl text-base font-semibold active:scale-[0.98]"
            style={{
              backgroundColor: "var(--app-input-bg)",
              color: "var(--app-text)",
              transition: "transform 0.15s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            Fechar
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={cardPayInvalid}
            className="w-full py-3.5 rounded-2xl text-base font-semibold text-white active:scale-[0.98] disabled:opacity-40"
            style={{
              backgroundColor: "var(--app-accent)",
              transition: "transform 0.15s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            {editing ? "Salvar alterações" : "Adicionar"}
          </button>
        )}

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
        </div>
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
              Ocorrência ou série
            </h2>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--app-muted)" }}>
              Aplicar a alteração de data, valor ou forma de pagamento só a esta ocorrência, ou a esta e
              a todas as seguintes? O nome do lançamento continua a ser o mesmo em toda a série. O
              horizonte de 6 meses reutiliza a regra.
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
