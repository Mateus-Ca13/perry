import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CardBankId, PaymentCard } from "../types";
import { useTransactions } from "./TransactionsContext";
import { uid } from "../utils/id";
import { loadPaymentCards, savePaymentCards } from "../utils/storage";

type CardsContextValue = {
  cards: PaymentCard[];
  addCard: (bankId: CardBankId, label: string) => void;
  removeCard: (id: string) => void;
};

const CardsContext = createContext<CardsContextValue | null>(null);

export function useCards() {
  const ctx = useContext(CardsContext);
  if (!ctx) {
    throw new Error("useCards must be used within CardsProvider");
  }
  return ctx;
}

export function CardsProvider({ children }: { children: ReactNode }) {
  const { stripCardFromTransactions } = useTransactions();
  const [cards, setCards] = useState<PaymentCard[]>(() => loadPaymentCards());

  useEffect(() => {
    savePaymentCards(cards);
  }, [cards]);

  const addCard = useCallback((bankId: CardBankId, label: string) => {
    setCards((c) => [...c, { id: uid(), bankId, label: label.trim() }]);
  }, []);

  const removeCard = useCallback(
    (id: string) => {
      stripCardFromTransactions(id);
      setCards((c) => c.filter((x) => x.id !== id));
    },
    [stripCardFromTransactions],
  );

  const value = useMemo(
    () => ({
      cards,
      addCard,
      removeCard,
    }),
    [cards, addCard, removeCard],
  );

  return <CardsContext.Provider value={value}>{children}</CardsContext.Provider>;
}
