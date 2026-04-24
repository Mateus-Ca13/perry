import type { ReactNode } from "react";

/** Largura máxima do “telefone” no desktop; evita layout esticado em telas largas. */
const SHELL = "w-full min-w-0 max-w-lg min-h-dvh";

type Props = { children: ReactNode };

export function AppContentShell({ children }: Props) {
  return (
    <div
      className="min-h-dvh w-full flex justify-center"
      style={{ backgroundColor: "var(--app-page)" }}
    >
      <div className={SHELL} style={{ backgroundColor: "var(--app-page)" }}>
        {children}
      </div>
    </div>
  );
}
