import type { ReactNode } from "react";
import "./Window.css";

/*
  Generic window shell. Per §7.3, every window shares the same title-label
  style and lighting/glossiness treatment regardless of its own silhouette
  — that shared chrome belongs here, with per-section content passed in as
  children. Not styled yet; this is structure only.
*/

interface WindowProps {
  title: string;
  children?: ReactNode;
}

export function Window({ title, children }: WindowProps) {
  return (
    <div className="window">
      <div className="window__title label-mono">{title}</div>
      <div className="window__content">{children}</div>
    </div>
  );
}
