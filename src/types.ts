import type { LucideIcon } from "lucide-react";

export type TxType = "income" | "expense" | "investment";

export interface Transaction {
  id: string;
  type: TxType;
  description: string;
  amount: number;
  date: string;
  category: string;
  fixed: boolean;
  /** Despesas e investimentos: quitado/alocado. Receitas: sempre true ao salvar. */
  paid: boolean;
  _fromFixed?: boolean;
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
