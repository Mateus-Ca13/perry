import { useCallback, useState, type ReactNode } from "react";
import { Moon, Sun, Trash2 } from "lucide-react";
import { SubPageLayout } from "../components/SubPageLayout";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { useTheme } from "../context/ThemeContext";
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
  useBodyScrollLock(clearOpen);

  const onConfirmClear = useCallback(() => {
    clearAllAppDataStorage();
    setClearOpen(false);
    window.location.replace("/");
  }, []);

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
        Dados
      </p>
      <div
        className="rounded-2xl overflow-hidden mb-8"
        style={{
          backgroundColor: "var(--app-card)",
          boxShadow: "var(--app-card-shadow)",
        }}
      >
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: "1px solid var(--app-border)" }}
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
