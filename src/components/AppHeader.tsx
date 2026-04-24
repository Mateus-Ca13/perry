import { fmtHeaderToday } from "../utils/format";

export function AppHeader() {
  return (
    <div className="px-5 pt-2 pb-2">

      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 mt-4 ">
          <img src="/pwa-512.png" alt="Perry" className="w-13 h-13 rounded-xl" />
        
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--app-text)" }}>
            Perry
          </h1>
          <p
          className="text-sm font-semibold"
          style={{ color: "var(--app-muted)" }}
        >
          Gerenciador de Despesas
        </p>
          </div>
        </div>
              
        <p className="text-sm font-medium" style={{ color: "var(--app-muted)" }}>
          {fmtHeaderToday()}
        </p>
        </div>
        
        
      
      
    </div>
  );
}
