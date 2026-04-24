import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Rola a janela para o topo quando a rota (path) muda. */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
