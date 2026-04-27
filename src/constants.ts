import {
  Bitcoin,
  Briefcase,
  Car,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  LineChart,
  Package,
  PawPrint,
  Percent,
  PiggyBank,
  TrendingUp,
  Tv,
  Utensils,
  Wallet,
} from "lucide-react";
import type { CategoryDef } from "./types";

export const STORAGE_KEY = "perry_transactions";
export const RECURRING_RULES_KEY = "perry_recurring_rules";
/** Migração one-shot de projeção `fixed` → regras + ocorrências. */
export const RECURRING_MIGRATION_V1_KEY = "perry_recurring_migrated_v1";
/** YYYY-MM dos meses já encerrados via "Concluir mês" (evita duplicar a sobra). */
export const CLOSED_MONTHS_KEY = "perry_closed_months";
/** Mês de hoje + os próximos, total; só gera ocorrências nessa janela. */
export const RECURRING_WINDOW_MONTHS = 6;

export const MONTHS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export const EXPENSE_CATS: CategoryDef[] = [
  { id: "alimentacao", label: "Alimentação", Icon: Utensils },
  { id: "moradia", label: "Moradia", Icon: Home },
  { id: "transporte", label: "Transporte", Icon: Car },
  { id: "saude", label: "Saúde", Icon: HeartPulse },
  { id: "educacao", label: "Educação", Icon: GraduationCap },
  { id: "assinaturas", label: "Assinaturas", Icon: Tv },
  { id: "lazer", label: "Lazer", Icon: Gamepad2 },
  { id: "pets", label: "Pets", Icon: PawPrint },
  { id: "impostos", label: "Impostos", Icon: Percent },
  { id: "outros_d", label: "Outros", Icon: Package },
];

export const INCOME_CATS: CategoryDef[] = [
  { id: "salario", label: "Salário", Icon: Briefcase },
  { id: "extra", label: "Renda Extra", Icon: Wallet },
  { id: "freelance", label: "Freelance", Icon: Laptop },
  { id: "investimentos", label: "Investimentos", Icon: TrendingUp },
  { id: "outros_r", label: "Outros", Icon: Gift },
];

/** Aportes / reserva para investir (dinheiro que sai do saldo do mês). */
export const INVESTMENT_CATS: CategoryDef[] = [
  { id: "inv_rf", label: "Renda fixa", Icon: Landmark },
  { id: "inv_acoes", label: "Ações / FIIs", Icon: LineChart },
  { id: "inv_prev", label: "Previdência", Icon: PiggyBank },
  { id: "inv_cripto", label: "Cripto", Icon: Bitcoin },
  { id: "inv_outros", label: "Outros", Icon: TrendingUp },
];
