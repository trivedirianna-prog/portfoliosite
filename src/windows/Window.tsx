import type { ReactNode } from "react";
import "./Window.css";

/*
  Generic window chrome (§7.3). Every window is a plain rectangle
  (gentle corner rounding only) with a real title bar spanning its top
  edge — no per-section silhouette here.

  First attempt reused each object's own tiny icon silhouette (e.g. the
  journal's page/ribbon outline) scaled up as the entire window shape.
  That read as unreadable at window scale and overlapped neighboring
  desktop elements. Reverted per direction: every window, across every
  section, is this same rectangle; sections differentiate through
  content/material/color inside it, never through the outline.

  `material` picks which of the two established chrome recipes the
  title bar uses — glossy (Projects/Contact) or paper (About/Education/
  Committees) — so the bar itself still belongs to the section's own
  material family instead of being a generic OS-gray strip. The body
  (children) is otherwise unstyled here; each section's own window
  content owns its background/padding/decoration.
*/

interface WindowProps {
  title: string;
  material: "glossy" | "paper";
  focused: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  style?: React.CSSProperties;
  children: ReactNode;
}

export function Window({
  title,
  material,
  focused,
  onFocus,
  onClose,
  onMinimize,
  style,
  children,
}: WindowProps) {
  return (
    <div
      className={`window window--${material}${focused ? " window--focused" : ""}`}
      style={style}
      onPointerDown={onFocus}
    >
      <div className="window__titlebar">
        <span className="window__label label-mono">{title}</span>
        <div className="window__controls">
          <button
            type="button"
            className="window__control window__control--minimize"
            aria-label={`Minimize ${title}`}
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
          >
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <line x1="2.5" y1="6" x2="9.5" y2="6" />
            </svg>
          </button>
          <button
            type="button"
            className="window__control window__control--close"
            aria-label={`Close ${title}`}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <line x1="2.5" y1="2.5" x2="9.5" y2="9.5" />
              <line x1="9.5" y1="2.5" x2="2.5" y2="9.5" />
            </svg>
          </button>
        </div>
      </div>
      <div className="window__body">{children}</div>
    </div>
  );
}
