import type { ReactNode } from "react";
import "./Window.css";

/*
  Generic window chrome (§7.3): every window shares this same title-label
  chip and glossy lighting treatment regardless of its own silhouette — a
  journal-shaped window, a CD-case-shaped window (later phase), etc. all
  get the identical floating label+controls cluster. The shape-specific
  body (art + content) is passed as children entirely undecorated, so
  nothing here constrains what shape a window can be.

  The label/controls float ABOVE the body as a small chip rather than a
  full-width rectangular title bar precisely because the body's outline
  is not assumed to be a rectangle — a title bar spanning "the top" of an
  open-book silhouette would either overflow its narrow corners or get
  clipped by them. A small centered chip works for any silhouette.
*/

interface WindowProps {
  title: string;
  focused: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  style?: React.CSSProperties;
  children: ReactNode;
}

export function Window({
  title,
  focused,
  onFocus,
  onClose,
  onMinimize,
  style,
  children,
}: WindowProps) {
  return (
    <div
      className={`window${focused ? " window--focused" : ""}`}
      style={style}
      onPointerDown={onFocus}
    >
      <div className="window__chrome">
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
          />
          <button
            type="button"
            className="window__control window__control--close"
            aria-label={`Close ${title}`}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          />
        </div>
      </div>
      <div className="window__body">{children}</div>
    </div>
  );
}
