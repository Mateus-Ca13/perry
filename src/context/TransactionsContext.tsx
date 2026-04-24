import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { FloatingDock } from "../components/FloatingDock";
import { TransactionModal } from "../components/TransactionModal";
import type { Transaction } from "../types";
import { uid } from "../utils/id";
import { loadTransactions, saveTransactions } from "../utils/storage";

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

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

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

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleSave = useCallback(
    (payload: Omit<Transaction, "id"> & { id?: string }) => {
      if (payload.id) {
        updateTransaction(payload as Transaction);
      } else {
        addTransaction(payload);
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
              ? () => {
                  deleteTransaction(editingTx.id);
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
