import type { CardBankId, PaymentCard, Transaction } from "../types";
import { expenseUsesCard } from "../utils/monthComputation";

const PIX_TEAL = "#32BCAD";
const MP_BLUE = "#009EE3";
const MP_YELLOW = "#FFE600";

/** Ícone PIX (tom oficial BC) — losango sobre fundo teal. */
export function PixGlyph({ size = 14 }: { size?: number }) {
  const s = size;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 inline-block align-middle"
      aria-label="PIX"
      role="img"
    >
      <title>PIX</title>
      <rect width="24" height="24" rx="9" fill={PIX_TEAL} />
      <path fill="#fff" d="M12 7l5 5-5 5-5-5 5-5z" />
    </svg>
  );
}

/** Mini cartão por instituição (proporção ~1.6). */
export function MiniCardGlyph({ bankId }: { bankId: CardBankId }) {
  const w = 22;
  const h = 14;
  const rx = 3.6;

  if (bankId === "nubank") {
    return (
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 inline-block align-middle"
        aria-label="Cartão Nubank"
        role="img"
      >
        <title>Nubank</title>
        <rect width={w} height={h} rx={rx} fill="#820AD1" />
        <rect x="3.5" y="5" width="5.5" height="4" rx="0.6" fill="#E8DCC8" opacity={0.95} />
        <rect x="11" y="9.5" width="8" height="1.8" rx="0.35" fill="#fff" opacity={0.22} />
      </svg>
    );
  }

  if (bankId === "mercado_pago") {
    return (
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 inline-block align-middle"
        aria-label="Cartão Mercado Pago"
        role="img"
      >
        <title>Mercado Pago</title>
        <rect width={w} height={h} rx={rx} fill={MP_BLUE} />
        <rect x="3.5" y="5" width="5.5" height="4" rx="0.6" fill={MP_YELLOW} opacity={0.95} />
        <rect x="11" y="9.5" width="8" height="1.8" rx="0.35" fill={MP_YELLOW} opacity={0.22} />
      </svg>
    );
  }

  /* PicPay */
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 inline-block align-middle"
      aria-label="Cartão PicPay"
      role="img"
    >
      <title>PicPay</title>
      <rect width={w} height={h} rx={rx} fill="#21C25E" />
      <rect x="3.5" y="5" width="5.5" height="4" rx="0.6" fill="#fff" opacity={0.35} />
      <rect x="10.5" y="9.3" width="8.5" height="1.8" rx="0.35" fill="#fff" opacity={0.25} />
    </svg>
  );
}

type Props = {
  tx: Transaction;
  cards: PaymentCard[];
};

/** Glifo de forma de pagamento na lista de despesas (substitui texto «PIX» / «Cartão»). */
export function ExpensePaymentGlyph({ tx, cards }: Props) {
  if (expenseUsesCard(tx) && tx.cardId) {
    const c = cards.find((x) => x.id === tx.cardId);
    const bankId: CardBankId = c?.bankId ?? "nubank";
    return <MiniCardGlyph bankId={bankId} />;
  }
  return <PixGlyph />;
}
