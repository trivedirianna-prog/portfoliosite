import { useEffect, useId, useRef, useState } from "react";
import { gsap } from "../lib/gsap";
import "./Cursor.css";

type CursorState = "normal" | "clickable" | "draggable" | "text";

/*
  Custom cursor per §13 — glossy pink-purple arrow, the same material
  language as the rest of the glossy family (§10), not a new one-off
  style. Locked shape: always the recognizable arrow silhouette, even in
  its "text" state (§16 #7's open question is now resolved: styled
  differently, never swapped for an I-beam) — every state differentiates
  through scale/tilt/color/small-accent detail layered on the SAME
  glyph, never a shape change.

  State detection is generic/delegated rather than per-component: a
  single `mouseover` listener on `document` classifies whatever the
  pointer entered via a handful of selectors already used site-wide
  (every clickable control in this codebase really is a <button> or an
  <a href>, every draggable surface really is `.window__titlebar`, every
  text field really is `.contact-window__input`) — so no section or
  window file needs to import or wire anything itself.

  Dragging is the one state hover-detection alone can't cover correctly:
  mid-drag the pointer can end up over arbitrary content, including past
  the viewport edge, and releasing over a different interactive element
  needs to resolve to THAT element's own state, not whatever the drag
  started over. Window.tsx's own Draggable instance dispatches two plain
  DOM CustomEvents (cursor:drag-start / cursor:drag-end) that override
  hover-based detection for the exact duration of a real drag, then hand
  back to a fresh classification at the release point the instant it
  ends.

  Position tracking uses gsap.quickTo (its own short internal tween per
  call, driven by GSAP's ticker) rather than React state — a per-
  mousemove setState would re-render this whole subtree at mouse-move
  frequency. This keeps tracking off React entirely, so it stays smooth
  alongside any other concurrent GSAP animation (drag, window open/
  close, the CD-R fan-out) instead of competing with it for a render.

  Skipped entirely on coarse-pointer (touch) devices — §16 #8 defers
  mobile/responsive work, and a page with its native cursor hidden and
  no mouse to drive a custom one would leave a touch visitor with no
  pointer feedback at all.
*/

const CLICKABLE_SELECTOR = "button:not(:disabled), a[href]";
const DRAGGABLE_SELECTOR = ".window__titlebar";
const TEXT_SELECTOR = ".contact-window__input";

function classify(el: Element | null): CursorState {
  if (!el) return "normal";
  if (el.closest(TEXT_SELECTOR)) return "text";
  if (el.closest(CLICKABLE_SELECTOR)) return "clickable";
  if (el.closest(DRAGGABLE_SELECTOR)) return "draggable";
  return "normal";
}

export function Cursor() {
  const uid = useId();
  const gradId = `${uid}-arrow`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<CursorState>("normal");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const el = rootRef.current;
    if (!el) return;

    document.documentElement.classList.add("custom-cursor-active");

    const xTo = gsap.quickTo(el, "x", { duration: 0.12, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.12, ease: "power3" });

    let isDragging = false;

    function handleMove(e: MouseEvent) {
      xTo(e.clientX);
      yTo(e.clientY);
      setVisible(true);
    }

    function handleOver(e: MouseEvent) {
      if (isDragging) return; // drag events own state while active
      setState(classify(e.target as Element | null));
    }

    function handlePageLeave() {
      setVisible(false);
    }

    function handleDragStart() {
      isDragging = true;
      setState("draggable");
    }

    function handleDragEnd(e: Event) {
      isDragging = false;
      const point = (e as CustomEvent<{ x: number; y: number }>).detail;
      const target = point ? document.elementFromPoint(point.x, point.y) : null;
      setState(classify(target));
    }

    window.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseover", handleOver);
    document.addEventListener("mouseleave", handlePageLeave);
    window.addEventListener("cursor:drag-start", handleDragStart);
    window.addEventListener("cursor:drag-end", handleDragEnd);

    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseover", handleOver);
      document.removeEventListener("mouseleave", handlePageLeave);
      window.removeEventListener("cursor:drag-start", handleDragStart);
      window.removeEventListener("cursor:drag-end", handleDragEnd);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`cursor cursor--${state}${visible ? "" : " cursor--hidden"}`}
      aria-hidden="true"
    >
      <svg className="cursor__art" viewBox="0 0 24 28" role="presentation">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" className="cursor__stop-a" />
            <stop offset="100%" className="cursor__stop-b" />
          </linearGradient>
        </defs>

        {/* Arrow + its highlight + the drag "grip" ticks all rotate/scale
            together as one glyph per state; the text-state caret accent
            (below, outside this group) stays independently vertical. */}
        <g className="cursor__arrow-group">
          <path
            className="cursor__arrow"
            d="M1,1 L1,19 L5.5,15 L9,23.5 L12,22.2 L8.5,14 L15,13.5 Z"
            fill={`url(#${gradId})`}
          />
          <ellipse
            className="cursor__highlight"
            cx="4.4"
            cy="5.6"
            rx="2.4"
            ry="3.6"
            transform="rotate(-25 4.4 5.6)"
          />
          {/* Secondary "grip" indicator — a small physical cue read as
              texture/traction rather than a hand/fist icon, so the
              locked arrow silhouette never breaks (§13). */}
          <g className="cursor__grip">
            <line x1="2.6" y1="9" x2="6.6" y2="9" />
            <line x1="2.6" y1="11.4" x2="6.6" y2="11.4" />
          </g>
        </g>

        {/* Text-state accent — a thin vertical hint beside the arrow,
            deliberately not a full I-beam swap (§16 #7). */}
        <line className="cursor__caret" x1="19.5" y1="3" x2="19.5" y2="21" />
      </svg>
    </div>
  );
}
