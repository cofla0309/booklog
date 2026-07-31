import type { ReactNode } from "react";
import { useCallback, useState } from "react";

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: ReactNode;
}

export function useChartTooltip() {
  const [state, setState] = useState<TooltipState>({ visible: false, x: 0, y: 0, content: null });

  const show = useCallback((content: ReactNode, evt: React.MouseEvent) => {
    const pad = 12;
    let x = evt.clientX + pad;
    let y = evt.clientY - 40;
    if (x + 160 > window.innerWidth - 8) x = evt.clientX - 160 - pad;
    if (y < 8) y = evt.clientY + pad;
    setState({ visible: true, x, y, content });
  }, []);

  const hide = useCallback(() => setState((s) => ({ ...s, visible: false })), []);

  return { state, show, hide };
}
