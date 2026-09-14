import { useId, useRef } from "react";
import { useSectionWindow } from "../../windows/useSectionWindow";
import { useWindowManager } from "../../windows/WindowManager";
import { openClusterPair } from "../../windows/windowCluster";
import {
  JOURNAL_COVER,
  JOURNAL_GUTTER_PATH,
  JOURNAL_PAGES_PATH,
  JOURNAL_RIBBON_PATH,
} from "./journalArt";
import "./About.css";

/*
  Journal (§8.1) — paper material, flat plum-700 cover. Shown OPEN, not
  closed: the cover is folded back at an angle (mostly hidden behind the
  page block, just a corner/edge showing), the pages themselves fan out
  in a soft curve, and a ribbon bookmark drapes off at a natural
  diagonal rather than hanging straight down.

  Also the test case for the generic window system (§7.3/§7.4), and for
  §8.1's two-windows-at-once behavior: clicking spawns AboutWindow (text)
  AND AboutPhotoWindow (photo) together, not staggered. Each is its own
  independent WindowState (see useSectionWindow's "content"/"photo"
  kinds), so each minimizes to its OWN small tab rendered right here,
  next to this same icon — local docking, not a taskbar.

  While either window is open, `.section-object--windows-open` hides this
  object's own resting caption and dims the icon slightly — otherwise the
  plain "About" label sits stranded behind/beside the open windows,
  reading like stray leftover UI rather than "this is the active source."
*/
export function About() {
  const uid = useId();
  const pagesGradId = `${uid}-pages`;
  const iconRef = useRef<HTMLButtonElement>(null);
  const { setOriginRect } = useWindowManager();
  const content = useSectionWindow("about", "content");
  const photo = useSectionWindow("about", "photo");
  const windowsOpen = content.isOpen || photo.isOpen;

  function handleOpen() {
    if (iconRef.current) {
      setOriginRect("about", iconRef.current.getBoundingClientRect());
    }
    // content (text) is PRIMARY — ends up on top; photo is EMPHASIS —
    // its heavier look comes from its own shadow/framing, not from
    // being the topmost layer. See windowCluster.ts for the ordering.
    openClusterPair(content, photo);
  }

  return (
    <div
      className={`section-object section-object--about${windowsOpen ? " section-object--windows-open" : ""}`}
    >
      <button
        ref={iconRef}
        type="button"
        className="section-object__hit-area"
        onClick={handleOpen}
        aria-label="Open About"
      >
        <svg
          className="section-object__art"
          viewBox="0 0 100 100"
          role="img"
          aria-label="About"
        >
          <defs>
            {/* Same pearl -> pearl-dim vertical gradient .material-paper
                itself uses. */}
            <linearGradient id={pagesGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" className="about-object__stop-page-a" />
              <stop offset="100%" className="about-object__stop-page-b" />
            </linearGradient>
          </defs>

          {/* Cover, folded back behind the open pages — only its left
              edge/corner still visible. */}
          <g transform="translate(10,18) rotate(-14)">
            <rect
              width={JOURNAL_COVER.width}
              height={JOURNAL_COVER.height}
              rx={JOURNAL_COVER.rx}
              className="about-object__cover"
            />
          </g>

          {/* Open pages, fanned rather than a flat rectangle. */}
          <path
            className="about-object__pages"
            d={JOURNAL_PAGES_PATH}
            fill={`url(#${pagesGradId})`}
          />
          <path className="about-object__gutter" d={JOURNAL_GUTTER_PATH} fill="none" />
          <line x1="44" y1="42" x2="64" y2="38" className="about-object__line" />
          <line x1="44" y1="52" x2="60" y2="48" className="about-object__line" />

          {/* Ribbon bookmark, draping off at a diagonal past the page
              edge, ending in a V-notch. */}
          <path className="about-object__ribbon" d={JOURNAL_RIBBON_PATH} />
        </svg>
      </button>

      {content.isMinimized && (
        <button
          type="button"
          className="section-object__dock-tab label-mono"
          onClick={() => {
            if (iconRef.current) {
              setOriginRect("about", iconRef.current.getBoundingClientRect());
            }
            content.restore();
          }}
        >
          About
        </button>
      )}
      {photo.isMinimized && (
        <button
          type="button"
          className="section-object__dock-tab section-object__dock-tab--secondary label-mono"
          onClick={() => {
            if (iconRef.current) {
              setOriginRect("about", iconRef.current.getBoundingClientRect());
            }
            photo.restore();
          }}
        >
          Photo
        </button>
      )}

      <span className="section-object__caption label-mono">About</span>
    </div>
  );
}
