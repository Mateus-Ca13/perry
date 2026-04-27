import { RECURRING_MIGRATION_V1_KEY } from "../constants";
import type { RecurringRule, Transaction } from "../types";
import { normalizeRecurringRule } from "./recurringMaterialize";
import {
  loadClosedMonths,
  loadRecurringRules,
  loadTransactions,
  normalizeTransaction,
  saveClosedMonthsList,
  saveRecurringRules,
  saveTransactions,
} from "./storage";

export const PERRY_BACKUP_VERSION = 1;

const YM_RE = /^\d{4}-\d{2}$/;

export type PerryBackupFile = {
  perryExportVersion: number;
  exportedAt: string;
  transactions: Transaction[];
  recurringRules: RecurringRule[];
  closedMonths: string[];
};

export function buildPerryBackupObject(): PerryBackupFile {
  return {
    perryExportVersion: PERRY_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    transactions: loadTransactions(),
    recurringRules: loadRecurringRules(),
    closedMonths: loadClosedMonths(),
  };
}

export function downloadPerryBackupFile(): void {
  const data = buildPerryBackupObject();
  const datePart = data.exportedAt.slice(0, 10);
  const filename = `perry-backup-${datePart}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Valida e grava no `localStorage`. O tema não é alterado.
 * Após sucesso, convém `location.reload()` para o Provider alinhar o estado.
 */
export function importPerryBackupFromObject(
  raw: unknown,
): { ok: true } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Ficheiro inválido: esperava um objecto JSON." };
  }
  const o = raw as Record<string, unknown>;
  const ver = o.perryExportVersion;
  if (ver != null && Number(ver) !== PERRY_BACKUP_VERSION) {
    return { ok: false, error: "Versão de backup não suportada." };
  }

  const txRaw = o.transactions;
  const rulesRaw = o.recurringRules;
  if (!Array.isArray(txRaw) || !Array.isArray(rulesRaw)) {
    return { ok: false, error: "O backup tem de incluir as listas de transações e de regras." };
  }

  const transactions: Transaction[] = [];
  for (const x of txRaw) {
    const t = normalizeTransaction(x);
    if (t) transactions.push(t);
  }
  if (txRaw.length > 0 && transactions.length === 0) {
    return { ok: false, error: "Nenhuma transação válida no ficheiro." };
  }

  const recurringRules: RecurringRule[] = [];
  for (const x of rulesRaw) {
    const r = normalizeRecurringRule(x);
    if (r) recurringRules.push(r);
  }
  if (rulesRaw.length > 0 && recurringRules.length === 0) {
    return { ok: false, error: "Nenhuma regra de recorrência válida no ficheiro." };
  }

  let closedMonths: string[] = [];
  if (o.closedMonths !== undefined) {
    if (!Array.isArray(o.closedMonths)) {
      return { ok: false, error: "O campo de meses concluídos (closedMonths) é inválido." };
    }
    closedMonths = o.closedMonths.filter(
      (x): x is string => typeof x === "string" && YM_RE.test(x),
    );
  }

  try {
    saveTransactions(transactions);
    saveRecurringRules(recurringRules);
    saveClosedMonthsList(closedMonths);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(RECURRING_MIGRATION_V1_KEY, "1");
    }
  } catch {
    return { ok: false, error: "Não foi possível guardar (espaço ou modo privado)." };
  }

  return { ok: true };
}
