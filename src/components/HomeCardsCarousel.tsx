import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import type { CardBankId, MonthCursor, PaymentCard, Transaction } from "../types";
import { bankPresetById } from "../data/cardBanks";
import { sumCardInvoiceFutureInMonth, sumCardInvoiceInMonth } from "../utils/monthComputation";
import { fmt } from "../utils/format";
import { BankLogoMark } from "./BankLogoMark";
import { CardHomeTapDialog } from "./CardHomeTapDialog";

const CARD_FACE_GRADIENT: Record<CardBankId, string> = {
  nubank: "linear-gradient(148deg, #4a0674 0%, #820ad1 45%, #b04ef0 100%)",
  mercado_pago: "linear-gradient(148deg, #005a8c 0%, #009ee3 46%, #4ec8f5 100%)",
  picpay: "linear-gradient(148deg, #0b6e38 0%, #21c25e 46%, #4fe085 100%)",
};

const TAP_CANCEL_PX2 = 12 * 12;

/** Cartão do carrossel: abre escolha (despesa ou fatura); ignora toque após arrasto. */
function CarouselCardFace({
  card,
  displayName,
  fatura,
  futuros,
  totalMes,
  onOpen,
}: {
  card: PaymentCard;
  displayName: string;
  fatura: number;
  futuros: number;
  totalMes: number;
  onOpen: () => void;
}) {
  const tapRef = useRef<{ x: number; y: number } | null>(null);
  const cancelTapRef = useRef(false);

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    tapRef.current = { x: e.clientX, y: e.clientY };
    cancelTapRef.current = false;
  }, []);

  const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const s = tapRef.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (dx * dx + dy * dy > TAP_CANCEL_PX2) cancelTapRef.current = true;
  }, []);

  const onPointerUp = useCallback(() => {
    tapRef.current = null;
  }, []);

  const onClick = useCallback(() => {
    if (cancelTapRef.current) {
      cancelTapRef.current = false;
      return;
    }
    onOpen();
  }, [onOpen]);

  return (
    <div
      role="button"
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="relative w-full max-w-full cursor-pointer overflow-hidden rounded-2xl text-left shadow-lg outline-none active:scale-[0.99] active:opacity-95 transition-[transform,opacity] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--app-accent)] focus-visible:ring-offset-[var(--app-page)]"
      style={{
        aspectRatio: "1.586",
        background: CARD_FACE_GRADIENT[card.bankId],
        boxShadow: "0 10px 28px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.22)",
        touchAction: "manipulation",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          background:
            "linear-gradient(125deg, rgba(255,255,255,0.55) 0%, transparent 38%, transparent 62%, rgba(0,0,0,0.08) 100%)",
        }}
      />
      <div className="pointer-events-none absolute -right-6 -top-6 flex opacity-40">
        <span className="h-16 w-16 rounded-full bg-white" style={{ marginRight: -14 }} />
        <span className="h-16 w-16 rounded-full bg-white" />
      </div>

      <div className="relative z-10 flex h-full min-h-0 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div
            aria-hidden
            className="h-9 w-11 shrink-0 rounded-md shadow-md"
            style={{
              background: "linear-gradient(135deg, #f5e6a8 0%, #d4a934 42%, #8a6a1d 100%)",
            }}
          />
          <div className="rounded-xl bg-white/22 p-0.5 shadow-sm backdrop-blur-sm">
            <BankLogoMark bankId={card.bankId} size="sm" />
          </div>
        </div>

        <div className="mt-auto flex min-w-0 flex-col gap-3 pt-2">
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.78)" }}
            >
              Fatura atual
            </p>
            <p
              className="text-2xl font-bold tabular-nums tracking-tight text-white"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.18)" }}
            >
              {fmt(fatura)}
            </p>
            {futuros > 0 ? (
              <p
                className="mt-1.5 text-[11px] font-medium tabular-nums leading-snug"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                Futuros no mês · {fmt(futuros)}
              </p>
            ) : null}
            <p
              className="mt-1 text-[11px] font-semibold tabular-nums leading-snug"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              Total do mês · {fmt(totalMes)}
            </p>
          </div>
          <p
            className="min-w-0 border-t pt-3 text-lg font-bold uppercase leading-snug tracking-wide text-white"
            style={{
              borderColor: "rgba(255,255,255,0.28)",
              textShadow: "0 1px 2px rgba(0,0,0,0.2)",
            }}
          >
            <span className="line-clamp-2">{displayName}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

type Props = {
  cards: PaymentCard[];
  transactions: Transaction[];
  currentMonth: MonthCursor;
  onOpenExpenseForCard: (cardId: string) => void;
};

export function HomeCardsCarousel({
  cards,
  transactions,
  currentMonth,
  onOpenExpenseForCard,
}: Props) {
  const [choice, setChoice] = useState<{ card: PaymentCard; displayName: string } | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => {
    return cards.map((c) => {
      const preset = bankPresetById(c.bankId);
      const displayName = c.label || preset?.label || c.bankId;
      const fatura = sumCardInvoiceInMonth(transactions, c.id, currentMonth);
      const futuros = sumCardInvoiceFutureInMonth(transactions, c.id, currentMonth);
      const totalMes = fatura + futuros;
      return {
        card: c,
        displayName,
        fatura,
        futuros,
        totalMes,
      };
    });
  }, [cards, transactions, currentMonth]);

  const carouselSlideCount = cards.length > 0 ? items.length + 1 : 0;

  useEffect(() => {
    setSlideIndex(0);
    const el = trackRef.current;
    if (el) el.scrollTo({ left: 0 });
  }, [cards.length, currentMonth.year, currentMonth.month]);

  const updateIndexFromScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el || carouselSlideCount <= 0) return;
    const w = el.clientWidth;
    if (w <= 0) return;
    const i = Math.round(el.scrollLeft / w);
    setSlideIndex(Math.min(Math.max(0, i), carouselSlideCount - 1));
  }, [carouselSlideCount]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateIndexFromScroll();
    el.addEventListener("scroll", updateIndexFromScroll, { passive: true });
    const ro = new ResizeObserver(updateIndexFromScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateIndexFromScroll);
      ro.disconnect();
    };
  }, [updateIndexFromScroll, carouselSlideCount]);

  if (cards.length === 0) {
    return (
      <div className="mt-4">
        <div className="px-5 flex items-center justify-between gap-2 mb-2">
          <h3 className="text-md font-semibold" style={{ color: "var(--app-muted)" }}>
            Cartões
          </h3>
        </div>
        <div className="px-5">
          <Link
            to="/cartoes"
            className="relative flex w-full max-w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 text-center outline-none active:scale-[0.99] active:opacity-95 transition-[transform,opacity] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--app-accent)] focus-visible:ring-offset-[var(--app-page)]"
            style={{
              aspectRatio: "1.586",
              backgroundColor: "var(--app-card)",
              boxShadow: "0 10px 28px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.22)",
            }}
          >
            <Plus className="w-10 h-10 shrink-0 sm:w-12 sm:h-12" strokeWidth={1.5} style={{ color: "var(--app-handlebar)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--app-muted)" }}>
              Adicionar cartão
            </p>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="px-5 flex items-center justify-between gap-2 mb-2">
        <h3 className="text-md font-semibold" style={{ color: "var(--app-muted)" }}>
          Cartões
        </h3>
        {carouselSlideCount > 1 ? (
          <div className="flex gap-1.5 shrink-0" aria-hidden>
            {Array.from({ length: carouselSlideCount }, (_, i) => (
              <span
                key={i}
                className="block rounded-full transition-all"
                style={{
                  width: i === slideIndex ? 14 : 6,
                  height: 6,
                  backgroundColor:
                    i === slideIndex ? "var(--app-accent)" : "var(--app-border)",
                }}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div
        ref={trackRef}
        className="home-cards-track flex w-full min-w-0 overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-x pan-y pinch-zoom",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {items.map(({ card, displayName, fatura, futuros, totalMes }) => {
          return (
            <div
              key={card.id}
              className="w-full shrink-0 snap-center snap-always box-border px-5"
              style={{
                flex: "0 0 100%",
                scrollSnapAlign: "center",
                scrollSnapStop: "always",
              }}
            >
              <CarouselCardFace
                card={card}
                displayName={displayName}
                fatura={fatura}
                futuros={futuros}
                totalMes={totalMes}
                onOpen={() => setChoice({ card, displayName })}
              />
            </div>
          );
        })}
        <div
          className="w-full shrink-0 snap-center snap-always box-border px-5"
          style={{
            flex: "0 0 100%",
            scrollSnapAlign: "center",
            scrollSnapStop: "always",
          }}
        >
          <Link
            to="/cartoes"
            className="relative flex w-full max-w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 text-center outline-none active:scale-[0.99] active:opacity-95 transition-[transform,opacity] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--app-accent)] focus-visible:ring-offset-[var(--app-page)]"
            style={{
              aspectRatio: "1.586",
              backgroundColor: "var(--app-card)",
              boxShadow: "0 10px 28px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.22)",
            }}
          >
            <Plus className="w-10 h-10 shrink-0 sm:w-12 sm:h-12" strokeWidth={1.5} style={{ color: "var(--app-handlebar)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--app-muted)" }}>
              Adicionar cartão
            </p>
          </Link>
        </div>
      </div>

      <style>{`
        .home-cards-track::-webkit-scrollbar { display: none; }
      `}</style>

      {choice ? (
        <CardHomeTapDialog
          card={choice.card}
          displayName={choice.displayName}
          currentMonth={currentMonth}
          onClose={() => setChoice(null)}
          onAddExpense={() => {
            const id = choice.card.id;
            setChoice(null);
            queueMicrotask(() => onOpenExpenseForCard(id));
          }}
        />
      ) : null}
    </div>
  );
}
