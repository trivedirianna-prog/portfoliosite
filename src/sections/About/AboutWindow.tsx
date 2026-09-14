import { useId } from "react";
import { Window } from "../../windows/Window";
import { useWindowManager } from "../../windows/WindowManager";
import {
  JOURNAL_COVER,
  JOURNAL_GUTTER_PATH,
  JOURNAL_PAGES_PATH,
  JOURNAL_RIBBON_PATH,
} from "./journalArt";
import "./AboutWindow.css";

/*
  About's window (§7.3/§7.4 test case) — reuses the EXACT SAME journal
  path data as the desktop icon (About.tsx), just rendered much larger,
  so this is genuinely "the real journal shape already built," not a
  generic rectangle standing in for it. Content is placeholder/lorem —
  real About copy is a later phase; this pass only proves out
  open/close/minimize/focus against the simplest real object.
*/
export function AboutWindow({ windowId }: { windowId: string }) {
  const { closeWindow, minimizeWindow, focusWindow, focusedId } =
    useWindowManager();
  const uid = useId();
  const pagesGradId = `${uid}-pages`;

  return (
    <Window
      title="About"
      focused={focusedId === windowId}
      onFocus={() => focusWindow(windowId)}
      onClose={() => closeWindow(windowId)}
      onMinimize={() => minimizeWindow(windowId)}
    >
      <div className="about-window">
        <svg
          className="about-window__art"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={pagesGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" className="about-object__stop-page-a" />
              <stop offset="100%" className="about-object__stop-page-b" />
            </linearGradient>
          </defs>

          <g transform="translate(10,18) rotate(-14)">
            <rect
              width={JOURNAL_COVER.width}
              height={JOURNAL_COVER.height}
              rx={JOURNAL_COVER.rx}
              className="about-object__cover"
            />
          </g>

          <path
            className="about-object__pages"
            d={JOURNAL_PAGES_PATH}
            fill={`url(#${pagesGradId})`}
          />
          <path className="about-object__gutter" d={JOURNAL_GUTTER_PATH} fill="none" />

          <path className="about-object__ribbon" d={JOURNAL_RIBBON_PATH} />
        </svg>

        {/* Real HTML content laid over the page area (roughly x:30-70,
            y:28-72 of the same 0-100 space the art above uses), kept
            clear of the ribbon (~x:60-86) and the cover's corner. */}
        <div className="about-window__content">
          <p className="about-window__placeholder-tag label-mono">
            placeholder — real copy next phase
          </p>
          <h2 className="about-window__heading">Rianna Trivedi</h2>
          <p className="about-window__body-text">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        </div>
      </div>
    </Window>
  );
}
