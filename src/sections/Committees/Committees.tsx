import { useRef } from "react";
import { useSectionWindow } from "../../windows/useSectionWindow";
import { useWindowManager } from "../../windows/WindowManager";
import "./Committees.css";

/*
  Card wallet (§8.4) — paper material, chrome-100 base with a plum-600
  edge stripe. Two cards fan out at an angle like a loose hand of cards
  rather than flat edges peeking straight up from a sleeve — drawn
  BEFORE the wallet body so its top edge naturally occludes their lower
  portions, reading as cards tucked into (and spilling out of) the
  wallet rather than floating above it.

  Single-window section, reusing the same generic system built for
  About/Education (§7.3/§7.4): tactile press feedback on click, the
  window emerging from/retracting to this wallet's own screen position
  via WindowManager's originRects, and standard local-dock minimize — no
  taskbar. See CommitteesWindow.tsx for the two membership cards.
*/
export function Committees() {
  const iconRef = useRef<HTMLButtonElement>(null);
  const { setOriginRect } = useWindowManager();
  const wallet = useSectionWindow("committees");

  function handleOpen() {
    if (iconRef.current) {
      setOriginRect("committees", iconRef.current.getBoundingClientRect());
    }
    wallet.openOrRestore();
  }

  return (
    <div
      className={`section-object section-object--committees${wallet.isOpen ? " section-object--windows-open" : ""}`}
    >
      <button
        ref={iconRef}
        type="button"
        className="section-object__hit-area"
        onClick={handleOpen}
        aria-label="Open Committees"
      >
        <svg
          className="section-object__art"
          viewBox="0 0 100 100"
          role="img"
          aria-label="Committees"
        >
          <g transform="translate(30,28) rotate(-15)">
            <rect
              width="34"
              height="48"
              rx="4"
              className="committees-object__card committees-object__card--a"
            />
            <line x1="7" y1="14" x2="27" y2="14" className="committees-object__line" />
          </g>
          <g transform="translate(48,24) rotate(12)">
            <rect
              width="34"
              height="48"
              rx="4"
              className="committees-object__card committees-object__card--b"
            />
            <line x1="7" y1="14" x2="27" y2="14" className="committees-object__line" />
          </g>

          {/* Wallet body, rendered last so it occludes the cards' bases. */}
          <g transform="translate(14,58)">
            <rect width="62" height="34" rx="6" className="committees-object__wallet" />
            <path
              d="M0,6 Q0,0 6,0 L14,0 L14,34 L6,34 Q0,34 0,28 Z"
              className="committees-object__stripe"
            />
          </g>
        </svg>
      </button>

      {wallet.isMinimized && (
        <button
          type="button"
          className="section-object__dock-tab label-mono"
          onClick={() => {
            if (iconRef.current) {
              setOriginRect("committees", iconRef.current.getBoundingClientRect());
            }
            wallet.restore();
          }}
        >
          Committees
        </button>
      )}

      <span className="section-object__caption label-mono">Committees</span>
    </div>
  );
}
