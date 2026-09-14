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
  Committees) — reproducing the REAL materials.css recipes (paper's dot-
  texture + gradient; glossy's gradient base + single highlight streak),
  not a flat recolor, so the bar still belongs to the section's own
  material family instead of being a generic OS-gray strip. Both bar
  variants get a translucent, slightly blurred background so the bar
  itself reads as a distinct layer above the content.

  Close/minimize are always small glossy chips regardless of the bar's
  own material — real "hardware" controls (like a physical window's
  buttons) stay one consistent language across every window, while only
  the bar surface behind them varies per section.

  The body (children) is otherwise unstyled here; each section's own
  window content owns its background/padding/decoration.
*/

interface WindowProps {
  title: string;
  material: "glossy" | "paper";
  /** Heavier shadow/presence — for a window meant to read as visually
   *  weightier than a sibling opened at the same time (e.g. About's
   *  photo window vs. its text window, §8.1), independent of z-order/
   *  focus. */
  emphasis?: boolean;
  /** Degrees to rotate the whole window, for an editorial cluster
   *  layout (§8.1, see windowCluster.ts) — composed with the base
   *  centering transform here rather than left for callers to
   *  reconstruct, since a plain inline `transform` would otherwise
   *  clobber the centering translate the stylesheet applies. */
  rotate?: number;
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
  emphasis = false,
  rotate,
  focused,
  onFocus,
  onClose,
  onMinimize,
  style,
  children,
}: WindowProps) {
  const resolvedStyle: React.CSSProperties | undefined =
    rotate === undefined
      ? style
      : { ...style, transform: `translate(-50%, -50%) rotate(${rotate}deg)` };

  return (
    <div
      className={`window window--${material}${emphasis ? " window--emphasis" : ""}${focused ? " window--focused" : ""}`}
      style={resolvedStyle}
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
