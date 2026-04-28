import { useEffect } from "react";

/**
 * Evita rolagem do conteúdo por trás de overlays (modal).
 * Usa contador de profundidade: vários modais em sequência / sobrepostos não
 * desbloqueiam o body antes da hora; o último a fechar restaura tudo.
 */
type Frozen = {
  scrollY: number;
  bodyOverflow: string;
  bodyPosition: string;
  bodyTop: string;
  bodyLeft: string;
  bodyRight: string;
  bodyWidth: string;
  rootOverflow: string;
};

let lockDepth = 0;
let frozen: Frozen | null = null;

function applyLock(scrollY: number) {
  const body = document.body;
  const root = document.documentElement;
  frozen = {
    scrollY,
    bodyOverflow: body.style.overflow,
    bodyPosition: body.style.position,
    bodyTop: body.style.top,
    bodyLeft: body.style.left,
    bodyRight: body.style.right,
    bodyWidth: body.style.width,
    rootOverflow: root.style.overflow,
  };
  root.style.overflow = "hidden";
  body.style.overflow = "hidden";
  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
}

function releaseLock() {
  if (!frozen) {
    lockDepth = 0;
    return;
  }
  const body = document.body;
  const root = document.documentElement;
  const f = frozen;
  frozen = null;
  lockDepth = 0;
  root.style.overflow = f.rootOverflow;
  body.style.overflow = f.bodyOverflow;
  body.style.position = f.bodyPosition;
  body.style.top = f.bodyTop;
  body.style.left = f.bodyLeft;
  body.style.right = f.bodyRight;
  body.style.width = f.bodyWidth;
  const y = f.scrollY;
  requestAnimationFrame(() => {
    window.scrollTo(0, y);
  });
}

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    if (lockDepth === 0) {
      applyLock(window.scrollY);
    }
    lockDepth += 1;

    return () => {
      lockDepth -= 1;
      if (lockDepth <= 0) {
        releaseLock();
      }
    };
  }, [locked]);
}
