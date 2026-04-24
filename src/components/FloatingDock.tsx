import { Banknote, House, LineChart, Menu, Plus, Receipt } from "lucide-react";
import { NavLink } from "react-router-dom";

type Props = { onAddClick: () => void };

function DockNavLink({
  to,
  children,
  icon: Icon,
  end,
}: {
  to: string;
  children: string;
  icon: typeof Receipt;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 basis-0 py-1.5 px-0.5 rounded-xl text-[10px] font-semibold leading-tight transition-colors ${
          isActive ? "opacity-100" : "opacity-70 active:opacity-100"
        }`
      }
      style={({ isActive }) => ({
        color: isActive ? "var(--app-accent)" : "var(--app-muted)",
        backgroundColor: isActive ? "var(--app-dock-active)" : "transparent",
      })}
    >
      <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
      <span className="truncate w-full text-center">{children}</span>
    </NavLink>
  );
}

/** Altura aproximada da barra + safe area — usada para posicionar o + acima dela */
const DOCK_OFFSET = "4.75rem";

export function FloatingDock({ onAddClick }: Props) {
  return (
    <>
      <button
        type="button"
        onClick={onAddClick}
        className="fixed z-[60] w-14 h-14 rounded-full flex items-center justify-center pointer-events-auto active:scale-90"
        style={{
          right: "max(1rem, env(safe-area-inset-right))",
          bottom: `calc(max(0.5rem, env(safe-area-inset-bottom)) + ${DOCK_OFFSET})`,
          backgroundColor: "var(--app-accent)",
          boxShadow: "0 4px 16px color-mix(in srgb, var(--app-accent) 45%, transparent)",
          transition: "transform 0.2s cubic-bezier(0.175,0.885,0.32,1.275)",
        }}
        aria-label="Nova transação"
      >
        <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
      </button>

      <div
        className="fixed inset-x-0 bottom-0 z-50 flex justify-center pointer-events-none box-border"
        style={{
          paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
          paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
          paddingRight: "max(0.75rem, env(safe-area-inset-right))",
        }}
      >
        <div
          className="pointer-events-auto flex w-full max-w-lg mx-auto items-stretch rounded-2xl py-1.5 pl-1 pr-1 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.45)] border border-solid box-border overflow-hidden"
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

          <DockNavLink to="/" icon={House} end>
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
