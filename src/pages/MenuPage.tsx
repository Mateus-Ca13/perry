import { useCallback, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Database, CreditCard, Moon, Sun, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { SubPageLayout } from "../components/SubPageLayout";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { useTheme } from "../context/ThemeContext";
import { downloadPerryBackupFile, importPerryBackupFromObject } from "../utils/backup";
import { clearAllAppDataStorage } from "../utils/storage";

function SettingsRow({
  icon: Icon,
  label,
  description,
  children,
}: {
  icon: typeof Moon;
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5"
      style={{ borderBottom: "1px solid var(--app-border)" }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: "var(--app-dock-active)" }}
      >
        <Icon className="w-5 h-5" strokeWidth={2} style={{ color: "var(--app-accent)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--app-text)" }}>
          {label}
        </p>
        {description ? (
          <p className="text-xs mt-0.5" style={{ color: "var(--app-muted)" }}>
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function MenuPage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [clearOpen, setClearOpen] = useState(false);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingImportJson, setPendingImportJson] = useState<unknown>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useBodyScrollLock(clearOpen || importConfirmOpen);

  const onConfirmClear = useCallback(() => {
    clearAllAppDataStorage();
    setClearOpen(false);
    window.location.replace("/");
  }, []);

  const onPickImportFile = useCallback(() => {
    setImportError(null);
    fileInputRef.current?.click();
  }, []);

  const onFileInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const parsed: unknown = JSON.parse(text);
        setPendingImportJson(parsed);
        setImportConfirmOpen(true);
      } catch {
        setImportError("Ficheiro JSON inválido ou corrompido.");
      }
    };
    reader.onerror = () => {
      setImportError("Não foi possível ler o ficheiro.");
    };
    reader.readAsText(file, "utf-8");
  }, []);

  const onConfirmImport = useCallback(() => {
    if (pendingImportJson == null) return;
    const result = importPerryBackupFromObject(pendingImportJson);
    if (!result.ok) {
      setImportError(result.error);
      setImportConfirmOpen(false);
      setPendingImportJson(null);
      return;
    }
    setImportConfirmOpen(false);
    setPendingImportJson(null);
    window.location.reload();
  }, [pendingImportJson]);

  return (
    <SubPageLayout title="Menu">
      <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: "var(--app-muted)" }}>
        Aparência
      </p>
      <div
        className="rounded-2xl overflow-hidden mb-8"
        style={{
          backgroundColor: "var(--app-card)",
          boxShadow: "var(--app-card-shadow)",
        }}
      >
        <SettingsRow
          icon={isDark ? Moon : Sun}
          label="Tema escuro"
          description={isDark ? "Ativado" : "Desativado"}
        >
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            onClick={toggleTheme}
            className="relative w-12 h-7 rounded-full shrink-0"
            style={{
              backgroundColor: isDark ? "#34C759" : "var(--app-toggle-off)",
              transition: "background-color 0.25s ease",
            }}
          >
            <div
              className="absolute top-0.5 w-6 h-6 rounded-full bg-white"
              style={{
                left: isDark ? 22 : 2,
                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                transition: "left 0.25s cubic-bezier(0.16,1,0.3,1)",
              }}
            />
          </button>
        </SettingsRow>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: "var(--app-muted)" }}>
        Cartões
      </p>
      <div
        className="rounded-2xl overflow-hidden mb-6"
        style={{
          backgroundColor: "var(--app-card)",
          boxShadow: "var(--app-card-shadow)",
        }}
      >
        <Link
          to="/cartoes"
          className="flex items-center gap-3 px-4 py-3.5 active:opacity-80"
          style={{ borderBottom: "1px solid var(--app-border)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--app-dock-active)" }}
          >
            <CreditCard className="w-5 h-5" strokeWidth={2} style={{ color: "var(--app-accent)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--app-text)" }}>
              Gerenciar cartões
            </p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--app-muted)" }}>
              Nubank, Mercado Pago, PicPay e faturas por cartão
            </p>
          </div>
          <span className="text-sm font-semibold shrink-0" style={{ color: "var(--app-accent)" }}>
            Abrir
          </span>
        </Link>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: "var(--app-muted)" }}>
        Dados
      </p>
      <div
        className="rounded-2xl overflow-hidden mb-8"
        style={{
          backgroundColor: "var(--app-card)",
          boxShadow: "var(--app-card-shadow)",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-hidden
          onChange={onFileInputChange}
        />
        <SettingsRow
          icon={Database}
          label="Importar e exportar dados"
          description="Transações, recorrência, cartões e meses concluídos. O tema não entra no ficheiro."
        >
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setImportError(null);
                downloadPerryBackupFile();
              }}
              className="shrink-0 text-sm font-semibold px-3 py-2 rounded-xl active:opacity-70"
              style={{
                color: "var(--app-accent)",
                backgroundColor: "color-mix(in srgb, var(--app-accent) 12%, transparent)",
              }}
            >
              Exportar
            </button>
            <button
              type="button"
              onClick={onPickImportFile}
              className="shrink-0 text-sm font-semibold px-3 py-2 rounded-xl active:opacity-70"
              style={{ color: "var(--app-text)", backgroundColor: "var(--app-input-bg)" }}
            >
              Importar
            </button>
          </div>
        </SettingsRow>
        {importError ? (
          <p
            className="px-4 pb-3 text-xs leading-relaxed -mt-1"
            style={{ color: "#FF3B30" }}
            role="alert"
          >
            {importError}
          </p>
        ) : null}
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={importError ? { borderTop: "1px solid var(--app-border)" } : undefined}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "color-mix(in srgb, #FF3B30 12%, transparent)" }}
          >
            <Trash2 className="w-5 h-5" strokeWidth={2} style={{ color: "#FF3B30" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--app-text)" }}>
              Limpar dados
            </p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--app-muted)" }}>
              Remove lançamentos e regras de recorrência deste aparelho. A preferência de tema fica
              salva.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setClearOpen(true)}
            className="shrink-0 text-sm font-semibold px-3 py-2 rounded-xl active:opacity-70"
            style={{ color: "#FF3B30", backgroundColor: "rgba(255,59,48,0.1)" }}
          >
            Limpar
          </button>
        </div>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: "var(--app-muted)" }}>
        Sobre
      </p>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--app-card)",
          boxShadow: "var(--app-card-shadow)",
        }}
      >
        <div className="px-4 py-4">
          <p className="text-sm font-semibold" style={{ color: "var(--app-text)" }}>
            Perry
          </p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--app-muted)" }}>
            Gerenciador de despesas, receitas e aportes. Seus dados ficam neste dispositivo.
          </p>
        </div>
      </div>

      {importConfirmOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-5"
          style={{ backgroundColor: "var(--app-modal-scrim)" }}
          onClick={() => {
            setImportConfirmOpen(false);
            setPendingImportJson(null);
          }}
        >
          <div
            role="alertdialog"
            aria-labelledby="import-title"
            className="w-full max-w-sm rounded-2xl p-5 shadow-xl"
            style={{ backgroundColor: "var(--app-card)", boxShadow: "var(--app-card-shadow)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="import-title" className="text-lg font-bold mb-2" style={{ color: "var(--app-text)" }}>
              Substituir dados com este backup?
            </h2>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--app-muted)" }}>
              Isto apaga o que está no armazenamento local e aplica o conteúdo do ficheiro. A
              preferência de tema não muda. Não dá para desfazer.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setImportConfirmOpen(false);
                  setPendingImportJson(null);
                }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold active:scale-[0.98]"
                style={{ backgroundColor: "var(--app-input-bg)", color: "var(--app-text)" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirmImport}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white active:scale-[0.98]"
                style={{ backgroundColor: "var(--app-accent)" }}
              >
                Restaurar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {clearOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-5"
          style={{ backgroundColor: "var(--app-modal-scrim)" }}
          onClick={() => setClearOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-title"
            className="w-full max-w-sm rounded-2xl p-5 shadow-xl"
            style={{ backgroundColor: "var(--app-card)", boxShadow: "var(--app-card-shadow)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="clear-title" className="text-lg font-bold mb-2" style={{ color: "var(--app-text)" }}>
              Apagar todos os dados?
            </h2>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--app-muted)" }}>
              Isto apaga as transações e a recorrência guardadas no navegador. Não dá para desfazer.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setClearOpen(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold active:scale-[0.98]"
                style={{ backgroundColor: "var(--app-input-bg)", color: "var(--app-text)" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirmClear}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white active:scale-[0.98]"
                style={{ backgroundColor: "#FF3B30" }}
              >
                Apagar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </SubPageLayout>
  );
}
