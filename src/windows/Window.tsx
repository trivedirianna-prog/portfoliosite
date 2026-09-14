import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "../lib/gsap";
import type { OriginRect } from "./types";
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

  §9's "physical opening" motion: when `originRect` is supplied (the
  spawning object's own on-screen rect — see WindowManager's
  originRects), the window animates in from that rect's position/scale
  instead of simply appearing at its resting spot, and retracts back to
  it on close instead of just vanishing. Both are quick, easing-only GSAP
  tweens (no spring/bounce) per the "calm by default, responsive when
  touched" motion principle. Without an originRect, open/close are
  instant, same as before — this is additive, not a requirement every
  caller has to satisfy.
*/

interface WindowProps {
  title: string;
  material: "glossy" | "paper";
  /** Heavier shadow/presence — for a window meant to read as visually
   *  weightier than a sibling opened at the same time (e.g. About's
   *  photo window vs. its text window, §8.1), independent of z-order/
   *  focus. */
  emphasis?: boolean;
  focused: boolean;
  onFocus: () => void;
  onClose: () => void;
  /** Fires the instant the close animation begins (before the retract
   *  tween/unmount) — for a caller that has its own attached UI (e.g.
   *  About's ribbon-triggered detail) that should start retracting in
   *  step with the window, rather than just vanishing at unmount. */
  onCloseStart?: () => void;
  onMinimize: () => void;
  style?: React.CSSProperties;
  /** The spawning object's screen rect (see WindowManager.originRects) —
   *  when present, this window emerges from/retracts to it. */
  originRect?: OriginRect | null;
  children: ReactNode;
}

const OPEN_DURATION = 0.32;
const CLOSE_DURATION = 0.22;

export function Window({
  title,
  material,
  emphasis = false,
  focused,
  onFocus,
  onClose,
  onCloseStart,
  onMinimize,
  style,
  originRect,
  children,
}: WindowProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Runs once per mount — every fresh open AND every restore-from-minimize
  // is a fresh mount (WindowHost only renders "open" windows), so this
  // naturally replays on both, not just the very first open.
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el || !originRect) return;

    const rect = el.getBoundingClientRect();
    const dx = originRect.x + originRect.width / 2 - (rect.x + rect.width / 2);
    const dy = originRect.y + originRect.height / 2 - (rect.y + rect.height / 2);
    const startScale = Math.max(
      0.2,
      Math.min(originRect.width / rect.width, originRect.height / rect.height),
    );

    gsap.fromTo(
      el,
      { xPercent: -50, yPercent: -50, x: dx, y: dy, scale: startScale, opacity: 0 },
      {
        xPercent: -50,
        yPercent: -50,
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        duration: OPEN_DURATION,
        ease: "power2.out",
        clearProps: "transform,opacity",
      },
    );
    // Intentionally run once per mount only (see comment above) — a fresh
    // originRect on a later render must not replay the animation on an
    // already-open, already-settled window.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose(e: React.MouseEvent) {
    e.stopPropagation();
    onCloseStart?.();
    const el = rootRef.current;
    if (!el || !originRect) {
      onClose();
      return;
    }

    const rect = el.getBoundingClientRect();
    const dx = originRect.x + originRect.width / 2 - (rect.x + rect.width / 2);
    const dy = originRect.y + originRect.height / 2 - (rect.y + rect.height / 2);
    const endScale = Math.max(
      0.2,
      Math.min(originRect.width / rect.width, originRect.height / rect.height),
    );

    gsap.fromTo(
      el,
      { xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 1, opacity: 1 },
      {
        xPercent: -50,
        yPercent: -50,
        x: dx,
        y: dy,
        scale: endScale,
        opacity: 0,
        duration: CLOSE_DURATION,
        ease: "power1.in",
        onComplete: onClose,
      },
    );
  }

  return (
    <div
      ref={rootRef}
      className={`window window--${material}${emphasis ? " window--emphasis" : ""}${focused ? " window--focused" : ""}`}
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
            onClick={handleClose}
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
