import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { FloatingDock } from "../components/FloatingDock";
import { TransactionModal } from "../components/TransactionModal";
import type { RecurringRule, SaveTransactionPayload, Transaction } from "../types";
import { todayISO } from "../utils/format";
import {
  addCalendarMonths,
  buildMissingOccurrences,
  dayOfMonthFromIso,
  isoDateInMonth,
  newRecurringRuleFromForm,
} from "../utils/recurringMaterialize";
import { uid } from "../utils/id";
import {
  loadPersistedAppState,
  saveRecurringRules,
  saveTransactions,
} from "../utils/storage";

type TransactionsContextValue = {
  transactions: Transaction[];
  openEdit: (tx: Transaction) => void;
  addTransaction: (tx: Omit<Transaction, "id">) => void;
};

const TransactionsContext = createContext<TransactionsContextValue | null>(null);

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) {
    throw new Error("useTransactions must be used within TransactionsProvider");
  }
  return ctx;
}

const initial = loadPersistedAppState();

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(initial.transactions);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>(initial.rules);
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const rulesRef = useRef(recurringRules);
  rulesRef.current = recurringRules;

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
  }, [recurringRules]);

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
  }, []);

  const openNew = useCallback(() => {
    setEditingTx(null);
    setShowModal(true);
  }, []);

  const openEdit = useCallback((tx: Transaction) => {
    const canonical = transactions.find((t) => t.id === tx.id) ?? tx;
    setEditingTx(canonical);
    setShowModal(true);
  }, [transactions]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingTx(null);
  }, []);

  const addTransaction = useCallback((tx: Omit<Transaction, "id">) => {
    setTransactions((prev) => [...prev, { ...tx, id: uid() }]);
  }, []);

  const updateTransaction = useCallback((tx: Transaction) => {
    const { _fromFixed: _, ...clean } = tx;
    setTransactions((prev) => prev.map((t) => (t.id === clean.id ? clean : t)));
  }, []);

  const deleteTransaction = useCallback(
    (id: string, scope: "single" | "allFuture" = "single") => {
      setTransactions((prev) => {
        const t = prev.find((x) => x.id === id);
        if (!t) return prev;
        if (t.recurrenceRuleId) {
          const ruleId = t.recurrenceRuleId;
          const deletedYm = t.date.slice(0, 7);
          if (scope === "allFuture") {
            const endAfter = addCalendarMonths(deletedYm, -1);
            setRecurringRules((rules) =>
              rules.map((r) =>
                r.id === ruleId
                  ? { ...r, active: false, endAfterMonth: endAfter }
                  : r,
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
    },
    [],
  );

  const handleSave = useCallback(
    (raw: SaveTransactionPayload) => {
      const {
        isNewRecurring,
        endRecurrence,
        id,
        dateChangeScope,
        previousDate,
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
          },
          ruleId,
        );
        setRecurringRules((r) => [...r, rule]);
        setTransactions((t) => [
          ...t,
          { ...data, id: uid(), fixed: false, recurrenceRuleId: ruleId },
        ]);
        closeModal();
        return;
      }

      if (id) {
        if (endRecurrence && data.recurrenceRuleId) {
          const ruleId = data.recurrenceRuleId;
          const lastYm = data.date.slice(0, 7);
          setRecurringRules((rules) =>
            rules.map((r) =>
              r.id === ruleId
                ? { ...r, active: false, endAfterMonth: lastYm }
                : r,
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
              r.id === data.recurrenceRuleId
                ? { ...r, description: nextDesc }
                : r,
            ),
          );
          setTransactions((prev) =>
            prev.map((t) =>
              t.recurrenceRuleId === data.recurrenceRuleId
                ? { ...t, description: nextDesc }
                : t,
            ),
          );
        }

        if (
          data.recurrenceRuleId &&
          dateChangeScope &&
          previousDate &&
          (dateChangeScope === "single" || dateChangeScope === "allFuture")
        ) {
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
          } else {
            const newDay = dayOfMonthFromIso(data.date);
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
                    }
                  : r,
              ),
            );
            setTransactions((prev) =>
              prev.map((t) => {
                if (t.recurrenceRuleId !== data.recurrenceRuleId) return t;
                if (t.date < previousDate) return t;
                const ym = t.date.slice(0, 7);
                return {
                  ...t,
                  date: isoDateInMonth(ym, newDay),
                  amount: data.amount,
                  description: data.description,
                  category: data.category,
                  paid: data.type === "income" ? true : data.paid,
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
    [addTransaction, updateTransaction, closeModal],
  );

  const value = useMemo(
    () => ({
      transactions,
      openEdit,
      addTransaction,
    }),
    [transactions, openEdit, addTransaction],
  );

  return (
    <TransactionsContext.Provider value={value}>
      {children}
      <FloatingDock onAddClick={openNew} />
      {showModal ? (
        <TransactionModal
          editing={editingTx}
          onSave={handleSave}
          onDelete={
            editingTx
              ? (scope) => {
                  deleteTransaction(editingTx.id, scope);
                  closeModal();
                }
              : null
          }
          onClose={closeModal}
        />
      ) : null}
    </TransactionsContext.Provider>
  );
}
