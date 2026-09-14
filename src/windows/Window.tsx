import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap, Draggable } from "../lib/gsap";
import type { OriginRect } from "./types";
import "./Window.css";

/*
  Generic window chrome (§7.3). Every window is a plain rectangle
  (gentle corner rounding only) with a real title bar spanning its top
  edge — no per-section silhouette here by default; a window CAN add its
  own outer silhouette via `className` (e.g. Projects' three windows
  each needing a genuinely different shape/silhouette per §8.3, while
  still sharing this exact title bar/button chrome underneath).

  First attempt reused each object's own tiny icon silhouette (e.g. the
  journal's page/ribbon outline) scaled up as the entire window shape.
  That read as unreadable at window scale and overlapped neighboring
  desktop elements. Reverted per direction: every window's BASE shape is
  this same rectangle; sections differentiate through content/material/
  color (and now, optionally, an outer silhouette tweak) rather than a
  wholesale shape swap.

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
  the bar surface behind them varies per section. A window can add one
  more control of its own (`extraControl`, e.g. Committees' §9 discovery
  toggle) — it renders with this exact same chip, never a bespoke style,
  so a per-window action still reads as part of the one shared system.

  The body (children) is otherwise unstyled here; each section's own
  window content owns its background/padding/decoration.

  §9's "physical opening" motion: when `originRect` is supplied (the
  spawning object's own on-screen rect — see WindowManager's
  originRects), the window animates in from that rect's position/scale
  instead of simply appearing at its resting spot, and retracts back to
  it on close instead of just vanishing. Minimize retracts too, but
  toward the object's corner (roughly where its dock tab lands) rather
  than its center, and shrinks much further — "tucking away to a small
  tab," not "returning to the object itself." All three are quick,
  easing-only GSAP tweens (no spring/bounce) per the "calm by default,
  responsive when touched" motion principle. Without an originRect,
  open/close/minimize are instant, same as before — this is additive,
  not a requirement every caller has to satisfy.

  §7.2 dragging: every window is draggable by its title bar (GSAP
  Draggable), session-only — there is no persisted position anywhere, so
  a fresh open/restore always starts back at its designed spot rather
  than remembering where it was last dragged. The open/close tweens
  above used to `clearProps` the transform back to plain CSS once
  settled; that's removed now, since dragging needs GSAP to keep owning
  this element's transform continuously from mount (a `.to()` tween or a
  Draggable instance both need to read the CURRENT tracked x/y, which is
  only reliable if GSAP never hands control back to a bare CSS rule
  mid-lifetime) — the settled values are visually identical to the old
  CSS rule either way, so nothing looks different at rest.
*/

interface WindowProps {
  title: string;
  material: "glossy" | "paper";
  /** Heavier shadow/presence — for a window meant to read as visually
   *  weightier than a sibling opened at the same time (e.g. About's
   *  photo window vs. its text window, §8.1), independent of z-order/
   *  focus. */
  emphasis?: boolean;
  /** Extra class(es) on the root `.window` element — for a window that
   *  needs its own outer silhouette (border-radius/clip-path/accent
   *  border) on top of the shared rectangle base, e.g. Projects' three
   *  distinctly-shaped windows (§8.3). Never touches the title bar/
   *  button chrome, which stays identical regardless. */
  className?: string;
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
  /** Whether the OPEN animation emerges from `originRect` (default,
   *  matching every other window's initial appearance). Set false for a
   *  window whose one spawning object sits off in a corner (§3's scatter
   *  layout) and shouldn't read as "anchored" there even momentarily —
   *  it then simply grows in already centered instead. The CLOSE
   *  retract-to-icon motion is unaffected either way and still uses
   *  `originRect` whenever it's present. */
  openFromOrigin?: boolean;
  /** An optional third title-bar control, sharing the exact same chip
   *  treatment as minimize/close (§7.3's "shared system fingerprint" —
   *  every window uses the same title-label/lighting/glossiness
   *  language regardless of its own content) rather than inventing a
   *  new button style per window. For a per-window secondary action
   *  (e.g. Committees' §9 discovery toggle) that still belongs to the
   *  same hardware-control language. Rendered before minimize/close. */
  extraControl?: {
    label: string;
    pressed?: boolean;
    onClick: () => void;
    icon: ReactNode;
  };
  children: ReactNode;
}

const OPEN_DURATION = 0.32;
const CLOSE_DURATION = 0.22;
const MINIMIZE_DURATION = 0.24;
// Minimize shrinks toward roughly where the dock tab will appear — the
// object's own top-right corner (§7.4's default tab position; the
// secondary/tertiary corner variants a multi-window section uses are
// close enough to this same corner that a single generic target reads
// correctly for all of them) — rather than the object's center, which
// is what close's own retract-to-icon already uses. Ending far smaller
// than close's own endScale (which settles at the object's full size)
// since the destination is a small tab, not the object itself.
const MINIMIZE_END_SCALE = 0.16;

export function Window({
  title,
  material,
  emphasis = false,
  className,
  focused,
  onFocus,
  onClose,
  onCloseStart,
  onMinimize,
  style,
  originRect,
  openFromOrigin = true,
  extraControl,
  children,
}: WindowProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const titlebarRef = useRef<HTMLDivElement>(null);

  // Runs once per mount — every fresh open AND every restore-from-minimize
  // is a fresh mount (WindowHost only renders "open" windows), so this
  // naturally replays on both, not just the very first open. Also where
  // dragging gets wired up, since it needs the same continuously-GSAP-
  // owned transform the open/close tweens rely on.
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    if (originRect && openFromOrigin) {
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
        },
      );
    } else if (originRect) {
      // openFromOrigin is false: this window's own centered resting spot
      // IS its open position (no emerge-from-icon travel) — a plain
      // grow-in-place, still establishing GSAP's continuous ownership of
      // the transform (needed for Draggable) from these same resting
      // x/y values rather than the icon's.
      gsap.fromTo(
        el,
        { xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 0.94, opacity: 0 },
        {
          xPercent: -50,
          yPercent: -50,
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          duration: OPEN_DURATION,
          ease: "power2.out",
        },
      );
    } else {
      // No emerge animation to establish GSAP's ownership of this
      // element's transform — set the same resting values a plain
      // `gsap.set` (not a tween) that Draggable below still needs to
      // track x/y reliably from a known baseline.
      gsap.set(el, { xPercent: -50, yPercent: -50, x: 0, y: 0 });
    }

    const [draggable] = titlebarRef.current
      ? Draggable.create(el, {
          type: "x,y",
          trigger: titlebarRef.current,
          allowContextMenu: true,
        })
      : [];

    return () => {
      draggable?.kill();
    };
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
    // Relative deltas (not absolute x/y targets) — the window may have
    // been dragged since it opened, so "how far from HERE to the icon"
    // is what matters, not a value computed as if it were still resting
    // at its original undragged position.
    const dx = originRect.x + originRect.width / 2 - (rect.x + rect.width / 2);
    const dy = originRect.y + originRect.height / 2 - (rect.y + rect.height / 2);
    const endScale = Math.max(
      0.2,
      Math.min(originRect.width / rect.width, originRect.height / rect.height),
    );

    gsap.to(el, {
      xPercent: -50,
      yPercent: -50,
      x: `+=${dx}`,
      y: `+=${dy}`,
      scale: endScale,
      opacity: 0,
      duration: CLOSE_DURATION,
      ease: "power1.in",
      onComplete: onClose,
    });
  }

  function handleMinimize(e: React.MouseEvent) {
    e.stopPropagation();
    const el = rootRef.current;
    if (!el || !originRect) {
      onMinimize();
      return;
    }

    const rect = el.getBoundingClientRect();
    // Target the object's own top-right corner rather than its center —
    // "tucking away to the dock," not "returning to the object" (that's
    // close's own destination point). Relative deltas for the same
    // reason as handleClose: the window may have been dragged since it
    // opened.
    const dx = originRect.x + originRect.width - rect.x - rect.width / 2;
    const dy = originRect.y - rect.y - rect.height / 2;

    gsap.to(el, {
      xPercent: -50,
      yPercent: -50,
      x: `+=${dx}`,
      y: `+=${dy}`,
      scale: MINIMIZE_END_SCALE,
      opacity: 0,
      duration: MINIMIZE_DURATION,
      ease: "power1.in",
      onComplete: onMinimize,
    });
  }

  return (
    <div
      ref={rootRef}
      className={`window window--${material}${emphasis ? " window--emphasis" : ""}${focused ? " window--focused" : ""}${className ? ` ${className}` : ""}`}
      style={style}
      onPointerDown={onFocus}
    >
      <div className="window__titlebar" ref={titlebarRef}>
        <span className="window__label label-mono">{title}</span>
        <div className="window__controls">
          {extraControl && (
            <button
              type="button"
              className="window__control"
              aria-label={extraControl.label}
              aria-pressed={extraControl.pressed}
              onClick={(e) => {
                e.stopPropagation();
                extraControl.onClick();
              }}
            >
              {extraControl.icon}
            </button>
          )}
          <button
            type="button"
            className="window__control window__control--minimize"
            aria-label={`Minimize ${title}`}
            onClick={handleMinimize}
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
