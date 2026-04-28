import { Banknote, House, LineChart, Menu, Plus, Receipt } from "lucide-react";
import { NavLink } from "react-router-dom";

type Props = { onAddClick: () => void };

function DockNavLink({
  to,
  children,
  icon: Icon,
  end,
  accentSolidWhenActive,
}: {
  to: string;
  children: string;
  icon: typeof Receipt;
  end?: boolean;
  /** Ativo: fundo accent + branco (como o +). Inativo: só texto em azul, sem fundo. */
  accentSolidWhenActive?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-1 min-w-0 flex-1 basis-0 py-2 px-0.5 rounded-xl text-xs font-semibold leading-tight tracking-tight transition-[color,background-color,box-shadow,opacity] ${
          isActive || accentSolidWhenActive ? "opacity-100" : "opacity-70 active:opacity-100"
        }`
      }
      style={({ isActive }) => {
        if (accentSolidWhenActive && isActive) {
          return {
            color: "#ffffff",
            backgroundColor: "var(--app-accent)",
            boxShadow: "0 4px 16px color-mix(in srgb, var(--app-accent) 45%, transparent)",
          };
        }
        if (accentSolidWhenActive && !isActive) {
          return {
            color: "color-mix(in srgb, var(--app-accent) 72%, var(--app-text))",
            backgroundColor: "transparent",
          };
        }
        return {
          color: isActive ? "var(--app-accent)" : "var(--app-muted)",
          backgroundColor: isActive ? "var(--app-dock-active)" : "transparent",
        };
      }}
    >
      {({ isActive }) => (
        <>
          <Icon
            className="w-6 h-6 shrink-0"
            strokeWidth={accentSolidWhenActive && isActive ? 2.5 : 2}
          />
          <span className="truncate w-full text-center">{children}</span>
        </>
      )}
    </NavLink>
  );
}

/** Altura aproximada da barra + safe area — usada para posicionar o + acima dela */
const DOCK_OFFSET = "4.75rem";

export function FloatingDock({ onAddClick }: Props) {
  return (
    <>
      <div
        className="fixed z-[60] left-0 right-0 flex justify-center pointer-events-none"
        style={{
          bottom: `calc(max(0.5rem, env(safe-area-inset-bottom)) + ${DOCK_OFFSET})`,
        }}
      >
        <div
          className="w-full max-w-lg flex justify-end pointer-events-none"
          style={{ paddingRight: "max(1rem, env(safe-area-inset-right))" }}
        >
          <button
            type="button"
            onClick={onAddClick}
            className="w-14 h-14 rounded-full flex items-center justify-center pointer-events-auto active:scale-90 shrink-0"
            style={{
              backgroundColor: "var(--app-accent)",
              boxShadow: "0 4px 16px color-mix(in srgb, var(--app-accent) 45%, transparent)",
              transition: "transform 0.2s cubic-bezier(0.175,0.885,0.32,1.275)",
            }}
            aria-label="Nova transação"
          >
            <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-50 flex justify-center pointer-events-none box-border"
        style={{
          paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
          paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
          paddingRight: "max(0.75rem, env(safe-area-inset-right))",
        }}
      >
        <div
          className="pointer-events-auto flex w-full max-w-lg mx-auto items-stretch gap-1.5 rounded-2xl py-1.5 px-1.5 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.45)] border border-solid box-border overflow-hidden"
          style={{
            backgroundColor: "var(--app-dock-bg)",
            borderColor: "var(--app-border)",
          }}
        >
          <DockNavLink to="/receitas" icon={Banknote}>
            Receitas
          </DockNavLink>
          <DockNavLink to="/despesas" icon={Receipt}>
            Despesas
          </DockNavLink>

          <DockNavLink to="/" icon={House} end accentSolidWhenActive>
            Início
          </DockNavLink>

          <DockNavLink to="/investimentos" icon={LineChart}>
            Aportes
          </DockNavLink>
          <DockNavLink to="/menu" icon={Menu}>
            Menu
          </DockNavLink>
        </div>
      </div>
    </>
  );
}
