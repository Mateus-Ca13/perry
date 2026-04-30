import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type SetStateAction,
} from "react";
import { FloatingDock } from "../components/FloatingDock";
import { TransactionModal } from "../components/TransactionModal";
import type {
  CardDeclaredInvoiceEntry,
  CardDeclaredInvoicesMap,
  MonthCursor,
  PaymentMethod,
  RecurringRule,
  SaveTransactionPayload,
  Transaction,
} from "../types";
import { applyDeclaredInvoiceAdjustments } from "../utils/cardDeclaredInvoice";
import { todayISO } from "../utils/format";
import { monthCursorToYm } from "../utils/monthComputation";
import {
  addCalendarMonths,
  buildMissingOccurrences,
  dayOfMonthFromIso,
  isoDateInMonth,
  newRecurringRuleFromForm,
} from "../utils/recurringMaterialize";
import { uid } from "../utils/id";
import {
  loadCardDeclaredInvoices,
  loadPersistedAppState,
  saveCardDeclaredInvoices,
  saveRecurringRules,
  saveTransactions,
} from "../utils/storage";

type ExpenseModalPrefill = { paymentMethod: PaymentMethod; cardId?: string };

type TransactionsOutletUiValue = {
  openNew: () => void;
  showModal: boolean;
  editingTx: Transaction | null;
  modalExpensePrefill: ExpenseModalPrefill | null;
  handleSave: (raw: SaveTransactionPayload) => void;
  closeModal: () => void;
  deleteTransaction: (id: string, scope?: "single" | "allFuture") => void;
};

const TransactionsOutletUiContext = createContext<TransactionsOutletUiValue | null>(null);

/** Dock + modal de transação: tem de ficar dentro de `CardsProvider` (o modal usa `useCards`). */
export function TransactionsOutlet() {
  const ui = useContext(TransactionsOutletUiContext);
  if (!ui) {
    throw new Error("TransactionsOutlet must be used within TransactionsProvider");
  }
  return (
    <>
      <FloatingDock onAddClick={ui.openNew} />
      {ui.showModal ? (
        <TransactionModal
          key={ui.editingTx?.id ?? "new"}
          editing={ui.editingTx}
          expensePrefill={ui.modalExpensePrefill}
          onSave={ui.handleSave}
          onDelete={
            ui.editingTx
              ? (scope) => {
                  ui.deleteTransaction(ui.editingTx!.id, scope);
                  ui.closeModal();
                }
              : null
          }
          onClose={ui.closeModal}
        />
      ) : null}
    </>
  );
}

type TransactionsContextValue = {
  transactions: Transaction[];
  declaredCardInvoices: CardDeclaredInvoicesMap;
  openEdit: (tx: Transaction) => void;
  addTransaction: (tx: Omit<Transaction, "id">) => void;
  openNewExpenseWithPayment: (prefill: ExpenseModalPrefill) => void;
  stripCardFromTransactions: (cardId: string) => void;
  setDeclaredCardInvoice: (
    cardId: string,
    month: MonthCursor,
    entry: CardDeclaredInvoiceEntry | null,
  ) => void;
  clearDeclaredInvoicesForCard: (cardId: string) => void;
};

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) {
    throw new Error("useTransactions must be used within TransactionsProvider");
  }
  return ctx;
}

const persistedApp = loadPersistedAppState();
const initialDeclaredInvoices = loadCardDeclaredInvoices();
const initialTransactions = applyDeclaredInvoiceAdjustments(
  persistedApp.transactions,
  initialDeclaredInvoices,
);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactionsInner] = useState<Transaction[]>(() => initialTransactions);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>(() => persistedApp.rules);
  const [declaredCardInvoices, setDeclaredCardInvoices] = useState(() => initialDeclaredInvoices);
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [modalExpensePrefill, setModalExpensePrefill] = useState<ExpenseModalPrefill | null>(null);
  const rulesRef = useRef(recurringRules);
  rulesRef.current = recurringRules;

  const declaredCardInvoicesRef = useRef(declaredCardInvoices);
  declaredCardInvoicesRef.current = declaredCardInvoices;

  const setTransactions = useCallback((action: SetStateAction<Transaction[]>) => {
    setTransactionsInner((prev) => {
      const base = typeof action === "function" ? action(prev) : action;
      return applyDeclaredInvoiceAdjustments(base, declaredCardInvoicesRef.current);
    });
  }, []);

  useEffect(() => {
    declaredCardInvoicesRef.current = declaredCardInvoices;
    setTransactionsInner((prev) =>
      applyDeclaredInvoiceAdjustments(prev, declaredCardInvoices),
    );
  }, [declaredCardInvoices]);

  useEffect(() => {
    saveCardDeclaredInvoices(declaredCardInvoices);
  }, [declaredCardInvoices]);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveRecurringRules(recurringRules);
  }, [recurringRules]);

  useEffect(() => {
    setTransactions((txs) => {
      const more = buildMissingOccurrences(recurringRules, txs, todayISO());
      return more.length ? [...txs, ...more] : txs;
    });
  }, [recurringRules, setTransactions]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        setTransactions((txs) => {
          const more = buildMissingOccurrences(rulesRef.current, txs, todayISO());
          return more.length ? [...txs, ...more] : txs;
        });
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [setTransactions]);

  const clearDeclaredInvoicesForCard = useCallback((cardId: string) => {
    setDeclaredCardInvoices((prev) => {
      if (!prev[cardId]) return prev;
      const next = { ...prev };
      delete next[cardId];
      return next;
    });
  }, []);

  const setDeclaredCardInvoice = useCallback(
    (cardId: string, month: MonthCursor, entry: CardDeclaredInvoiceEntry | null) => {
      const ym = monthCursorToYm(month);
      setDeclaredCardInvoices((prev) => {
        const next = { ...prev };
        const cardMap = { ...(next[cardId] ?? {}) };
        if (entry === null) {
          delete cardMap[ym];
        } else {
          cardMap[ym] = entry;
        }
        if (Object.keys(cardMap).length === 0) delete next[cardId];
        else next[cardId] = cardMap;
        return next;
      });
    },
    [],
  );

  const openNew = useCallback(() => {
    setEditingTx(null);
    setModalExpensePrefill(null);
    setShowModal(true);
  }, []);

  const openNewExpenseWithPayment = useCallback((prefill: ExpenseModalPrefill) => {
    setEditingTx(null);
    setModalExpensePrefill(prefill);
    setShowModal(true);
  }, []);

  const stripCardFromTransactions = useCallback(
    (cardId: string) => {
      clearDeclaredInvoicesForCard(cardId);
      setTransactions((prev) =>
        prev
          .filter((t) => !(t.cardInvoiceAdjustment && t.cardId === cardId))
          .map((t) =>
            t.cardId === cardId ? { ...t, paymentMethod: "pix" as const, cardId: undefined } : t,
          ),
      );
    },
    [clearDeclaredInvoicesForCard, setTransactions],
  );

  const openEdit = useCallback((tx: Transaction) => {
    const canonical = transactions.find((t) => t.id === tx.id) ?? tx;
    setModalExpensePrefill(null);
    setEditingTx(canonical);
    setShowModal(true);
  }, [transactions]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingTx(null);
    setModalExpensePrefill(null);
  }, []);

  const addTransaction = useCallback(
    (tx: Omit<Transaction, "id">) => {
      setTransactions((prev) => [...prev, { ...tx, id: uid() }]);
    },
    [setTransactions],
  );

  const updateTransaction = useCallback(
    (tx: Transaction) => {
      const { _fromFixed: _, ...clean } = tx;
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id !== clean.id) return t;
          const merged: Transaction = { ...clean };
          if (t.cardInvoiceAdjustment) merged.cardInvoiceAdjustment = true;
          return merged;
        }),
      );
    },
    [setTransactions],
  );

  const deleteTransaction = useCallback(
    (id: string, scope: "single" | "allFuture" = "single") => {
      let clearDecl: { cardId: string; ym: string } | null = null;
      setTransactions((prev) => {
        const t = prev.find((x) => x.id === id);
        if (!t) return prev;
        if (t.cardInvoiceAdjustment && t.cardId && scope === "single") {
          clearDecl = { cardId: t.cardId, ym: t.date.slice(0, 7) };
        }
        if (t.recurrenceRuleId) {
          const ruleId = t.recurrenceRuleId;
          const deletedYm = t.date.slice(0, 7);
          if (scope === "allFuture") {
            const endAfter = addCalendarMonths(deletedYm, -1);
            setRecurringRules((rules) =>
              rules.map((r) =>
                r.id === ruleId ? { ...r, active: false, endAfterMonth: endAfter } : r,
              ),
            );
            return prev.filter(
              (x) => !(x.recurrenceRuleId === ruleId && x.date.slice(0, 7) >= deletedYm),
            );
          }
          setRecurringRules((rules) =>
            rules.map((r) =>
              r.id === ruleId
                ? {
                    ...r,
                    excludedMonths: r.excludedMonths.includes(deletedYm)
                      ? r.excludedMonths
                      : [...r.excludedMonths, deletedYm],
                  }
                : r,
            ),
          );
        }
        return prev.filter((x) => x.id !== id);
      });
      if (clearDecl) {
        const { cardId, ym } = clearDecl;
        setDeclaredCardInvoices((decl) => {
          const next = { ...decl };
          const cm = { ...(next[cardId] ?? {}) };
          delete cm[ym];
          if (Object.keys(cm).length === 0) delete next[cardId];
          else next[cardId] = cm;
          return next;
        });
      }
    },
    [setTransactions],
  );

  const handleSave = useCallback(
    (raw: SaveTransactionPayload) => {
      const {
        isNewRecurring,
        endRecurrence,
        id,
        dateChangeScope,
        previousDate,
        previousAmount,
        ...data
      } = raw;

      if (isNewRecurring && !id) {
        const ruleId = uid();
        const rule = newRecurringRuleFromForm(
          {
            type: data.type,
            date: data.date,
            description: data.description,
            category: data.category,
            amount: data.amount,
            paid: data.paid,
            ...(data.type === "expense"
              ? {
                  paymentMethod: data.paymentMethod,
                  cardId: data.cardId,
                }
              : {}),
          },
          ruleId,
        );
        setRecurringRules((r) => [...r, rule]);
        const txBase: Omit<Transaction, "id"> = {
          ...data,
          fixed: false,
          recurrenceRuleId: ruleId,
        };
        if (data.type !== "expense") {
          delete (txBase as Partial<Transaction>).paymentMethod;
          delete (txBase as Partial<Transaction>).cardId;
        }
        setTransactions((t) => [...t, { ...txBase, id: uid() }]);
        closeModal();
        return;
      }

      if (id) {
        if (endRecurrence && data.recurrenceRuleId) {
          const ruleId = data.recurrenceRuleId;
          const lastYm = data.date.slice(0, 7);
          setRecurringRules((rules) =>
            rules.map((r) =>
              r.id === ruleId ? { ...r, active: false, endAfterMonth: lastYm } : r,
            ),
          );
          setTransactions((prev) => {
            const pruned = prev.filter((t) => {
              if (t.recurrenceRuleId !== ruleId) return true;
              if (t.id === id) return true;
              return t.date.slice(0, 7) <= lastYm;
            });
            const finalTx: Transaction = {
              id,
              type: data.type,
              description: data.description,
              amount: data.amount,
              date: data.date,
              category: data.category,
              fixed: data.fixed,
              paid: data.paid,
              recurrenceRuleId: ruleId,
              ...(data.type === "expense"
                ? {
                    paymentMethod: data.paymentMethod === "card" ? ("card" as const) : ("pix" as const),
                    cardId:
                      data.paymentMethod === "card" && data.cardId ? data.cardId : undefined,
                  }
                : {}),
            };
            return pruned.map((t) => (t.id === id ? finalTx : t));
          });
          closeModal();
          return;
        }

        if (data.recurrenceRuleId) {
          const nextDesc = data.description.trim();
          setRecurringRules((rules) =>
            rules.map((r) =>
              r.id === data.recurrenceRuleId ? { ...r, description: nextDesc } : r,
            ),
          );
          setTransactions((prev) =>
            prev.map((t) =>
              t.recurrenceRuleId === data.recurrenceRuleId ? { ...t, description: nextDesc } : t,
            ),
          );
        }

        if (
          data.recurrenceRuleId &&
          dateChangeScope &&
          previousDate &&
          (dateChangeScope === "single" || dateChangeScope === "allFuture")
        ) {
          const paymentOnly =
            data.type === "expense" &&
            data.date === previousDate &&
            previousAmount !== undefined &&
            Math.abs(data.amount - previousAmount) < 0.000_01;

          if (dateChangeScope === "single") {
            const prevYm = previousDate.slice(0, 7);
            const newYm = data.date.slice(0, 7);
            if (prevYm !== newYm) {
              setRecurringRules((rules) =>
                rules.map((r) =>
                  r.id === data.recurrenceRuleId
                    ? {
                        ...r,
                        excludedMonths: r.excludedMonths.includes(prevYm)
                          ? r.excludedMonths
                          : [...r.excludedMonths, prevYm],
                      }
                    : r,
                ),
              );
            }
            const tx: Transaction = {
              ...data,
              id,
              fixed: false,
            };
            updateTransaction(tx);
          } else if (paymentOnly) {
            const pm = (data.paymentMethod === "card" ? "card" : "pix") as PaymentMethod;
            const cid =
              data.paymentMethod === "card" && data.cardId ? data.cardId : undefined;
            setRecurringRules((rules) =>
              rules.map((r) =>
                r.id === data.recurrenceRuleId
                  ? { ...r, defaultPaymentMethod: pm, defaultCardId: cid }
                  : r,
              ),
            );
            setTransactions((prev) =>
              prev.map((t) => {
                if (t.recurrenceRuleId !== data.recurrenceRuleId) return t;
                if (t.date < previousDate) return t;
                return {
                  ...t,
                  paymentMethod: pm,
                  cardId: cid,
                };
              }),
            );
          } else {
            const newDay = dayOfMonthFromIso(data.date);
            const expenseRulePatch =
              data.type === "expense"
                ? {
                    defaultPaymentMethod: (data.paymentMethod === "card" ? "card" : "pix") as PaymentMethod,
                    defaultCardId:
                      data.paymentMethod === "card" && data.cardId ? data.cardId : undefined,
                  }
                : {};
            setRecurringRules((rules) =>
              rules.map((r) =>
                r.id === data.recurrenceRuleId
                  ? {
                      ...r,
                      dayOfMonth: newDay,
                      defaultAmount: data.amount,
                      description: data.description,
                      category: data.category,
                      defaultPaid: data.type === "income" ? true : data.paid,
                      ...expenseRulePatch,
                    }
                  : r,
              ),
            );
            setTransactions((prev) =>
              prev.map((t) => {
                if (t.recurrenceRuleId !== data.recurrenceRuleId) return t;
                if (t.date < previousDate) return t;
                const ym = t.date.slice(0, 7);
                const payPatch =
                  data.type === "expense"
                    ? {
                        paymentMethod: (data.paymentMethod === "card" ? "card" : "pix") as PaymentMethod,
                        cardId:
                          data.paymentMethod === "card" && data.cardId ? data.cardId : undefined,
                      }
                    : {};
                return {
                  ...t,
                  date: isoDateInMonth(ym, newDay),
                  amount: data.amount,
                  description: data.description,
                  category: data.category,
                  paid: data.type === "income" ? true : data.paid,
                  ...payPatch,
                };
              }),
            );
          }
          closeModal();
          return;
        }

        const tx: Transaction = { ...data, id };
        updateTransaction(tx);
      } else {
        addTransaction(data);
      }
      closeModal();
    },
    [addTransaction, updateTransaction, closeModal, setTransactions],
  );

  const value = useMemo(
    () => ({
      transactions,
      declaredCardInvoices,
      openEdit,
      addTransaction,
      openNewExpenseWithPayment,
      stripCardFromTransactions,
      setDeclaredCardInvoice,
      clearDeclaredInvoicesForCard,
    }),
    [
      transactions,
      declaredCardInvoices,
      openEdit,
      addTransaction,
      openNewExpenseWithPayment,
      stripCardFromTransactions,
      setDeclaredCardInvoice,
      clearDeclaredInvoicesForCard,
    ],
  );

  const outletUi = useMemo(
    (): TransactionsOutletUiValue => ({
      openNew,
      showModal,
      editingTx,
      modalExpensePrefill,
      handleSave,
      closeModal,
      deleteTransaction,
    }),
    [
      openNew,
      showModal,
      editingTx,
      modalExpensePrefill,
      handleSave,
      closeModal,
      deleteTransaction,
    ],
  );

  return (
    <TransactionsOutletUiContext.Provider value={outletUi}>
      <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>
    </TransactionsOutletUiContext.Provider>
  );
}
