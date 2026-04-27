export function fmt(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const today = new Date();
  const t = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const y2 = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  if (iso === t) return "Hoje";
  if (iso === y2) return "Ontem";
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

export function groupLabel(iso: string): string {
  const d = fmtDate(iso);
  if (d === "Hoje" || d === "Ontem") return d;
  const [y, m, dd] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, dd);
  const weekday = date.toLocaleDateString("pt-BR", { weekday: "long" });
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${String(dd).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Data de hoje no topo do app (sem rótulo “Hoje”/“Ontem”). */
export function fmtHeaderToday(): string {
  return new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Rótulo curto do dia na lista da home: «Hoje», «Ontem» ou «10 de abr.». */
export function fmtListDay(iso: string): string {
  const rel = fmtDate(iso);
  if (rel === "Hoje" || rel === "Ontem") return rel;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}
