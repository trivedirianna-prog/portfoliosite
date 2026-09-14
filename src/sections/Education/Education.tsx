import { useRef } from "react";
import { useSectionWindow } from "../../windows/useSectionWindow";
import { useWindowManager } from "../../windows/WindowManager";
import "./Education.css";

/*
  Catalog/index card (§8.2) — paper material, pearl-dim base. Rotated
  off-axis, with an irregular deckled top edge (the silhouette itself is
  uneven, not a clean rectangle corner) instead of the placeholder's
  clean square. A small stamped circle accent and two printed line
  details keep it reading as an index card rather than blank stock.

  Single-window section, reusing the same generic system built for About
  (§7.3/§7.4): tactile press feedback on click, the window emerging from
  (and retracting back to) this card's own screen position via
  WindowManager's originRects, and standard local-dock minimize — no
  taskbar. See EducationWindow.tsx for the record itself.
*/
export function Education() {
  const iconRef = useRef<HTMLButtonElement>(null);
  const { setOriginRect } = useWindowManager();
  const card = useSectionWindow("education");

  function handleOpen() {
    if (iconRef.current) {
      setOriginRect("education", iconRef.current.getBoundingClientRect());
    }
    card.openOrRestore();
  }

  return (
    <div
      className={`section-object section-object--education${card.isOpen ? " section-object--windows-open" : ""}`}
    >
      <button
        ref={iconRef}
        type="button"
        className="section-object__hit-area"
        onClick={handleOpen}
        aria-label="Open Education"
      >
        <svg
          className="section-object__art"
          viewBox="0 0 100 100"
          role="img"
          aria-label="Education"
        >
          <g transform="translate(20,15) rotate(-8)">
            <path
              className="education-object__card"
              d="M2,8 Q6,0 10,7 Q14,1 19,6 Q23,-1 28,5 Q32,0 37,6
                 Q41,1 46,7 Q50,2 54,8
                 L54,64 Q54,68 50,68 L6,68 Q2,68 2,64 Z"
            />
            <line x1="10" y1="24" x2="40" y2="24" className="education-object__line" />
            <line x1="10" y1="31" x2="32" y2="31" className="education-object__line" />

            {/* Stamped circle accent. */}
            <g transform="translate(40,50) rotate(-14)">
              <circle r="10.5" className="education-object__stamp-ring" />
              <circle r="7" className="education-object__stamp" />
            </g>
          </g>
        </svg>
      </button>

      {card.isMinimized && (
        <button
          type="button"
          className="section-object__dock-tab label-mono"
          onClick={() => {
            if (iconRef.current) {
              setOriginRect("education", iconRef.current.getBoundingClientRect());
            }
            card.restore();
          }}
        >
          Education
        </button>
      )}

      <span className="section-object__caption label-mono">Education</span>
    </div>
  );
}
