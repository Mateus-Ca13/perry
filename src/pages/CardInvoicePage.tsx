import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronRight, CircleCheck } from "lucide-react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { BankLogoMark } from "../components/BankLogoMark";
import { PayCardInvoiceConfirmDialog } from "../components/PayCardInvoiceConfirmDialog";
import { SubPageLayout } from "../components/SubPageLayout";
import { TransactionRow } from "../components/TransactionRow";
import { useCards } from "../context/CardsContext";
import { useTransactions } from "../context/TransactionsContext";
import type { CardBankId, MonthCursor, Transaction } from "../types";
import { bankPresetById } from "../data/cardBanks";
import { fmt, todayISO } from "../utils/format";
import {
  expenseUsesCard,
  monthCursorToYm,
  nowMonthCursor,
  sumCardInvoiceFutureInMonth,
  sumCardInvoiceInMonth,
} from "../utils/monthComputation";

const CARD_FACE_GRADIENT: Record<CardBankId, string> = {
  nubank: "linear-gradient(148deg, #4a0674 0%, #820ad1 45%, #b04ef0 100%)",
  mercado_pago: "linear-gradient(148deg, #005a8c 0%, #009ee3 46%, #4ec8f5 100%)",
  picpay: "linear-gradient(148deg, #0b6e38 0%, #21c25e 46%, #4fe085 100%)",
};

const PREVIEW_LIMIT = 10;

function formatMonthTitle(c: MonthCursor): string {
  const raw = new Date(c.year, c.month, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      className="text-[11px] font-bold uppercase tracking-[0.14em] mb-2 px-0.5"
      style={{ color: "var(--app-muted)" }}
    >
      {children}
    </h2>
  );
}

export function CardInvoicePage() {
  const { cardId } = useParams<{ cardId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { cards } = useCards();
  const {
    transactions,
    payCardInvoiceInMonth,
    openEdit,
  } = useTransactions();
  const today = todayISO();

  const initialMonth =
    (location.state as { month?: MonthCursor } | null)?.month ?? nowMonthCursor();
  const [currentMonth, setCurrentMonth] = useState<MonthCursor>(initialMonth);

  useEffect(() => {
    const s = (location.state as { month?: MonthCursor } | null)?.month;
    setCurrentMonth(s ?? nowMonthCursor());
  }, [cardId, location.state]);

  const card = useMemo(
    () => (cardId ? cards.find((c) => c.id === cardId) : undefined),
    [cards, cardId],
  );

  const ym = useMemo(() => monthCursorToYm(currentMonth), [currentMonth]);
  const displayName = card
    ? card.label || bankPresetById(card.bankId)?.label || card.bankId
    : "";

  const invoiceTotal = useMemo(
    () => (card ? sumCardInvoiceInMonth(transactions, card.id, currentMonth, today) : 0),
    [transactions, card, currentMonth, today],
  );

  const futureInvoiceTotal = useMemo(
    () => (card ? sumCardInvoiceFutureInMonth(transactions, card.id, currentMonth, today) : 0),
    [transactions, card, currentMonth, today],
  );
  const totalInvoiceMonth = useMemo(
    () => invoiceTotal + futureInvoiceTotal,
    [invoiceTotal, futureInvoiceTotal],
  );

  const unpaidCardExpenseCount = useMemo(() => {
    if (!card) return 0;
    return transactions.filter(
      (t) =>
        t.type === "expense" &&
        expenseUsesCard(t) &&
        t.cardId === card.id &&
        t.date.startsWith(ym) &&
        t.date <= today &&
        !t.paid,
    ).length;
  }, [transactions, card, ym, today]);

  const previewTransactions = useMemo((): Transaction[] => {
    if (!card) return [];
    return transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          expenseUsesCard(t) &&
          t.cardId === card.id &&
          t.date.startsWith(ym) &&
          t.date <= today,
      )
      .sort((a, b) =>
        b.date !== a.date ? b.date.localeCompare(a.date) : b.id.localeCompare(a.id),
      )
      .slice(0, PREVIEW_LIMIT);
  }, [transactions, card, ym, today]);

  const futurePreviewTransactions = useMemo((): Transaction[] => {
    if (!card) return [];
    return transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          expenseUsesCard(t) &&
          t.cardId === card.id &&
          t.date.startsWith(ym) &&
          t.date > today,
      )
      .sort((a, b) =>
        a.date !== b.date ? a.date.localeCompare(b.date) : a.id.localeCompare(b.id),
      )
      .slice(0, PREVIEW_LIMIT);
  }, [transactions, card, ym, today]);

  const totalMonthCount = useMemo(() => {
    if (!card) return 0;
    return transactions.filter(
      (t) =>
        t.type === "expense" &&
        expenseUsesCard(t) &&
        t.cardId === card.id &&
        t.date.startsWith(ym),
    ).length;
  }, [transactions, card, ym]);

  const [payConfirmOpen, setPayConfirmOpen] = useState(false);

  const goInvoiceList = useCallback(() => {
    if (!card) return;
    navigate(`/despesas?cartao=${card.id}`, { state: { month: currentMonth } });
  }, [navigate, card, currentMonth]);

  const runPayInvoice = useCallback(() => {
    if (!card || unpaidCardExpenseCount <= 0) return;
    payCardInvoiceInMonth(card.id, currentMonth);
  }, [card, unpaidCardExpenseCount, payCardInvoiceInMonth, currentMonth]);

  const prevMonth = useCallback(() => {
    setCurrentMonth((p) => {
      if (p.month === 0) return { year: p.year - 1, month: 11 };
      return { ...p, month: p.month - 1 };
    });
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentMonth((p) => {
      if (p.month === 11) return { year: p.year + 1, month: 0 };
      return { ...p, month: p.month + 1 };
    });
  }, []);

  if (!cardId || !card) {
    return <Navigate to="/cartoes" replace />;
  }

  const bankId = card.bankId;

  return (
    <SubPageLayout
      title={displayName}
      currentMonth={currentMonth}
      onPrevMonth={prevMonth}
      onNextMonth={nextMonth}
    >
      {/* Hero — fatura editável */}
      <div
        className="rounded-2xl overflow-hidden mb-5 relative text-white"
        style={{
          background: CARD_FACE_GRADIENT[bankId],
          boxShadow: "0 14px 36px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.22)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.32]"
          style={{
            background:
              "linear-gradient(125deg, rgba(255,255,255,0.5) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.12) 100%)",
          }}
        />
        <div className="relative z-10 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest opacity-85">
                Fatura · {formatMonthTitle(currentMonth)}
              </p>
              <p
                className="text-[11px] mt-1 opacity-80 tabular-nums"
                style={{ letterSpacing: "0.02em" }}
              >
                {ym}
              </p>
            </div>
            <div className="rounded-xl bg-white/22 p-1 shadow-md backdrop-blur-sm">
              <BankLogoMark bankId={bankId} size="md" />
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-medium opacity-80 mb-2">Total da fatura</p>
            <p
              className="text-3xl sm:text-[2rem] font-bold tabular-nums tracking-tight"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
            >
              {fmt(invoiceTotal)}
            </p>
            <p
              className="mt-2 text-sm font-medium tabular-nums opacity-80"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.12)" }}
            >
              Até hoje: {fmt(invoiceTotal)}
            </p>
            {futureInvoiceTotal > 0 ? (
              <p
                className="mt-1 text-sm font-medium tabular-nums opacity-75"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.12)" }}
              >
                Futuros no mês: {fmt(futureInvoiceTotal)}
              </p>
            ) : null}
            <p
              className="mt-1 text-sm font-semibold tabular-nums opacity-90"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.12)" }}
            >
              Total destinado no mês: {fmt(totalInvoiceMonth)}
            </p>
          </div>
        </div>
      </div>

      {/* Lançamentos já entrados */}
      <SectionTitle>Neste cartão · até hoje</SectionTitle>
      <div
        className="rounded-2xl overflow-hidden mb-3"
        style={{
          backgroundColor: "var(--app-card)",
          boxShadow: "var(--app-card-shadow)",
        }}
      >
        {previewTransactions.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm" style={{ color: "var(--app-muted)" }}>
            Nenhum lançamento neste cartão neste mês.
          </p>
        ) : (
          previewTransactions.map((tx, i) => (
            <TransactionRow
              key={tx.id}
              tx={tx}
              isLast={i === previewTransactions.length - 1}
              showDayOnMeta
              onTap={() => openEdit(tx)}
            />
          ))
        )}
      </div>

      {futurePreviewTransactions.length > 0 ? (
        <>
          <SectionTitle>Próximos lançamentos do mês</SectionTitle>
          <div
            className="rounded-2xl overflow-hidden mb-3"
            style={{
              backgroundColor: "var(--app-card)",
              boxShadow: "var(--app-card-shadow)",
            }}
          >
            {futurePreviewTransactions.map((tx, i) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                isLast={i === futurePreviewTransactions.length - 1}
                showDayOnMeta
                onTap={() => openEdit(tx)}
              />
            ))}
          </div>
        </>
      ) : null}

      <button
        type="button"
        onClick={goInvoiceList}
        className="w-full mb-6 flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl text-left active:scale-[0.99] outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-page)] transition-[transform,box-shadow]"
        style={{
          backgroundColor: "color-mix(in srgb, var(--app-accent) 16%, var(--app-card))",
          boxShadow: "var(--app-card-shadow)",
          border: "1px solid color-mix(in srgb, var(--app-accent) 26%, transparent)",
        }}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-snug" style={{ color: "var(--app-text)" }}>
            Ver todos os lançamentos deste cartão
            {totalMonthCount > PREVIEW_LIMIT ? (
              <span className="tabular-nums font-semibold opacity-80"> · {totalMonthCount}</span>
            ) : null}
          </p>
          <p className="text-[11px] mt-1 font-medium leading-snug" style={{ color: "var(--app-muted)" }}>
            Lista completa em Despesas, só deste cartão e deste mês
          </p>
        </div>
        <div
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: "color-mix(in srgb, var(--app-accent) 38%, transparent)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)",
          }}
        >
          <ChevronRight className="w-5 h-5 shrink-0" strokeWidth={2.5} style={{ color: "var(--app-accent)" }} />
        </div>
      </button>

      {unpaidCardExpenseCount > 0 ? (
        <>
          <SectionTitle>Quitar</SectionTitle>
          <button
            type="button"
            onClick={() => setPayConfirmOpen(true)}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 text-white active:scale-[0.99] shadow-md mb-2"
            style={{
              backgroundColor: "#34C759",
              boxShadow: "0 8px 24px rgba(52, 199, 89, 0.3)",
            }}
          >
            <CircleCheck className="w-[18px] h-[18px] shrink-0" strokeWidth={2.5} />
            Pagar fatura — {unpaidCardExpenseCount}{" "}
            {unpaidCardExpenseCount === 1 ? "pendente" : "pendentes"}
          </button>
        </>
      ) : null}

      {payConfirmOpen ? (
        <PayCardInvoiceConfirmDialog
          pendingCount={unpaidCardExpenseCount}
          monthLabel={formatMonthTitle(currentMonth)}
          onClose={() => setPayConfirmOpen(false)}
          onConfirm={runPayInvoice}
        />
      ) : null}
    </SubPageLayout>
  );
}
