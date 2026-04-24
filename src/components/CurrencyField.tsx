import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";

const MAX_CENTS = 99_999_999_999;

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
};

function parsePropToCents(v: string): number {
  if (v === "" || v === undefined) return 0;
  const n = parseFloat(String(v).replace(",", "."));
  if (Number.isNaN(n)) return 0;
  return Math.min(Math.round(n * 100), MAX_CENTS);
}

function centsToPropString(cents: number): string {
  if (cents <= 0) return "";
  return (cents / 100).toFixed(2);
}

function formatBRL(cents: number): string {
  if (cents <= 0) return "";
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function CurrencyField({
  value,
  onChange,
  disabled,
  placeholder = "0,00",
  id,
}: Props) {
  const [cents, setCents] = useState(() => parsePropToCents(value));
  const lastEmittedRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const normalized = value === "" || value === undefined ? "" : String(value);
    if (normalized !== lastEmittedRef.current) {
      lastEmittedRef.current = normalized;
      setCents(parsePropToCents(normalized));
    }
  }, [value]);

  const commitCents = (next: number) => {
    const capped = Math.min(Math.max(0, Math.floor(next)), MAX_CENTS);
    setCents(capped);
    const s = centsToPropString(capped);
    lastEmittedRef.current = s;
    onChange(s);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      setCents((c) => {
        const next = Math.min(c * 10 + parseInt(e.key, 10), MAX_CENTS);
        const s = centsToPropString(next);
        lastEmittedRef.current = s;
        onChange(s);
        return next;
      });
      return;
    }
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      setCents((c) => {
        const next = Math.floor(c / 10);
        const s = centsToPropString(next);
        lastEmittedRef.current = s;
        onChange(s);
        return next;
      });
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    e.preventDefault();
    const raw = e.clipboardData.getData("text");
    const digits = raw.replace(/\D/g, "");
    if (!digits) {
      commitCents(0);
      return;
    }
    const asInt = parseInt(digits, 10);
    if (!Number.isNaN(asInt)) commitCents(asInt);
  };

  const display = formatBRL(cents);

  return (
    <div
      className="flex items-center w-full px-4 py-3 rounded-xl gap-1.5"
      style={{ backgroundColor: "var(--app-input-bg)" }}
    >
      <span
        className="text-base font-semibold shrink-0 select-none"
        style={{ color: "var(--app-muted)" }}
        aria-hidden
      >
        R$
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        readOnly
        value={display}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 min-w-0 text-base outline-none bg-transparent disabled:opacity-50 cursor-text"
        style={{ color: "var(--app-text)" }}
        aria-label="Valor em reais"
      />
    </div>
  );
}
