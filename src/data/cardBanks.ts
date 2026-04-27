import type { CardBankId } from "../types";

export type BankPreset = {
  id: CardBankId;
  label: string;
  accent: string;
};

export const CARD_BANK_PRESETS: BankPreset[] = [
  {
    id: "nubank",
    label: "Nubank",
    accent: "#820AD1",
  },
  {
    id: "mercado_pago",
    label: "Mercado Pago",
    accent: "#009EE3",
  },
  {
    id: "picpay",
    label: "PicPay",
    accent: "#21C25E",
  },
];

export function bankPresetById(id: CardBankId): BankPreset | undefined {
  return CARD_BANK_PRESETS.find((b) => b.id === id);
}
