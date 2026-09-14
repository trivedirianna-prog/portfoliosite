import { Window } from "../../windows/Window";
import { useWindowManager } from "../../windows/WindowManager";
import "./EducationWindow.css";

/*
  Education's window (§8.2) — the catalog/index card's single window,
  reusing the generic system built for About: same paper-family title
  bar/button chrome, same emerge-from/retract-to-the-card motion via
  originRect (see WindowManager.originRects, keyed by "education").

  Wider than the shared 460px default (min(90vw, 600px)) — this is meant
  to read as a substantial document, not a compact card; EducationWindow.css
  carries the matching larger padding/spacing/type scale so the extra
  size reads as room to breathe, not empty margin.

  Content is two deliberately different registers, per direction:

  1. HEADLINE — the current degree, largest/primary content. GPA and
     Honors sit directly beneath it as plain supporting lines, still
     part of this "current program" block (not archival styling).
  2. SUPPORTING RECORD — the pre-college school record, styled as a
     stamped/annotated slip (dashed attach-line, slight rotation, a
     stamp reusing the desktop icon's own ring+dot motif) rather than
     plain bullets. The CET percentile gets a hand-circled mark and
     magenta emphasis, since it's the most specific/hardest-earned of
     the three figures.

  All figures are the real, verified numbers — nothing here is invented.
*/
export function EducationWindow({ windowId }: { windowId: string }) {
  const { closeWindow, minimizeWindow, focusWindow, focusedId, originRects } =
    useWindowManager();

  return (
    <Window
      title="Education"
      material="paper"
      focused={focusedId === windowId}
      onFocus={() => focusWindow(windowId)}
      onClose={() => closeWindow(windowId)}
      onMinimize={() => minimizeWindow(windowId)}
      originRect={originRects.education ?? null}
      style={{ width: "min(90vw, 600px)" }}
    >
      <div className="education-window">
        <div className="education-window__headline">
          <h2 className="education-window__degree">
            B.Tech Computer Engineering
          </h2>
          <p className="education-window__school">
            D.J. Sanghvi College of Engineering
          </p>
          <p className="education-window__years">
            2025–2029 — currently second year
          </p>
          <p className="education-window__stat">
            First year GPA: <strong>9.5</strong>
          </p>
          <p className="education-window__stat">
            Honors: <strong>Principles of Financial Engineering</strong>
          </p>
        </div>

        <div className="education-window__record">
          <svg
            className="education-window__stamp"
            viewBox="0 0 40 40"
            aria-hidden="true"
          >
            <circle cx="20" cy="20" r="15" className="education-window__stamp-ring" />
            <circle cx="20" cy="20" r="9.5" className="education-window__stamp-dot" />
          </svg>

          <p className="education-window__record-label label-mono--bold">
            Chatrabhuj Narsee School
          </p>

          <div className="education-window__record-row">
            <span className="education-window__record-key label-mono">
              10th Grade
            </span>
            <span className="education-window__record-value">98.2%</span>
          </div>
          <div className="education-window__record-row">
            <span className="education-window__record-key label-mono">
              12th Grade
            </span>
            <span className="education-window__record-value">89.5%</span>
          </div>
          <div className="education-window__record-row education-window__record-row--cet">
            <span className="education-window__record-key label-mono">
              CET Percentile
            </span>
            <span className="education-window__record-value education-window__record-value--cet">
              99.3374755
            </span>
          </div>
        </div>
      </div>
    </Window>
  );
}
