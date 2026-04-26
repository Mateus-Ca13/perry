import type { LucideIcon } from "lucide-react";

export type TxType = "income" | "expense" | "investment";

/** Série recorrente (janela materializada; não se usa mais `fixed` para projeção). */
export interface RecurringRule {
  id: string;
  type: TxType;
  dayOfMonth: number;
  /** Mês de início (inclusive), formato YYYY-MM. */
  startMonth: string;
  description: string;
  category: string;
  defaultAmount: number;
  defaultPaid: boolean;
  active: boolean;
  /**
   * Mês (YYYY-MM) do último lançamento da série, inclusive, ao "parar" a recorrência.
   * Ocorrências em meses depois disso não devem existir; usado para limpar e não regenerar.
   */
  endAfterMonth?: string;
  /** Mês (YYYY-MM) em que a ocorrência foi apagada e não deve ser recriada. */
  excludedMonths: string[];
}

export interface Transaction {
  id: string;
  type: TxType;
  description: string;
  amount: number;
  date: string;
  category: string;
  /** @deprecated Só leitura legado; recorrência usa `recurrenceRuleId` + tabela de regras. */
  fixed: boolean;
  /** Despesas e investimentos: quitado/alocado. Receitas: sempre true ao salvar. */
  paid: boolean;
  _fromFixed?: boolean;
  /** Se definido, esta linha veio de uma `RecurringRule` ativa. */
  recurrenceRuleId?: string;
}

export interface MonthCursor {
  year: number;
  month: number;
}

export interface CategoryDef {
  id: string;
  label: string;
  Icon: LucideIcon;
}

export interface MonthSummary {
  income: number;
  expense: number;
  investment: number;
  balance: number;
}

/** Payload do modal: extras para criar série ou encerrar recorrência. */
export type SaveTransactionPayload = Omit<Transaction, "id"> & {
  id?: string;
  isNewRecurring?: boolean;
  endRecurrence?: boolean;
};
