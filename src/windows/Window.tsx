import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap, Draggable } from "../lib/gsap";
import { useIsMirror } from "./mirrorContext";
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
// How much breathing room a window's edge must keep from the viewport
// edge — matches --space-4. A window's resting spot (the default center,
// or a section's own off-center spawn point like the Projects fan-out's
// percentages in projectFan.ts) is tuned against typical viewport
// proportions but isn't guaranteed to leave enough room at every real
// screen size — e.g. the fan-out's ~28% top anchor plus a project
// window's own ~440px content height only clears a viewport taller than
// ~786px, clipping the title bar off-screen on a real 1366x768 laptop.
// Rather than hand-tune each spawn point against every possible
// viewport, every window clamps its OWN rendered position at runtime.
const WINDOW_EDGE_MARGIN = 16;

// Extra x/y translation (added on top of a window's natural CSS-resting
// transform) needed to keep the span [start, start+extent] within
// [margin, viewportExtent - margin]. When the window itself is wider/
// taller than the viewport minus both margins, keeps the LEADING edge
// (top/left — where the title bar and its controls live) on-screen
// rather than the trailing edge, since a clipped title bar is the
// visibly broken part.
function clampAxisDelta(
  start: number,
  end: number,
  viewportExtent: number,
  margin = WINDOW_EDGE_MARGIN,
) {
  let delta = 0;
  if (start + delta < margin) {
    delta = margin - start;
  }
  const overflowEnd = end + delta - (viewportExtent - margin);
  if (overflowEnd > 0) {
    const pulled = -overflowEnd;
    if (start + delta + pulled >= margin) {
      delta += pulled;
    }
  }
  return delta;
}
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
  const draggableRef = useRef<Draggable | null>(null);
  const openAnimationRef = useRef<gsap.core.Tween | null>(null);
  const isMirror = useIsMirror();

  // Runs once per mount — every fresh open AND every restore-from-minimize
  // is a fresh mount (WindowHost only renders "open" windows), so this
  // naturally replays on both, not just the very first open. Also where
  // dragging gets wired up, since it needs the same continuously-GSAP-
  // owned transform the open/close tweens rely on.
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    if (isMirror) {
      // The live desktop mirror (Take Two, §8.3) always shows the
      // settled state directly — no emerge animation, regardless of
      // originRect, and no Draggable below (the whole mirror is
      // non-interactive anyway).
      gsap.set(el, { xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 1, opacity: 1 });
      return;
    }

    // React StrictMode (dev only) deliberately double-invokes this effect
    // (mount -> cleanup -> mount again) on the SAME DOM node without an
    // actual unmount in between. The first invocation's gsap.fromTo below
    // writes its FROM state (small scale, translated toward the origin
    // icon) onto `el` immediately/synchronously — so without this reset,
    // the second invocation's measurement below would read THAT
    // transient, already-transformed box back as if it were the window's
    // natural resting position, computing a near-zero travel distance for
    // the tween that actually ends up persisting (the second one, since
    // it's the later gsap.fromTo call targeting the same element/
    // properties). That collapses the whole emerge-from-origin motion
    // down to what looks like a plain opacity fade — killing any tween
    // still targeting this element and clearing its transform/opacity
    // back to plain CSS guarantees the measurement below always reflects
    // the TRUE CSS-resting box, no matter how many times this runs.
    gsap.killTweensOf(el);
    gsap.set(el, { clearProps: "transform,opacity" });

    // Measure the window's NATURAL resting position — however its CSS
    // (the shared centered default, or a section's own off-center style
    // like the Projects fan-out) would place it before any GSAP x/y is
    // applied — and correct for whatever part of it the real viewport
    // can't actually fit, rather than trusting the percentage alone.
    const naturalRect = el.getBoundingClientRect();
    const restX = clampAxisDelta(naturalRect.left, naturalRect.right, window.innerWidth);
    const restY = clampAxisDelta(naturalRect.top, naturalRect.bottom, window.innerHeight);

    if (originRect && openFromOrigin) {
      const dx =
        originRect.x + originRect.width / 2 - (naturalRect.x + naturalRect.width / 2 + restX);
      const dy =
        originRect.y + originRect.height / 2 - (naturalRect.y + naturalRect.height / 2 + restY);
      const startScale = Math.max(
        0.2,
        Math.min(originRect.width / naturalRect.width, originRect.height / naturalRect.height),
      );

      openAnimationRef.current = gsap.fromTo(
        el,
        { xPercent: -50, yPercent: -50, x: dx, y: dy, scale: startScale, opacity: 0 },
        {
          xPercent: -50,
          yPercent: -50,
          x: restX,
          y: restY,
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
      openAnimationRef.current = gsap.fromTo(
        el,
        { xPercent: -50, yPercent: -50, x: restX, y: restY, scale: 0.94, opacity: 0 },
        {
          xPercent: -50,
          yPercent: -50,
          x: restX,
          y: restY,
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
      gsap.set(el, { xPercent: -50, yPercent: -50, x: restX, y: restY });
    }

    const [draggable] = titlebarRef.current
      ? Draggable.create(el, {
          type: "x,y",
          trigger: titlebarRef.current,
          allowContextMenu: true,
          // The cursor system (§13) can't tell "actively dragging" from
          // hover alone — mid-drag the pointer may end up over arbitrary
          // content, including past the viewport edge — so this dispatches
          // plain DOM events the Cursor component listens for directly,
          // rather than this generic window needing to know anything
          // about the cursor itself.
          onDragStart: () => window.dispatchEvent(new Event("cursor:drag-start")),
          onDragEnd: function (this: Draggable) {
            const point = this.pointerEvent as MouseEvent | undefined;
            window.dispatchEvent(
              new CustomEvent("cursor:drag-end", {
                detail: { x: point?.clientX ?? 0, y: point?.clientY ?? 0 },
              }),
            );
          },
        })
      : [];
    draggableRef.current = draggable ?? null;

    return () => {
      draggable?.kill();
    };
    // Intentionally run once per mount only (see comment above) — a fresh
    // originRect on a later render must not replay the animation on an
    // already-open, already-settled window.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-clamp whenever the window's on-screen box might no longer fit:
  // either the VIEWPORT changed (browser resized, or a maximized/
  // fullscreen window's real dimensions only settle after mount), or the
  // window's OWN content grew after its initial mount-time measurement —
  // e.g. a project window's screenshot `<img>` has no reserved aspect
  // ratio, so it loads in and reflows the window taller some tens/
  // hundreds of ms after open, after the mount-time clamp already ran
  // against the shorter, image-less layout. A ResizeObserver only fires
  // for genuine layout/content-box size changes, never for the open
  // animation's own `scale` transform (transforms don't affect layout
  // size), so it doesn't fight that animation — except when a reflow
  // happens to land WHILE that animation is still running, in which case
  // this waits for it to finish (via its promise) before measuring,
  // rather than measuring a mid-tween, not-yet-settled position.
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el || isMirror) return;

    function reclamp() {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dx = clampAxisDelta(rect.left, rect.right, window.innerWidth);
      const dy = clampAxisDelta(rect.top, rect.bottom, window.innerHeight);
      if (dx || dy) {
        gsap.set(el, { x: `+=${dx}`, y: `+=${dy}` });
        draggableRef.current?.update(true);
      }
    }

    function handlePotentialReflow() {
      const active = openAnimationRef.current;
      if (active?.isActive()) {
        active.then(reclamp);
        return;
      }
      reclamp();
    }

    window.addEventListener("resize", handlePotentialReflow);
    const observer = new ResizeObserver(handlePotentialReflow);
    observer.observe(el);
    return () => {
      window.removeEventListener("resize", handlePotentialReflow);
      observer.disconnect();
    };
  }, [isMirror]);

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
