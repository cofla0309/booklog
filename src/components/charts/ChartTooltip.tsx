import type { ReactNode } from "react";

interface ChartTooltipProps {
  state: { visible: boolean; x: number; y: number; content: ReactNode };
}

export function ChartTooltip({ state }: ChartTooltipProps) {
  return (
    <div className={`tooltip${state.visible ? " on" : ""}`} style={{ left: state.x, top: state.y }}>
      {state.content}
    </div>
  );
}
