import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import type { CategoryDef } from "../types";
import type { SortMode } from "../utils/transactionListFilters";

type Props = {
  categories: CategoryDef[];
  categoryFilter: string;
  onCategoryFilter: (id: string) => void;
  sortMode: SortMode;
  onSortMode: (m: SortMode) => void;
  search: string;
  onSearch: (s: string) => void;
};

type SortField = "date" | "amount";
type SortDir = "asc" | "desc";

function parseSort(mode: SortMode): { field: SortField; dir: SortDir } {
  if (mode === "amount-asc" || mode === "amount-desc") {
    return { field: "amount", dir: mode === "amount-asc" ? "asc" : "desc" };
  }
  return { field: "date", dir: mode === "date-asc" ? "asc" : "desc" };
}

function toSortMode(field: SortField, dir: SortDir): SortMode {
  return `${field}-${dir}` as SortMode;
}

export function TransactionListToolbar({
  categories,
  categoryFilter,
  onCategoryFilter,
  sortMode,
  onSortMode,
  search,
  onSearch,
}: Props) {
  const [open, setOpen] = useState(false);
  const { field: sortField, dir: sortDir } = useMemo(() => parseSort(sortMode), [sortMode]);

  const filtersDirty = categoryFilter !== "all" || sortMode !== "date-desc";

  const selectClass =
    "w-full rounded-xl py-2.5 px-3 text-sm font-medium outline-none border border-solid cursor-pointer";

  const selectStyle = {
    backgroundColor: "var(--app-input-bg)",
    color: "var(--app-text)",
    borderColor: "var(--app-border)",
  } as const;

  useBodyScrollLock(open);

  return (
    <>
      <div className="flex gap-2 items-center mb-3">
        <div className="relative flex-1 min-w-0">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            strokeWidth={2}
            style={{ color: "var(--app-search-icon)" }}
          />
          <input
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="Buscar pelo nome…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="perry-search-input w-full rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none border border-solid shadow-sm"
            style={{
              backgroundColor: "var(--app-search-field-bg)",
              borderColor: "var(--app-search-field-border)",
              color: "var(--app-search-text)",
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative shrink-0 w-11 h-11 rounded-xl flex items-center justify-center active:opacity-80"
          style={{
            backgroundColor: "var(--app-card)",
            border: "1px solid var(--app-border)",
            boxShadow: "var(--app-card-shadow)",
            color: "var(--app-accent)",
          }}
          aria-label="Filtros e ordenação"
        >
          <SlidersHorizontal className="w-5 h-5" strokeWidth={2} />
          {filtersDirty ? (
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: "var(--app-accent)" }}
            />
          ) : null}
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[65] flex justify-end" role="dialog" aria-modal="true" aria-label="Filtros">
          <button
            type="button"
            className="absolute inset-0"
            style={{ backgroundColor: "var(--app-modal-scrim)" }}
            onClick={() => setOpen(false)}
            aria-label="Fechar"
          />
          <div
            className="relative h-full w-[min(100%,19rem)] flex flex-col shadow-2xl box-border"
            style={{
              backgroundColor: "var(--app-card)",
              animation: "slideInRight 0.22s ease-out",
              paddingRight: "env(safe-area-inset-right)",
              paddingTop: "env(safe-area-inset-top)",
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: "var(--app-border)" }}
            >
              <span className="text-sm font-semibold" style={{ color: "var(--app-text)" }}>
                Filtros
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center active:opacity-70"
                style={{ backgroundColor: "var(--app-input-bg)" }}
                aria-label="Fechar"
              >
                <X className="w-5 h-5" style={{ color: "var(--app-muted)" }} strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--app-muted)" }}>
                  Categoria
                </span>
                <select
                  value={categoryFilter}
                  onChange={(e) => onCategoryFilter(e.target.value)}
                  className={selectClass}
                  style={selectStyle}
                >
                  <option value="all">Todas</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--app-muted)" }}>
                  Ordenar por
                </span>
                <select
                  value={sortField}
                  onChange={(e) => {
                    const f = e.target.value as SortField;
                    onSortMode(toSortMode(f, sortDir));
                  }}
                  className={`${selectClass} mb-2`}
                  style={selectStyle}
                >
                  <option value="date">Data</option>
                  <option value="amount">Valor</option>
                </select>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--app-muted)" }}>
                    Ordem
                  </span>
                  <select
                    value={sortDir}
                    onChange={(e) => {
                      const d = e.target.value as SortDir;
                      onSortMode(toSortMode(sortField, d));
                    }}
                    className={selectClass}
                    style={selectStyle}
                  >
                    <option value="asc">Crescente</option>
                    <option value="desc">Decrescente</option>
                  </select>
                </label>
                <p className="text-[11px] mt-2 leading-snug" style={{ color: "var(--app-muted)" }}>
                  {sortField === "date"
                    ? sortDir === "asc"
                      ? "Mais antiga → mais nova"
                      : "Mais nova → mais antiga"
                    : sortDir === "asc"
                      ? "Menor valor → maior"
                      : "Maior valor → menor"}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
