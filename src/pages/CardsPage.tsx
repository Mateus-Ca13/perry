import { useCallback, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { SubPageLayout } from "../components/SubPageLayout";
import { useCards } from "../context/CardsContext";
import { useTransactions } from "../context/TransactionsContext";
import type { CardBankId } from "../types";
import { bankPresetById, CARD_BANK_PRESETS } from "../data/cardBanks";
import { BankLogoMark } from "../components/BankLogoMark";

export function CardsPage() {
  const { cards, addCard, removeCard } = useCards();
  const { stripCardFromTransactions } = useTransactions();
  const [bankId, setBankId] = useState<CardBankId>("nubank");
  const [label, setLabel] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const onCreate = useCallback(() => {
    addCard(bankId, label);
    setLabel("");
  }, [addCard, bankId, label]);

  const confirmRemove = useCallback(
    (id: string) => {
      stripCardFromTransactions(id);
      removeCard(id);
      setRemovingId(null);
    },
    [removeCard, stripCardFromTransactions],
  );

  return (
    <SubPageLayout title="Cartões">
      <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--app-muted)" }}>
        Escolha o banco e um nome opcional. As despesas podem ser ligadas ao cartão na hora do
        lançamento.
      </p>

      <div
        className="rounded-2xl p-4 mb-6"
        style={{
          backgroundColor: "var(--app-card)",
          boxShadow: "var(--app-card-shadow)",
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--app-muted)" }}>
          Novo cartão
        </p>
        <label className="block mb-3">
          <span className="text-[11px] font-semibold block mb-1.5" style={{ color: "var(--app-muted)" }}>
            Banco
          </span>
          <div className="grid grid-cols-3 gap-2">
            {CARD_BANK_PRESETS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBankId(b.id)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl border border-solid active:scale-[0.98]"
                style={{
                  borderColor: bankId === b.id ? b.accent : "var(--app-border)",
                  backgroundColor: bankId === b.id ? `${b.accent}14` : "var(--app-input-bg)",
                }}
              >
                <BankLogoMark bankId={b.id} size="xs" />
                <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: "var(--app-text)" }}>
                  {b.label}
                </span>
              </button>
            ))}
          </div>
        </label>
        <label className="block mb-4">
          <span className="text-[11px] font-semibold block mb-1.5" style={{ color: "var(--app-muted)" }}>
            Nome no cartão (opcional)
          </span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex.: Crédito, corporativo…"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border border-solid"
            style={{
              backgroundColor: "var(--app-input-bg)",
              borderColor: "var(--app-border)",
              color: "var(--app-text)",
            }}
          />
        </label>
        <button
          type="button"
          onClick={onCreate}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 active:scale-[0.98]"
          style={{ backgroundColor: "var(--app-accent)" }}
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Criar cartão
        </button>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: "var(--app-muted)" }}>
        Seus cartões
      </p>
      <div
        className="rounded-2xl overflow-hidden mb-6"
        style={{
          backgroundColor: "var(--app-card)",
          boxShadow: "var(--app-card-shadow)",
        }}
      >
        {cards.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm" style={{ color: "var(--app-muted)" }}>
            Nenhum cartão ainda.
          </div>
        ) : (
          cards.map((c, i) => {
            const preset = bankPresetById(c.bankId);
            const name = c.label || preset?.label || c.bankId;
            return (
              <div
                key={c.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  borderBottom: i < cards.length - 1 ? "1px solid var(--app-border)" : undefined,
                }}
              >
                <BankLogoMark bankId={c.bankId} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--app-text)" }}>
                    {name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--app-muted)" }}>
                    {preset?.label ?? c.bankId}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRemovingId(c.id)}
                  className="shrink-0 p-2 rounded-lg active:opacity-70"
                  style={{ color: "#FF3B30", backgroundColor: "rgba(255,59,48,0.08)" }}
                  aria-label="Remover cartão"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {removingId ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-5"
          style={{ backgroundColor: "var(--app-modal-scrim)" }}
          onClick={() => setRemovingId(null)}
        >
          <div
            role="alertdialog"
            className="w-full max-w-sm rounded-2xl p-5"
            style={{ backgroundColor: "var(--app-card)", boxShadow: "var(--app-card-shadow)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-2" style={{ color: "var(--app-text)" }}>
              Remover cartão?
            </h2>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--app-muted)" }}>
              Os lançamentos deste cartão passam a aparecer como PIX. O registo mantém-se.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRemovingId(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: "var(--app-input-bg)", color: "var(--app-text)" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => removingId && confirmRemove(removingId)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: "#FF3B30" }}
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </SubPageLayout>
  );
}
